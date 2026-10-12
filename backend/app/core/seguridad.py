from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import ALGORITMO, SECRET_KEY
from app.database.conexion import get_db
from app.models.usuario import Usuario
from app.models.usuario_proyecto import UsuarioProyecto


_bearer = HTTPBearer(auto_error=False)


def usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if not SECRET_KEY:
        raise HTTPException(status_code=503, detail="JWT_SECRET_KEY no está configurada")
    error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no válida")
    if credenciales is None:
        raise error
    try:
        payload = jwt.decode(credenciales.credentials, SECRET_KEY, algorithms=[ALGORITMO])
        usuario_id = int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise error from exc
    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.estado:
        raise error
    return usuario


def verificar_acceso_proyecto(db: Session, usuario: Usuario, proyecto_id: int) -> None:
    if usuario.rol == "Administrador":
        return
    pertenece = db.query(UsuarioProyecto).filter_by(
        usuario_id=usuario.id, proyecto_id=proyecto_id
    ).first()
    if pertenece is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin acceso al proyecto")
