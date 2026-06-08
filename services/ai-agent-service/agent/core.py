import asyncio
import logging
from typing import AsyncGenerator
import ollama as ollama_sdk
from agent.config import OLLAMA_HOST, OLLAMA_MODEL
from agent.models import ChatMessage
from tools.definitions import get_tools_for_role
from tools.executor import execute_tool, available_tool_names

logger = logging.getLogger(__name__)

_MAX_TOOL_ITERATIONS = 2

_SYSTEM_PROMPT = (
    "Tu es Aria, l'assistante IA de NovaCampus Alliance, un ERP universitaire. "
    "Tu aides les étudiants, enseignants et administrateurs avec leurs questions "
    "sur la plateforme : emploi du temps, notes, facturation, documents administratifs. "
    "Réponds toujours en français sauf si l'utilisateur écrit dans une autre langue. "
    "Sois concise, professionnelle et bienveillante. "
    "Si tu disposes d'un contexte documentaire, utilise-le pour répondre avec précision. "
    "Lorsque tu utilises un outil, présente les résultats de façon claire et structurée. "
    "Ne propose que des informations ou des actions à confirmer par l'utilisateur ; "
    "ne jamais exécuter d'actions critiques de façon autonome."
)


async def _build_context(message: str, history: list[ChatMessage], user_role: str):
    """Returns (messages, tools, chunks) ready for Ollama. RAG + health check run in parallel."""
    loop = asyncio.get_running_loop()

    async def _rag():
        try:
            from rag.retriever import retrieve
            return await loop.run_in_executor(None, lambda: retrieve(message))
        except Exception:
            return []

    chunks, reachable = await asyncio.gather(_rag(), available_tool_names())

    system = _SYSTEM_PROMPT + f"\nRôle de l'utilisateur connecté : {user_role}."
    if chunks:
        system += "\n\nContexte documentaire NovaCampus :\n" + "\n\n".join(f"- {c}" for c in chunks)

    msgs: list[dict] = [{"role": "system", "content": system}]
    for h in history:
        msgs.append({"role": h.role, "content": h.content})
    msgs.append({"role": "user", "content": message})

    tools = [t for t in get_tools_for_role(user_role) if t["function"]["name"] in reachable]

    return msgs, tools, chunks


async def _run_tool_loop(client, messages: list[dict], tools: list[dict], token: str) -> list[dict]:
    """Execute the tool-calling loop; return updated messages list."""
    for iteration in range(_MAX_TOOL_ITERATIONS):
        response = await client.chat(model=OLLAMA_MODEL, messages=messages, tools=tools)
        if not response.message.tool_calls:
            messages.append({"role": "assistant", "content": response.message.content or ""})
            return messages

        logger.info(f"[Aria] Iteration {iteration + 1}: {len(response.message.tool_calls)} tool call(s)")
        messages.append({
            "role": "assistant",
            "content": response.message.content or "",
            "tool_calls": [
                {"function": {"name": tc.function.name, "arguments": tc.function.arguments or {}}}
                for tc in response.message.tool_calls
            ],
        })
        for tc in response.message.tool_calls:
            logger.info(f"[Tool] Calling '{tc.function.name}' with {tc.function.arguments or {}}")
            result = await execute_tool(tc.function.name, tc.function.arguments or {}, token)
            messages.append({"role": "tool", "content": result})

    return messages


async def ask_aria(
    message: str,
    history: list[ChatMessage],
    user_role: str = "student",
    token: str = "",
) -> dict:
    messages, tools, chunks = await _build_context(message, history, user_role)
    client = ollama_sdk.AsyncClient(host=OLLAMA_HOST)

    if tools:
        messages = await _run_tool_loop(client, messages, tools, token)
        last = messages[-1]
        if last["role"] == "assistant":
            return {"message": last["content"], "sources": chunks}
        # Tool results appended — need a final synthesis call
        final = await client.chat(model=OLLAMA_MODEL, messages=messages)
        return {"message": final.message.content or "Je n'ai pas pu obtenir une réponse complète.", "sources": chunks}

    # No tools — single call
    response = await client.chat(model=OLLAMA_MODEL, messages=messages)
    return {"message": response.message.content or "", "sources": chunks}


async def ask_aria_stream(
    message: str,
    history: list[ChatMessage],
    user_role: str = "student",
    token: str = "",
) -> AsyncGenerator[dict, None]:
    """
    Yields dicts:
      {"type": "meta",  "conversation_id": ..., "sources": [...]}
      {"type": "delta", "text": "..."}
      {"type": "done",  "full": "...full response text..."}
    """
    messages, tools, chunks = await _build_context(message, history, user_role)
    client = ollama_sdk.AsyncClient(host=OLLAMA_HOST)

    # If tools are available, run the (non-streaming) loop first
    if tools:
        messages = await _run_tool_loop(client, messages, tools, token)
        last = messages[-1]
        if last["role"] != "assistant":
            # Tool results at end → need one more synthesis call, stream it
            pass
        else:
            # Already have final assistant message → stream it word by word for UX
            text = last["content"]
            yield {"type": "meta", "sources": chunks}
            yield {"type": "delta", "text": text}
            yield {"type": "done", "full": text}
            return

    # Stream the final (or only) Ollama call
    yield {"type": "meta", "sources": chunks}
    full = []
    async for chunk in await client.chat(model=OLLAMA_MODEL, messages=messages, stream=True):
        token_text = chunk.message.content or ""
        if token_text:
            full.append(token_text)
            yield {"type": "delta", "text": token_text}
    yield {"type": "done", "full": "".join(full)}
