from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.conexion import get_db
from app.schemas.reporte import ReportesResumenResponse
from app.services.reportes_service import ReportesService

router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("/resumen", response_model=ReportesResumenResponse)
def obtener_resumen(
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    return ReportesService(db).resumen(desde=desde, hasta=hasta)


@router.get("/exportar")
def exportar_reporte(
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    contenido = ReportesService(db).exportar_csv(desde=desde, hasta=hasta)
    return StreamingResponse(
        iter([contenido]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reporte_docai.csv"},
    )
