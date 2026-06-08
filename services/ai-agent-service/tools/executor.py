import asyncio
import logging
import httpx
from agent.config import SCHEDULING_SERVICE_URL, ACADEMIC_SERVICE_URL, BILLING_SERVICE_URL

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(10.0)
_HEALTH_TIMEOUT = httpx.Timeout(2.0)

# Maps service base URL → tools it exposes
_SERVICE_TOOLS: dict[str, list[str]] = {
    SCHEDULING_SERVICE_URL: ["get_schedule"],
    ACADEMIC_SERVICE_URL:   ["get_grades", "get_absences"],
    BILLING_SERVICE_URL:    ["get_billing"],
}


_health_cache: tuple[float, set[str]] | None = None
_HEALTH_TTL = 30.0  # seconds


async def available_tool_names() -> set[str]:
    """Probe each backing service (2 s timeout); result cached for 30 s."""
    import time
    global _health_cache
    if _health_cache and (time.monotonic() - _health_cache[0]) < _HEALTH_TTL:
        return _health_cache[1]

    async def ping(url: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=_HEALTH_TIMEOUT) as c:
                await c.get(url, follow_redirects=False)
            return True
        except Exception:
            return False

    results = await asyncio.gather(*[ping(url) for url in _SERVICE_TOOLS], return_exceptions=True)
    reachable: set[str] = set()
    for ok, tools in zip(results, _SERVICE_TOOLS.values()):
        if ok is True:
            reachable.update(tools)

    _health_cache = (time.monotonic(), reachable)
    if reachable:
        logger.info(f"[Tools] Available: {sorted(reachable)}")
    else:
        logger.info("[Tools] No backing services reachable — running without tools")
    return reachable


async def execute_tool(name: str, args: dict, token: str) -> str:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        if name == "get_schedule":
            return await _get_schedule(args.get("period", "week"), headers)
        if name == "get_grades":
            return await _get_grades(args.get("subject"), headers)
        if name == "get_absences":
            return await _get_absences(args.get("justified"), headers)
        if name == "get_billing":
            return await _get_billing(headers)
        return f"Outil inconnu : {name}"
    except httpx.HTTPStatusError as e:
        logger.warning(f"[Tool] {name} HTTP {e.response.status_code}: {e.response.text[:200]}")
        return f"Le service a retourné une erreur {e.response.status_code} pour {name}."
    except Exception as e:
        logger.warning(f"[Tool] {name} failed: {e}")
        return f"Le service '{name}' est temporairement indisponible."


async def _get_schedule(period: str, headers: dict) -> str:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(
            f"{SCHEDULING_SERVICE_URL}/api/schedule",
            params={"period": period},
            headers=headers,
        )
        r.raise_for_status()
        return r.text


async def _get_grades(subject: str | None, headers: dict) -> str:
    params = {"subject": subject} if subject else {}
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(
            f"{ACADEMIC_SERVICE_URL}/api/grades",
            params=params,
            headers=headers,
        )
        r.raise_for_status()
        return r.text


async def _get_absences(justified: bool | None, headers: dict) -> str:
    params = {}
    if justified is not None:
        params["justified"] = str(justified).lower()
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(
            f"{ACADEMIC_SERVICE_URL}/api/absences",
            params=params,
            headers=headers,
        )
        r.raise_for_status()
        return r.text


async def _get_billing(headers: dict) -> str:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(
            f"{BILLING_SERVICE_URL}/api/billing",
            headers=headers,
        )
        r.raise_for_status()
        return r.text
