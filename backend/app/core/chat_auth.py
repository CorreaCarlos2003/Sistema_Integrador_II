"""Autenticación y autorización exclusiva de las rutas del chat v2."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import ALGORITMO, SECRET_KEY
from app.database.conexion import get_db
from app.models.permiso_proyecto import PermisoProyecto
from app.models.usuario import Usuario
from app.models.usuario_proyecto import UsuarioProyecto

bearer = HTTPBearer(auto_error=False)


def usuario_chat(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITMO])
        usuario_id = int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Sesión inválida o vencida") from exc
    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.estado:
        raise HTTPException(status_code=401, detail="Sesión inválida o vencida")
    return usuario


def verificar_consulta_proyecto(db: Session, usuario: Usuario, proyecto_id: int) -> None:
    # Los administradores poseen acceso global según la matriz de permisos actual.
    if usuario.rol == "Administrador":
        return
    miembro = (
        db.query(UsuarioProyecto)
        .filter_by(usuario_id=usuario.id, proyecto_id=proyecto_id, activo=True)
        .first()
    )
    if miembro is None or miembro.estado_invitacion != "ACEPTADA":
        raise HTTPException(status_code=403, detail="Sin acceso al proyecto")
    permiso = db.get(PermisoProyecto, (usuario.id, proyecto_id))
    if permiso is not None and (not permiso.ver or not permiso.consulta_ia):
        raise HTTPException(status_code=403, detail="Sin permiso para consultar IA")
