from fastapi import APIRouter, Depends
from agent.models import ChatRequest, ChatResponse
from agent.middleware.auth import require_auth
from agent.core import ask_aria
import uuid

router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, user=Depends(require_auth)):
    conversation_id = body.conversation_id or str(uuid.uuid4())
    reply = await ask_aria(
        message=body.message,
        history=body.history or [],
        user_role=user.get("role", "student"),
    )
    return ChatResponse(
        message=reply,
        conversation_id=conversation_id,
        role="assistant",
        sources=[],
    )
