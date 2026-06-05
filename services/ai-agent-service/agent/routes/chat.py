import asyncio
import uuid
from fastapi import APIRouter, Depends, Request
from agent.models import ChatRequest, ChatResponse
from agent.middleware.auth import require_auth
from agent.core import ask_aria
from agent.store import save_exchange, _user_id_from

router = APIRouter()


def _extract_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth.split(" ", 1)[1]
    return request.cookies.get("accessToken", "")


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest, user=Depends(require_auth)):
    conversation_id = body.conversation_id or str(uuid.uuid4())
    token = _extract_token(request)

    result = await ask_aria(
        message=body.message,
        history=body.history or [],
        user_role=user.get("role", "student"),
        token=token,
    )

    # Persist exchange in background (fire-and-forget)
    asyncio.create_task(save_exchange(
        conversation_id=conversation_id,
        user_id=_user_id_from(user),
        user_message=body.message,
        assistant_message=result["message"],
        sources=result["sources"],
    ))

    return ChatResponse(
        message=result["message"],
        conversation_id=conversation_id,
        role="assistant",
        sources=result["sources"],
    )
