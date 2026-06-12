import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from agent.config import CONVERSATIONS_DIR

logger = logging.getLogger(__name__)

_lock = asyncio.Lock()


def _dir() -> Path:
    p = Path(CONVERSATIONS_DIR)
    p.mkdir(parents=True, exist_ok=True)
    return p


def _path(conversation_id: str) -> Path:
    return _dir() / f"{conversation_id}.json"


def _read(conversation_id: str) -> dict | None:
    p = _path(conversation_id)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.warning(f"[Store] Could not read {p}: {exc}")
        return None


def _write(conv: dict) -> None:
    _path(conv["id"]).write_text(
        json.dumps(conv, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _title_from(message: str) -> str:
    t = message.strip().replace("\n", " ")
    return t[:60] + "…" if len(t) > 60 else t


# ── Public async API ──────────────────────────────────────────────────────────

async def save_exchange(
    conversation_id: str,
    user_id: str,
    user_message: str,
    assistant_message: str,
    sources: list[str],
) -> None:
    def _do() -> None:
        now = _now()
        conv = _read(conversation_id)
        if conv is None:
            conv = {
                "id": conversation_id,
                "user_id": user_id,
                "title": _title_from(user_message),
                "created_at": now,
                "updated_at": now,
                "messages": [],
            }
        else:
            conv["updated_at"] = now

        conv["messages"].extend([
            {"role": "user", "content": user_message, "timestamp": now, "sources": []},
            {"role": "assistant", "content": assistant_message, "timestamp": now, "sources": sources},
        ])
        _write(conv)

    async with _lock:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _do)


async def get_conversation(conversation_id: str) -> dict | None:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: _read(conversation_id))


async def list_conversations(user_id: str) -> list[dict]:
    def _do() -> list[dict]:
        summaries = []
        for f in _dir().glob("*.json"):
            try:
                c = json.loads(f.read_text(encoding="utf-8"))
                if c.get("user_id") == user_id:
                    summaries.append({
                        "id": c["id"],
                        "title": c.get("title", "Conversation"),
                        "created_at": c["created_at"],
                        "updated_at": c["updated_at"],
                        "message_count": len(c.get("messages", [])),
                    })
            except Exception:
                pass
        return sorted(summaries, key=lambda x: x["updated_at"], reverse=True)

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _do)


async def delete_conversation(conversation_id: str, user_id: str) -> bool:
    def _do() -> bool:
        conv = _read(conversation_id)
        if conv is None or conv.get("user_id") != user_id:
            return False
        _path(conversation_id).unlink(missing_ok=True)
        return True

    async with _lock:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _do)


def _user_id_from(payload: dict) -> str:
    return str(
        payload.get("sub")
        or payload.get("id")
        or payload.get("userId")
        or payload.get("user_id")
        or ""
    )
