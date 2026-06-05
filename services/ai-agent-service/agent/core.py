import ollama as ollama_sdk
from agent.config import OLLAMA_HOST, OLLAMA_MODEL
from agent.models import ChatMessage

_SYSTEM_PROMPT = (
    "Tu es Aria, l'assistante IA de NovaCampus Alliance, un ERP universitaire. "
    "Tu aides les étudiants, enseignants et administrateurs avec leurs questions "
    "sur la plateforme : emploi du temps, notes, facturation, documents administratifs. "
    "Réponds toujours en français sauf si l'utilisateur écrit dans une autre langue. "
    "Sois concise, professionnelle et bienveillante."
)


async def ask_aria(
    message: str,
    history: list[ChatMessage],
    user_role: str = "student",
) -> str:
    system = _SYSTEM_PROMPT + f"\nRôle de l'utilisateur connecté : {user_role}."
    messages = [{"role": "system", "content": system}]
    for h in history:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": message})

    client = ollama_sdk.AsyncClient(host=OLLAMA_HOST)
    response = await client.chat(model=OLLAMA_MODEL, messages=messages)
    return response.message.content
