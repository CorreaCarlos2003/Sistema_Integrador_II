from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from app.core.config import ALGORITMO, MAIL_PASSWORD, MAIL_USER, SECRET_KEY
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.auth import LoginRequest, RecuperarRequest
from app.services.correo import enviar_contrasena


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

        token = jwt.encode(
            {
                "sub": str(usuario.id),
                "correo": usuario.correo,
                "rol": usuario.rol,
                "exp": datetime.now(timezone.utc) + timedelta(hours=8),
            },
            SECRET_KEY,
            algorithm=ALGORITMO,
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "id": usuario.id,
            "nombre": (usuario.nombre or "").strip(),
            "correo": usuario.correo,
            "rol": (usuario.rol or "").strip(),
        }

    def recuperar(self, datos: RecuperarRequest) -> dict:
        if not MAIL_USER or not MAIL_PASSWORD:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="El correo de envío no está configurado.",
            )

        usuario = self.repo.obtener_por_correo(datos.correo)
        if usuario and usuario.estado:
            try:
                enviar_contrasena(usuario.correo, (usuario.contraseña_hash or "").strip())
            except Exception as error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"No se pudo enviar el correo: {error}",
                ) from error

        return {"mensaje": "Si el correo existe, te enviaremos tu contraseña."}