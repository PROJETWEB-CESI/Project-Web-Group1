import asyncio
import json
import uuid
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from agent.models import ChatRequest, ChatResponse
from agent.middleware.auth import require_auth
from agent.core import ask_aria, ask_aria_stream
from agent.store import save_exchange, _user_id_from

router = APIRouter()


def _extract_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth.split(" ", 1)[1]
    return request.cookies.get("accessToken", "")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest, user=Depends(require_auth)):
    conversation_id = body.conversation_id or str(uuid.uuid4())
    token = _extract_token(request)

    result = await ask_aria(
        message=body.message,
        history=body.history or [],
        user_role=user.get("role", "student"),
        token=token,
    )

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


@router.post("/chat/stream")
async def chat_stream(request: Request, body: ChatRequest, user=Depends(require_auth)):
    conversation_id = body.conversation_id or str(uuid.uuid4())
    token = _extract_token(request)
    user_id = _user_id_from(user)

    async def event_generator():
        full_text = ""
        sources: list = []
        try:
            async for event in ask_aria_stream(
                message=body.message,
                history=body.history or [],
                user_role=user.get("role", "student"),
                token=token,
            ):
                if event["type"] == "meta":
                    sources = event.get("sources", [])
                    payload = {"type": "meta", "conversation_id": conversation_id, "sources": sources}
                    yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                elif event["type"] == "delta":
                    full_text += event["text"]
                    yield f"data: {json.dumps({'type': 'delta', 'text': event['text']}, ensure_ascii=False)}\n\n"
                elif event["type"] == "done":
                    full_text = event.get("full", full_text)
                    yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
            return

        # Persist in background after stream completes
        asyncio.create_task(save_exchange(
            conversation_id=conversation_id,
            user_id=user_id,
            user_message=body.message,
            assistant_message=full_text,
            sources=sources,
        ))

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
