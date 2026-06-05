from pydantic import BaseModel
from typing import Optional, List


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    role: str = "assistant"
    sources: Optional[List[str]] = []
