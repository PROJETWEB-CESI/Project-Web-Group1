import asyncio
import json
import logging
import httpx
import jwt as PyJWT
from agent.config import (
    SCHEDULING_SERVICE_URL,
    ACADEMIC_SERVICE_URL,
    BILLING_SERVICE_URL,
    JWT_SECRET,
    JWT_ALGORITHM,
)

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(10.0)
_HEALTH_TIMEOUT = httpx.Timeout(2.0)

_SERVICE_TOOLS: dict[str, list[str]] = {
    SCHEDULING_SERVICE_URL: ["get_schedule"],
    ACADEMIC_SERVICE_URL:   ["get_grades", "get_absences"],
    BILLING_SERVICE_URL:    ["get_billing"],
}

_health_cache: tuple[float, set[str]] | None = None
_HEALTH_TTL = 30.0


def _decode_token(token: str) -> dict:
    """Décode le JWT pour extraire userId et campusId sans re-vérifier la signature."""
    try:
        return PyJWT.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return {}


async def available_tool_names() -> set[str]:
    """Probe chaque service via /api/health (2 s timeout); résultat mis en cache 30 s."""
    import time
    global _health_cache
    if _health_cache and (time.monotonic() - _health_cache[0]) < _HEALTH_TTL:
        return _health_cache[1]

    async def ping(url: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=_HEALTH_TIMEOUT) as c:
                r = await c.get(f"{url}/api/health", follow_redirects=False)
                return r.status_code < 500
        except Exception:
            return False

    results = await asyncio.gather(*[ping(url) for url in _SERVICE_TOOLS], return_exceptions=True)
    reachable: set[str] = set()
    for ok, tools in zip(results, _SERVICE_TOOLS.values()):
        if ok is True:
            reachable.update(tools)

    _health_cache = (time.monotonic(), reachable)
    logger.info(f"[Tools] Available: {sorted(reachable) or 'none'}")
    return reachable


async def execute_tool(name: str, args: dict, token: str) -> str:
    claims = _decode_token(token)
    user_id = claims.get("id", "")
    campus_id = claims.get("campusId", "")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        if name == "get_schedule":
            return await _get_schedule(headers)
        if name == "get_grades":
            return await _get_grades(user_id, campus_id, headers)
        if name == "get_absences":
            return await _get_absences(user_id, campus_id, headers)
        if name == "get_billing":
            return await _get_billing(user_id, campus_id, headers)
        return f"Outil inconnu : {name}"
    except httpx.HTTPStatusError as e:
        logger.warning(f"[Tool] {name} HTTP {e.response.status_code}: {e.response.text[:200]}")
        return f"Le service a retourné une erreur {e.response.status_code} pour {name}."
    except Exception as e:
        logger.warning(f"[Tool] {name} failed: {e}")
        return f"Le service '{name}' est temporairement indisponible."


def _format_schedule(data: list) -> str:
    """Formate l'emploi du temps JSON en texte lisible."""
    if not data:
        return "Aucun cours trouvé dans l'emploi du temps."
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    days_fr = {"Monday": "Lundi", "Tuesday": "Mardi", "Wednesday": "Mercredi",
               "Thursday": "Jeudi", "Friday": "Vendredi", "Saturday": "Samedi", "Sunday": "Dimanche"}
    by_day: dict[str, list] = {}
    for item in data:
        day = item.get("day_of_week", "?")
        by_day.setdefault(day, []).append(item)
    lines = []
    for day in days_order:
        if day not in by_day:
            continue
        lines.append(f"\n**{days_fr.get(day, day)}**")
        for s in sorted(by_day[day], key=lambda x: x.get("start_time", "")):
            lines.append(
                f"  - {s.get('start_time','?')[:5]}–{s.get('end_time','?')[:5]} "
                f"| Cours {s.get('course_id','?')} "
                f"| Salle {s.get('room_id','?')} "
                f"| Intervenant {s.get('instructor_id','?')}"
            )
    return "\n".join(lines) if lines else "Aucun cours trouvé."


async def _get_schedule(headers: dict) -> str:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(f"{SCHEDULING_SERVICE_URL}/timetables", headers=headers)
        r.raise_for_status()
        try:
            return _format_schedule(r.json())
        except Exception:
            return r.text


async def _get_grades(user_id: str, campus_id: str, headers: dict) -> str:
    if not user_id:
        return "Impossible de récupérer les notes : identifiant utilisateur manquant."
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(
            f"{ACADEMIC_SERVICE_URL}/grades/student/{user_id}",
            params={"campusId": campus_id} if campus_id else {},
            headers=headers,
        )
        r.raise_for_status()
        return r.text


async def _get_absences(user_id: str, campus_id: str, headers: dict) -> str:
    if not user_id:
        return "Impossible de récupérer les absences : identifiant utilisateur manquant."
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(
            f"{ACADEMIC_SERVICE_URL}/attendance/student/{user_id}",
            params={"campusId": campus_id} if campus_id else {},
            headers=headers,
        )
        r.raise_for_status()
        return r.text


def _format_billing(data: dict) -> str:
    if "message" in data:
        return data["message"]
    lines = [
        "Résumé de facturation :",
        f"  Total facturé  : {data.get('totalInvoiced', 0):.2f} €",
        f"  Total payé     : {data.get('totalPaid', 0):.2f} €",
        f"  Solde restant  : {data.get('outstanding', 0):.2f} €",
    ]
    overdue_count = data.get("overdueCount", 0)
    if overdue_count:
        lines.append(
            f"  Impayés        : {overdue_count} paiement(s) — {data.get('overdueAmount', 0):.2f} €"
        )
    payments = data.get("payments", [])
    if payments:
        lines.append("\nDétail des paiements :")
        status_fr = {"Paid": "Payé", "Delay": "En retard"}
        for p in payments:
            status = status_fr.get(p.get("status", ""), p.get("status", "?"))
            due = (p.get("dueDate") or "")[:10]
            lines.append(
                f"  • {p.get('paymentId','?')} — {float(p.get('amount', 0)):.2f} € — {status}"
                f" (S{p.get('semester','?')} {p.get('academicYear','?')}, éch. {due})"
            )
    return "\n".join(lines)


async def _get_billing(user_id: str, campus_id: str, headers: dict) -> str:
    if not user_id:
        return "Impossible de récupérer la facturation : identifiant utilisateur manquant."
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(
            f"{BILLING_SERVICE_URL}/billing",
            params={"userId": user_id, "campusId": campus_id},
            headers=headers,
        )
        r.raise_for_status()
        try:
            return _format_billing(r.json())
        except Exception:
            return r.text
