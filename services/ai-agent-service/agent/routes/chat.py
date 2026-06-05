from fastapi import APIRouter, Depends
from agent.models import ChatRequest, ChatResponse
from agent.middleware.auth import require_auth
import uuid

router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, user=Depends(require_auth)):
    # Pipeline RAG + LLM implémenté aux étapes suivantes
    conversation_id = body.conversation_id or str(uuid.uuid4())

    return ChatResponse(
        message="Agent Aria en cours d'initialisation. RAG et LLM à venir.",
        conversation_id=conversation_id,
        role="assistant",
        sources=[],
    )
