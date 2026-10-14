import csv
import io
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.evento_auditoria import EventoAuditoria
from app.models.usuario import Usuario
from app.repositories.auditoria_repository import AuditoriaRepository
from app.schemas.auditoria import PaginatedEventosResponse

MODULOS_VALIDOS = {"proyectos", "usuarios", "roles", "acceso", "consulta_ia"}


def registrar_evento(
    db: Session,
    *,
    actor_id: Optional[int],
    modulo: str,
    tipo: str,
    descripcion: str,
    referencia: Optional[str] = None,
    proyecto_id: Optional[int] = None,
    duracion_ms: Optional[int] = None,
    actor_nombre_fallback: str = "Sistema",
) -> EventoAuditoria:
    """Registra un evento en el historial de auditoría.

    Se llama siempre DESPUÉS de que la operación principal ya se confirmó en
    la base de datos, para que nunca quede un evento huérfano de una acción
    que en realidad falló.
    """
    actor_nombre = actor_nombre_fallback
    actor_rol = None
    if actor_id:
        usuario = db.query(Usuario).filter(Usuario.id == actor_id).first()
        if usuario:
            actor_nombre = (usuario.nombre or "").strip() or actor_nombre_fallback
            actor_rol = (usuario.rol or "").strip() or None

    evento = EventoAuditoria(
        usuario_id=actor_id,
        actor_nombre=actor_nombre,
        actor_rol=actor_rol,
        modulo=modulo,
        tipo=tipo,
        descripcion=descripcion,
        referencia=referencia,
        proyecto_id=proyecto_id,
        duracion_ms=duracion_ms,
    )
    return AuditoriaRepository(db).crear(evento)


class AuditoriaService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AuditoriaRepository(db)

    def listar(
        self,
        busqueda: Optional[str] = None,
        modulo: Optional[str] = None,
        tipo: Optional[str] = None,
        usuario_id: Optional[int] = None,
        desde: Optional[datetime] = None,
        hasta: Optional[datetime] = None,
        page: int = 1,
        limit: int = 12,
    ) -> PaginatedEventosResponse:
        skip = (page - 1) * limit
        items, total = self.repo.listar_paginado(
            busqueda=busqueda,
            modulo=modulo,
            tipo=tipo,
            usuario_id=usuario_id,
            desde=desde,
            hasta=hasta,
            skip=skip,
            limit=limit,
        )
        total_pages = max(1, -(-total // limit)) if total else 1
        return PaginatedEventosResponse(
            items=items, total=total, page=page, limit=limit, total_pages=total_pages
        )

    def exportar_csv(
        self,
        busqueda: Optional[str] = None,
        modulo: Optional[str] = None,
        tipo: Optional[str] = None,
        usuario_id: Optional[int] = None,
        desde: Optional[datetime] = None,
        hasta: Optional[datetime] = None,
    ) -> str:
        eventos = self.repo.listar_para_exportar(
            busqueda=busqueda, modulo=modulo, tipo=tipo, usuario_id=usuario_id, desde=desde, hasta=hasta
        )

        buffer = io.StringIO()
        escritor = csv.writer(buffer)
        escritor.writerow(["Fecha", "Usuario", "Rol", "Módulo", "Tipo", "Descripción", "Referencia"])
        for e in eventos:
            escritor.writerow(
                [
                    e.fecha.strftime("%Y-%m-%d %H:%M:%S") if e.fecha else "",
                    e.actor_nombre,
                    e.actor_rol or "",
                    e.modulo,
                    e.tipo,
                    e.descripcion,
                    e.referencia or "",
                ]
            )
        return buffer.getvalue()
