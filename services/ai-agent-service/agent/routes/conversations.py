from fastapi import APIRouter, Depends, HTTPException, status
from agent.models import ConversationSummary, ConversationDetail
from agent.middleware.auth import require_auth
from agent.store import list_conversations, get_conversation, delete_conversation, _user_id_from

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationSummary])
async def get_conversations(user=Depends(require_auth)):
    user_id = _user_id_from(user)
    return await list_conversations(user_id)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation_detail(conversation_id: str, user=Depends(require_auth)):
    user_id = _user_id_from(user)
    conv = await get_conversation(conversation_id)
    if conv is None or conv.get("user_id") != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conv


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_conversation(conversation_id: str, user=Depends(require_auth)):
    user_id = _user_id_from(user)
    deleted = await delete_conversation(conversation_id, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
