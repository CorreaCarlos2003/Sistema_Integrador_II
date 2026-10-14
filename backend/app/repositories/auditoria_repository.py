from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.evento_auditoria import EventoAuditoria


class AuditoriaRepository:
    def __init__(self, db: Session):
        self.db = db

    def crear(self, evento: EventoAuditoria) -> EventoAuditoria:
        self.db.add(evento)
        self.db.commit()
        self.db.refresh(evento)
        return evento

    def _query_filtrada(
        self,
        busqueda: Optional[str],
        modulo: Optional[str],
        tipo: Optional[str],
        usuario_id: Optional[int],
        desde: Optional[datetime],
        hasta: Optional[datetime],
    ):
        query = self.db.query(EventoAuditoria)

        if busqueda:
            texto = f"%{busqueda.strip()}%"
            query = query.filter(
                or_(
                    EventoAuditoria.descripcion.ilike(texto),
                    EventoAuditoria.actor_nombre.ilike(texto),
                )
            )
        if modulo and modulo.lower() != "todos":
            query = query.filter(EventoAuditoria.modulo == modulo)
        if tipo and tipo.lower() != "todos":
            query = query.filter(EventoAuditoria.tipo == tipo)
        if usuario_id:
            query = query.filter(EventoAuditoria.usuario_id == usuario_id)
        if desde:
            query = query.filter(EventoAuditoria.fecha >= desde)
        if hasta:
            query = query.filter(EventoAuditoria.fecha <= hasta)

        return query

    def listar_paginado(
        self,
        busqueda: Optional[str] = None,
        modulo: Optional[str] = None,
        tipo: Optional[str] = None,
        usuario_id: Optional[int] = None,
        desde: Optional[datetime] = None,
        hasta: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[EventoAuditoria], int]:
        query = self._query_filtrada(busqueda, modulo, tipo, usuario_id, desde, hasta)
        total = query.count()
        items = query.order_by(EventoAuditoria.fecha.desc()).offset(skip).limit(limit).all()
        return items, total

    def listar_para_exportar(
        self,
        busqueda: Optional[str] = None,
        modulo: Optional[str] = None,
        tipo: Optional[str] = None,
        usuario_id: Optional[int] = None,
        desde: Optional[datetime] = None,
        hasta: Optional[datetime] = None,
        limite_maximo: int = 5000,
    ) -> List[EventoAuditoria]:
        query = self._query_filtrada(busqueda, modulo, tipo, usuario_id, desde, hasta)
        return query.order_by(EventoAuditoria.fecha.desc()).limit(limite_maximo).all()
