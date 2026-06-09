_ALL_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_schedule",
            "description": (
                "Récupère l'emploi du temps de l'utilisateur pour une période donnée. "
                "Utilise cet outil quand l'utilisateur demande ses cours, son planning ou son EDT."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Période souhaitée",
                        "enum": ["today", "week", "next_week"],
                    }
                },
                "required": ["period"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_grades",
            "description": (
                "Récupère les notes et moyennes de l'étudiant. "
                "Utilise cet outil quand l'utilisateur demande ses notes, sa moyenne ou ses résultats."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "subject": {
                        "type": "string",
                        "description": "Optionnel : nom de la matière (ex: 'économie internationale')",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_absences",
            "description": (
                "Récupère les absences de l'étudiant. "
                "Utilise cet outil quand l'utilisateur demande ses absences, justifiées ou non."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "justified": {
                        "type": "boolean",
                        "description": "true pour les justifiées, false pour les non justifiées, absent pour toutes",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_billing",
            "description": (
                "Récupère les informations de facturation et le statut des paiements. "
                "Utilise cet outil quand l'utilisateur demande ses frais, paiements ou factures."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]

_ROLE_TOOLS: dict[str, list[str]] = {
    "student": ["get_schedule", "get_grades", "get_absences", "get_billing"],
    "teacher": ["get_schedule", "get_grades", "get_absences"],
    "admin": ["get_schedule", "get_grades", "get_absences", "get_billing"],
}


def get_tools_for_role(role: str) -> list:
    allowed = _ROLE_TOOLS.get(role, _ROLE_TOOLS["student"])
    return [t for t in _ALL_TOOLS if t["function"]["name"] in allowed]
