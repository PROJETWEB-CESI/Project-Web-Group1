import uuid
from fastapi import APIRouter, Depends, Request
from agent.models import ChatRequest, ChatResponse
from agent.middleware.auth import require_auth
from agent.core import ask_aria

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

    return ChatResponse(
        message=result["message"],
        conversation_id=conversation_id,
        role="assistant",
        sources=result["sources"],
    )
