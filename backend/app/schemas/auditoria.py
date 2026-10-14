from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class EventoAuditoriaResponse(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    actor_nombre: str
    actor_rol: Optional[str] = None
    modulo: str
    tipo: str
    descripcion: str
    referencia: Optional[str] = None
    proyecto_id: Optional[int] = None
    duracion_ms: Optional[int] = None
    fecha: datetime

    class Config:
        from_attributes = True


class PaginatedEventosResponse(BaseModel):
    items: List[EventoAuditoriaResponse]
    total: int
    page: int
    limit: int
    total_pages: int
