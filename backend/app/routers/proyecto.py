from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.deps import obtener_actor_id
from app.database.conexion import get_db
from app.schemas.proyecto import (
    InvitacionProyectoResponse,
    MiembroEstado,
    MiembroInvitar,
    MiembroProyectoResponse,
    ProyectoArchivar,
    ProyectoCrear,
    ProyectoEditar,
    ProyectoEstado,
    ProyectoResponse, PaginatedProyectosResponse,
    ResponsableOpcion,
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
    responsable_id: Optional[int] = Query(None, description="Filtrar por usuario responsable"),
    miembro_id: Optional[int] = Query(None, description="Filtrar por usuario asignado como miembro"),
    orden: Literal["recientes", "antiguos", "az", "za"] = Query("recientes", description="Orden de los resultados"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(6, ge=1, le=50, description="Cantidad de tarjetas por página"),
    db: Session = Depends(get_db),
):
    return ProyectoService(db).listar_cards_proyectos(
        busqueda=busqueda, estado=estado, responsable_id=responsable_id, miembro_id=miembro_id,
        orden=orden, page=page, limit=limit,
    )


@router.get("/responsables", response_model=List[ResponsableOpcion])
def listar_responsables(db: Session = Depends(get_db)):
    return ProyectoService(db).listar_responsables()

@router.get("/invitaciones/{usuario_id}", response_model=List[InvitacionProyectoResponse])
def listar_invitaciones_pendientes(usuario_id: int, db: Session = Depends(get_db)):
    return ProyectoService(db).listar_invitaciones_pendientes(usuario_id)


@router.get("/{id_proyecto}", response_model=ProyectoResponse)
def obtener_proyecto(id_proyecto: int, db: Session = Depends(get_db)):
    return ProyectoService(db).obtener_por_id(id_proyecto)


@router.post("", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def crear_proyecto(datos: ProyectoCrear, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return ProyectoService(db).crear_proyecto(datos, actor_id=actor_id)


@router.put("/{id_proyecto}", response_model=ProyectoResponse)
def editar_proyecto(id_proyecto: int, datos: ProyectoEditar, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return ProyectoService(db).editar_proyecto(id_proyecto, datos, actor_id=actor_id)


@router.patch("/{id_proyecto}/estado", response_model=ProyectoResponse)
def cambiar_estado(id_proyecto: int, datos: ProyectoEstado, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return ProyectoService(db).cambiar_estado(id_proyecto, datos, actor_id=actor_id)


@router.patch("/{id_proyecto}/archivar", response_model=ProyectoResponse)
def archivar_proyecto(id_proyecto: int, datos: ProyectoArchivar, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return ProyectoService(db).archivar_proyecto(id_proyecto, datos.archivado, actor_id=actor_id)


@router.delete("/{id_proyecto}")
def eliminar_proyecto(id_proyecto: int, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return ProyectoService(db).eliminar_proyecto(id_proyecto, actor_id=actor_id)


@router.post(
    "/{id_proyecto}/usuarios",
    response_model=MiembroProyectoResponse,
    status_code=status.HTTP_201_CREATED,
)
def invitar_miembro(id_proyecto: int, datos: MiembroInvitar, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    usuario, relacion, invitacion_enviada = ProyectoService(db).invitar_miembro(id_proyecto, datos, actor_id=actor_id)
    return MiembroProyectoResponse(
        usuario_id=usuario.id,
        nombre=(usuario.nombre or "").strip(),
        correo=usuario.correo,
        rol_proyecto=relacion.rol_proyecto,
        cargo=relacion.cargo,
        estado_invitacion=relacion.estado_invitacion,
        invitacion_enviada=invitacion_enviada,
    )


@router.delete("/{id_proyecto}/usuarios/{usuario_id}")
def quitar_miembro(id_proyecto: int, usuario_id: int, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return ProyectoService(db).quitar_miembro(id_proyecto, usuario_id, actor_id=actor_id)


@router.patch("/{id_proyecto}/usuarios/{usuario_id}/estado")
def cambiar_estado_miembro(id_proyecto: int, usuario_id: int, datos: MiembroEstado, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return ProyectoService(db).cambiar_estado_miembro(id_proyecto, usuario_id, datos.activo, actor_id=actor_id)


@router.post("/{id_proyecto}/usuarios/{usuario_id}/aceptar")
def aceptar_invitacion(id_proyecto: int, usuario_id: int, db: Session = Depends(get_db)):
    return ProyectoService(db).responder_invitacion(id_proyecto, usuario_id, aceptar=True)


@router.post("/{id_proyecto}/usuarios/{usuario_id}/rechazar")
def rechazar_invitacion(id_proyecto: int, usuario_id: int, db: Session = Depends(get_db)):
    return ProyectoService(db).responder_invitacion(id_proyecto, usuario_id, aceptar=False)
