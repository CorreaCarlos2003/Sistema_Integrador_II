from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.conexion import get_db
from app.schemas.usuario import UsuarioEditar, UsuarioEstado, UsuarioNuevo
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("")
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = UsuarioService(db).listar_usuarios()
    return [
        {
            "id": u.id,
            "nombre": (u.nombre or "").strip(),
            "correo": u.correo,
            "rol": (u.rol or "").strip(),
            "estado": 1 if u.estado else 0,
        }
        for u in usuarios
    ]


@router.post("")
def crear_usuario(datos: UsuarioNuevo, db: Session = Depends(get_db)):
    u = UsuarioService(db).crear_usuario(datos)
    return {
        "id": u.id,
        "nombre": (u.nombre or "").strip(),
        "correo": u.correo,
        "rol": (u.rol or "").strip(),
        "estado": 1 if u.estado else 0,
    }


@router.put("/{id_usuario}")
def editar_usuario(id_usuario: int, datos: UsuarioEditar, db: Session = Depends(get_db)):
    u = UsuarioService(db).editar_usuario(id_usuario, datos)
    return {
        "id": u.id,
        "nombre": (u.nombre or "").strip(),
        "correo": u.correo,
        "rol": (u.rol or "").strip(),
        "estado": 1 if u.estado else 0,
    }


@router.patch("/{id_usuario}/estado")
def cambiar_estado(id_usuario: int, datos: UsuarioEstado, db: Session = Depends(get_db)):
    u = UsuarioService(db).cambiar_estado(id_usuario, datos)
    return {
        "id": u.id,
        "nombre": (u.nombre or "").strip(),
        "correo": u.correo,
        "rol": (u.rol or "").strip(),
        "estado": 1 if u.estado else 0,
    }


@router.delete("/{id_usuario}")
def eliminar_usuario(id_usuario: int, db: Session = Depends(get_db)):
    return UsuarioService(db).eliminar_usuario(id_usuario)