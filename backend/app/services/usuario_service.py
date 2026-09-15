from typing import List
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.usuario import UsuarioEditar, UsuarioEstado, UsuarioNuevo


class UsuarioService:
    def __init__(self, db: Session):
        self.repo = UsuarioRepository(db)

    def listar_usuarios(self) -> List[Usuario]:
        return self.repo.listar()

    def crear_usuario(self, datos: UsuarioNuevo) -> Usuario:
        if self.repo.obtener_por_correo(datos.correo):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se puede completar: el correo ya existe.",
            )

        nuevo_usuario = Usuario(
            nombre=datos.nombre.strip(),
            correo=datos.correo,
            contraseña_hash=datos.contrasena,  # Texto plano directo
            rol=datos.rol.strip(),
            estado=True,
        )

        try:
            return self.repo.guardar(nuevo_usuario)
        except IntegrityError as error:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Error de integridad de datos.",
            ) from error

    def editar_usuario(self, id_usuario: int, datos: UsuarioEditar) -> Usuario:
        usuario = self.repo.obtener_por_id(id_usuario)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        usuario.nombre = datos.nombre.strip()
        usuario.correo = datos.correo
        usuario.rol = datos.rol.strip()
        return self.repo.guardar(usuario)

    def cambiar_estado(self, id_usuario: int, datos: UsuarioEstado) -> Usuario:
        usuario = self.repo.obtener_por_id(id_usuario)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        usuario.estado = bool(datos.estado)
        return self.repo.guardar(usuario)

    def eliminar_usuario(self, id_usuario: int) -> dict:
        usuario = self.repo.obtener_por_id(id_usuario)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        self.repo.eliminar(usuario)
        return {"ok": True}