from typing import Optional
from fastapi import Header


def obtener_actor_id(x_usuario_id: Optional[str] = Header(default=None)) -> Optional[int]:
    """Lee el ID del usuario que origina la petición desde el header X-Usuario-Id.

    El sistema no valida sesiones en el backend (no hay un dependency de auth
    real todavía), así que este ID es el que el frontend reporta a partir de
    la sesión guardada en localStorage. Se usa únicamente para atribuir
    eventos en el historial de auditoría.
    """
    if not x_usuario_id:
        return None
    try:
        return int(x_usuario_id)
    except ValueError:
        return None
