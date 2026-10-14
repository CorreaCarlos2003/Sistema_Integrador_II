from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import obtener_actor_id
from app.database.conexion import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioEditar, UsuarioEstado, UsuarioNuevo
from app.services.usuario_service import UsuarioService, esta_activo

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


def _serializar(u: Usuario) -> dict:
    return {
        "id": u.id,
        "nombre": (u.nombre or "").strip(),
        "correo": u.correo,
        "rol": (u.rol or "").strip(),
        "estado": 1 if u.estado else 0,
        "activo": esta_activo(u),
        "fecha_creacion": u.fecha_creacion.isoformat() if u.fecha_creacion else None,
        "ultimo_acceso": u.ultimo_acceso.isoformat() if u.ultimo_acceso else None,
    }


@router.get("")
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = UsuarioService(db).listar_usuarios()
    return [_serializar(u) for u in usuarios]


@router.post("")
def crear_usuario(datos: UsuarioNuevo, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    u, invitacion_enviada = UsuarioService(db).crear_usuario(datos, actor_id=actor_id)
    return {**_serializar(u), "invitacion_enviada": invitacion_enviada}


@router.put("/{id_usuario}")
def editar_usuario(id_usuario: int, datos: UsuarioEditar, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    u = UsuarioService(db).editar_usuario(id_usuario, datos, actor_id=actor_id)
    return _serializar(u)


@router.patch("/{id_usuario}/estado")
def cambiar_estado(id_usuario: int, datos: UsuarioEstado, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    u = UsuarioService(db).cambiar_estado(id_usuario, datos, actor_id=actor_id)
    return _serializar(u)


@router.delete("/{id_usuario}")
def eliminar_usuario(id_usuario: int, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return UsuarioService(db).eliminar_usuario(id_usuario, actor_id=actor_id)


@router.post("/{id_usuario}/actividad")
def registrar_actividad(id_usuario: int, db: Session = Depends(get_db)):
    u = UsuarioService(db).registrar_actividad(id_usuario)
    return _serializar(u)