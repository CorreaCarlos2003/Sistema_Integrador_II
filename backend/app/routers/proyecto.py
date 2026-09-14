from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.conexion import get_db
from app.schemas.proyecto import (
    ProyectoCrear,
    ProyectoEditar,
    ProyectoEstado,
    ProyectoResponse, PaginatedProyectosResponse,
)
from app.services.proyecto_service import ProyectoService

router = APIRouter(prefix="/proyectos", tags=["Proyectos"])


@router.get("", response_model=List[ProyectoResponse])
def listar_proyectos(db: Session = Depends(get_db)):
    return ProyectoService(db).listar_proyectos()

@router.get("/detalles", response_model=PaginatedProyectosResponse)
def listar_proyectos_cards(
    busqueda: Optional[str] = Query(None, description="Buscar por nombre o descripción"),
    estado: Optional[str] = Query(None, description="Filtrar por estado (Activo, Pausado, etc.)"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(6, ge=1, le=50, description="Cantidad de tarjetas por página"),
    db: Session = Depends(get_db),
):
    return ProyectoService(db).listar_cards_proyectos(
        busqueda=busqueda, estado=estado, page=page, limit=limit
    )

@router.get("/{id_proyecto}", response_model=ProyectoResponse)
def obtener_proyecto(id_proyecto: int, db: Session = Depends(get_db)):
    return ProyectoService(db).obtener_por_id(id_proyecto)


@router.post("", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def crear_proyecto(datos: ProyectoCrear, db: Session = Depends(get_db)):
    return ProyectoService(db).crear_proyecto(datos)


@router.put("/{id_proyecto}", response_model=ProyectoResponse)
def editar_proyecto(id_proyecto: int, datos: ProyectoEditar, db: Session = Depends(get_db)):
    return ProyectoService(db).editar_proyecto(id_proyecto, datos)


@router.patch("/{id_proyecto}/estado", response_model=ProyectoResponse)
def cambiar_estado(id_proyecto: int, datos: ProyectoEstado, db: Session = Depends(get_db)):
    return ProyectoService(db).cambiar_estado(id_proyecto, datos)


@router.delete("/{id_proyecto}")
def eliminar_proyecto(id_proyecto: int, db: Session = Depends(get_db)):
    return ProyectoService(db).eliminar_proyecto(id_proyecto)
