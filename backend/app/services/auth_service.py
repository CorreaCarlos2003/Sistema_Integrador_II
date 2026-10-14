from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from app.core.config import ALGORITMO, SECRET_KEY, SESION_DURACION_HORAS
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.auth import LoginRequest
from app.services.auditoria_service import registrar_evento


class AuthService:
    def __init__(self, db: Session):
        self.repo = UsuarioRepository(db)

    def autenticar(self, datos: LoginRequest) -> dict:
        usuario = self.repo.obtener_por_correo(datos.correo)

        # Comparación plana tal cual la tenías
        if usuario is None or (usuario.contraseña_hash or "").strip() != datos.contrasena:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contraseña incorrectos",
            )

        if not usuario.estado:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo",
            )

        # Hora local (coincide con la zona horaria configurada en Postgres), no UTC
        usuario.ultimo_acceso = datetime.now()
        usuario = self.repo.guardar(usuario)

        token = jwt.encode(
            {
                "sub": str(usuario.id),
                "correo": usuario.correo,
                "rol": usuario.rol,
                "exp": datetime.now(timezone.utc) + timedelta(hours=SESION_DURACION_HORAS),
            },
            SECRET_KEY,
            algorithm=ALGORITMO,
        )

        registrar_evento(
            self.repo.db,
            actor_id=usuario.id,
            modulo="acceso",
            tipo="acceso",
            descripcion=f"{(usuario.nombre or '').strip()} accedió al sistema",
            referencia=None,
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "id": usuario.id,
            "nombre": (usuario.nombre or "").strip(),
            "correo": usuario.correo,
            "rol": (usuario.rol or "").strip(),
        }