from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.conexion import get_db
from app.schemas.auditoria import PaginatedEventosResponse
from app.services.auditoria_service import AuditoriaService

router = APIRouter(prefix="/historial", tags=["Historial"])


@router.get("", response_model=PaginatedEventosResponse)
def listar_historial(
    busqueda: Optional[str] = Query(None),
    modulo: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    usuario_id: Optional[int] = Query(None),
    desde: Optional[datetime] = Query(None),
    hasta: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return AuditoriaService(db).listar(
        busqueda=busqueda,
        modulo=modulo,
        tipo=tipo,
        usuario_id=usuario_id,
        desde=desde,
        hasta=hasta,
        page=page,
        limit=limit,
    )


@router.get("/exportar")
def exportar_historial(
    busqueda: Optional[str] = Query(None),
    modulo: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    usuario_id: Optional[int] = Query(None),
    desde: Optional[datetime] = Query(None),
    hasta: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    contenido = AuditoriaService(db).exportar_csv(
        busqueda=busqueda, modulo=modulo, tipo=tipo, usuario_id=usuario_id, desde=desde, hasta=hasta
    )
    return StreamingResponse(
        iter([contenido]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=historial_docai.csv"},
    )
