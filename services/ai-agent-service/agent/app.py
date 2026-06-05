import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import ollama as ollama_client
from agent.config import OLLAMA_HOST, OLLAMA_MODEL
from agent.routes.health import router as health_router
from agent.routes.chat import router as chat_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def _pull_model_background(host: str, model: str) -> None:
    loop = asyncio.get_running_loop()
    logger.info(f"[Aria] Pulling model '{model}' from {host} in background ...")
    try:
        client = ollama_client.Client(host=host)
        # run_in_executor so the sync pull() doesn't block the event loop
        await loop.run_in_executor(None, lambda: client.pull(model))
        logger.info(f"[Aria] Model '{model}' ready")
    except Exception as exc:
        logger.warning(f"[Aria] Could not pull model '{model}': {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fire-and-forget: server starts immediately, model pulls in background
    asyncio.create_task(_pull_model_background(OLLAMA_HOST, OLLAMA_MODEL))
    yield


app = FastAPI(title="NovaCampus AI Agent — Aria", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(chat_router)
