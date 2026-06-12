from pydantic import BaseModel
from typing import Optional, List


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []
    ui_language: Optional[str] = None  # 'en' | 'fr' — sent by the frontend UI toggle


class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    role: str = "assistant"
    sources: Optional[List[str]] = []


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int


class ConversationMessage(BaseModel):
    role: str
    content: str
    timestamp: str
    sources: Optional[List[str]] = []


class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[ConversationMessage]
