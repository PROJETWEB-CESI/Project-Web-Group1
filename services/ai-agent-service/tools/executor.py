import logging
import httpx
from agent.config import SCHEDULING_SERVICE_URL, ACADEMIC_SERVICE_URL, BILLING_SERVICE_URL

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(10.0)


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
