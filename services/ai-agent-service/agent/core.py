import asyncio
import logging
import ollama as ollama_sdk
from agent.config import OLLAMA_HOST, OLLAMA_MODEL
from agent.models import ChatMessage
from tools.definitions import get_tools_for_role
from tools.executor import execute_tool

logger = logging.getLogger(__name__)

_MAX_TOOL_ITERATIONS = 3

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


async def ask_aria(
    message: str,
    history: list[ChatMessage],
    user_role: str = "student",
    token: str = "",
) -> dict:
    loop = asyncio.get_running_loop()

    # RAG — chunks pertinents (sync → executor pour ne pas bloquer l'event loop)
    try:
        from rag.retriever import retrieve
        chunks: list[str] = await loop.run_in_executor(None, lambda: retrieve(message))
    except Exception:
        chunks = []

    # System prompt enrichi du rôle et du contexte RAG
    system = _SYSTEM_PROMPT + f"\nRôle de l'utilisateur connecté : {user_role}."
    if chunks:
        context = "\n\n".join(f"- {c}" for c in chunks)
        system += f"\n\nContexte documentaire NovaCampus :\n{context}"

    # Construction de la conversation
    messages: list[dict] = [{"role": "system", "content": system}]
    for h in history:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": message})

    tools = get_tools_for_role(user_role)
    client = ollama_sdk.AsyncClient(host=OLLAMA_HOST)

    # Boucle d'appels d'outils (max _MAX_TOOL_ITERATIONS tours)
    for iteration in range(_MAX_TOOL_ITERATIONS):
        response = await client.chat(model=OLLAMA_MODEL, messages=messages, tools=tools)

        if not response.message.tool_calls:
            # Réponse finale sans appel d'outil
            return {
                "message": response.message.content or "",
                "sources": chunks,
            }

        # Le modèle veut appeler un ou plusieurs outils
        logger.info(f"[Aria] Iteration {iteration + 1}: {len(response.message.tool_calls)} tool call(s)")

        # Ajouter le message assistant avec ses tool_calls
        messages.append({
            "role": "assistant",
            "content": response.message.content or "",
            "tool_calls": [
                {
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments or {},
                    }
                }
                for tc in response.message.tool_calls
            ],
        })

        # Exécuter chaque outil et ajouter son résultat
        for tc in response.message.tool_calls:
            name = tc.function.name
            args = tc.function.arguments or {}
            logger.info(f"[Tool] Calling '{name}' with {args}")
            result = await execute_tool(name, args, token)
            messages.append({"role": "tool", "content": result})

    # Fallback si la limite d'itérations est atteinte
    final = await client.chat(model=OLLAMA_MODEL, messages=messages)
    return {
        "message": final.message.content or "Je n'ai pas pu obtenir une réponse complète.",
        "sources": chunks,
    }
