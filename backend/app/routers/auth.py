from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.conexion import get_db
from app.schemas.auth import LoginRequest, RecuperarRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    servicio = AuthService(db)
    return servicio.autenticar(datos)


@router.post("/recuperar")
def recuperar(datos: RecuperarRequest, db: Session = Depends(get_db)):
    servicio = AuthService(db)
    return servicio.recuperar(datos)