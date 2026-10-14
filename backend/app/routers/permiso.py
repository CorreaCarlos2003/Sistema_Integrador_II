from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import obtener_actor_id
from app.database.conexion import get_db
from app.schemas.permiso import (
    PermisosGlobalesActualizar,
    PermisosGlobalesResponse,
    PermisosProyectoActualizar,
    PermisosProyectoResponse,
)
from app.services.permiso_service import PermisoService

router = APIRouter(prefix="/permisos", tags=["Roles y Permisos"])


@router.get("/globales/{rol}", response_model=PermisosGlobalesResponse)
def obtener_permisos_globales(rol: str, db: Session = Depends(get_db)):
    return PermisoService(db).obtener_globales(rol)


@router.put("/globales/{rol}", response_model=PermisosGlobalesResponse)
def actualizar_permisos_globales(rol: str, datos: PermisosGlobalesActualizar, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return PermisoService(db).actualizar_globales(rol, datos, actor_id=actor_id)


@router.get("/proyecto/{proyecto_id}", response_model=PermisosProyectoResponse)
def obtener_permisos_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    return PermisoService(db).obtener_por_proyecto(proyecto_id)


@router.put("/proyecto/{proyecto_id}", response_model=PermisosProyectoResponse)
def actualizar_permisos_proyecto(proyecto_id: int, datos: PermisosProyectoActualizar, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return PermisoService(db).actualizar_por_proyecto(proyecto_id, datos, actor_id=actor_id)
