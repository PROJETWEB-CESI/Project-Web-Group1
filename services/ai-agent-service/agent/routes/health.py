from fastapi import APIRouter
import httpx
from agent.config import OLLAMA_HOST

router = APIRouter()


@router.get("/health")
async def health():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_HOST}/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        pass

    return {
        "status": "UP",
        "ollama": "UP" if ollama_ok else "DOWN",
    }
