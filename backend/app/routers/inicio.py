from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.conexion import get_db
from app.schemas.inicio import InicioResumenResponse
from app.services.inicio_service import InicioService

router = APIRouter(prefix="/inicio", tags=["Inicio"])


@router.get("/resumen", response_model=InicioResumenResponse)
def obtener_resumen(db: Session = Depends(get_db)):
    return InicioService(db).resumen()
