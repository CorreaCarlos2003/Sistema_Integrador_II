import logging
from datetime import datetime, timedelta
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import PRESENCIA_ACTIVA_MINUTOS
from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.usuario import UsuarioEditar, UsuarioEstado, UsuarioNuevo
from app.services.auditoria_service import registrar_evento
from app.services.mail_service import enviar_eliminacion_usuario, enviar_invitacion_usuario

logger = logging.getLogger(__name__)


def esta_activo(usuario: Usuario) -> bool:
    """Un usuario se considera activo si está habilitado y navegando el sistema en este momento."""
    if not usuario.estado or not usuario.ultimo_acceso:
        return False
    return datetime.now() - usuario.ultimo_acceso < timedelta(minutes=PRESENCIA_ACTIVA_MINUTOS)


class UsuarioService:
    def __init__(self, db: Session):
        self.repo = UsuarioRepository(db)

    def listar_usuarios(self) -> List[Usuario]:
        return self.repo.listar()

    def crear_usuario(self, datos: UsuarioNuevo, actor_id: int = None) -> tuple[Usuario, bool]:
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
            usuario_creado = self.repo.guardar(nuevo_usuario)
        except IntegrityError as error:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Error de integridad de datos.",
            ) from error

        invitacion_enviada = True
        try:
            enviar_invitacion_usuario(
                nombre=usuario_creado.nombre,
                correo=usuario_creado.correo,
                contrasena=datos.contrasena,
                rol=usuario_creado.rol,
            )
        except Exception:
            invitacion_enviada = False
            logger.exception("No se pudo enviar el correo de invitación a %s", usuario_creado.correo)

        registrar_evento(
            self.repo.db,
            actor_id=actor_id,
            modulo="usuarios",
            tipo="creacion",
            descripcion=f"Se creó el usuario {usuario_creado.nombre} ({usuario_creado.rol})",
            referencia=f"USR-NEW-{usuario_creado.id}",
        )

        return usuario_creado, invitacion_enviada

    def editar_usuario(self, id_usuario: int, datos: UsuarioEditar, actor_id: int = None) -> Usuario:
        usuario = self.repo.obtener_por_id(id_usuario)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        usuario.nombre = datos.nombre.strip()
        usuario.correo = datos.correo
        usuario.rol = datos.rol.strip()
        usuario = self.repo.guardar(usuario)

        registrar_evento(
            self.repo.db,
            actor_id=actor_id,
            modulo="usuarios",
            tipo="edicion",
            descripcion=f"Se editaron los datos del usuario {usuario.nombre}",
            referencia=f"USR-UPD-{usuario.id}",
        )
        return usuario

    def cambiar_estado(self, id_usuario: int, datos: UsuarioEstado, actor_id: int = None) -> Usuario:
        usuario = self.repo.obtener_por_id(id_usuario)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        usuario.estado = bool(datos.estado)
        usuario = self.repo.guardar(usuario)

        accion = "habilitó" if usuario.estado else "inhabilitó"
        registrar_evento(
            self.repo.db,
            actor_id=actor_id,
            modulo="usuarios",
            tipo="edicion" if usuario.estado else "alerta",
            descripcion=f"Se {accion} la cuenta del usuario {usuario.nombre}",
            referencia=f"USR-APP-{usuario.id}",
        )
        return usuario

    def eliminar_usuario(self, id_usuario: int, actor_id: int = None) -> dict:
        usuario = self.repo.obtener_por_id(id_usuario)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        nombre, correo = usuario.nombre, usuario.correo
        actor = self.repo.obtener_por_id(actor_id) if actor_id else None
        actor_nombre = actor.nombre if actor else "un administrador del sistema"
        actor_rol = actor.rol if actor else "Administrador"

        self.repo.eliminar(usuario)

        try:
            enviar_eliminacion_usuario(
                nombre=nombre,
                correo=correo,
                actor_nombre=actor_nombre,
                actor_rol=actor_rol,
            )
        except Exception:
            logger.exception("No se pudo enviar el correo de eliminación de cuenta a %s", correo)

        registrar_evento(
            self.repo.db,
            actor_id=actor_id,
            modulo="usuarios",
            tipo="eliminacion",
            descripcion=f"Se eliminó al usuario '{correo}'",
            referencia=f"USR-DEL-{id_usuario}",
        )
        return {"ok": True}

    def registrar_actividad(self, id_usuario: int) -> Usuario:
        """Refresca la marca de actividad (heartbeat) mientras el usuario navega el sistema."""
        usuario = self.repo.obtener_por_id(id_usuario)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        usuario.ultimo_acceso = datetime.now()
        return self.repo.guardar(usuario)