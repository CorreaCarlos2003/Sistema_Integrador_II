from typing import List, Optional
from pydantic import BaseModel


class ModuloPermiso(BaseModel):
    clave: str
    nombre: str
    descripcion: str
    asignado: bool
    ver: bool
    crear: bool
    editar: bool
    eliminar: bool
    nota: Optional[str] = None


class PermisosGlobalesResponse(BaseModel):
    rol: str
    bloqueado: bool = False
    modulos: List[ModuloPermiso]


class ModuloPermisoActualizar(BaseModel):
    clave: str
    asignado: bool = True
    ver: bool = False
    crear: bool = False
    editar: bool = False
    eliminar: bool = False
    nota: Optional[str] = None


class PermisosGlobalesActualizar(BaseModel):
    modulos: List[ModuloPermisoActualizar]


class MiembroPermiso(BaseModel):
    usuario_id: int
    nombre: str
    correo: Optional[str] = None
    rol_proyecto: str
    cargo: Optional[str] = None
    ver: bool
    subir_crear: bool
    editar_anotar: bool
    descargar: bool
    consulta_ia: bool
    nota: Optional[str] = None


class PermisosProyectoResponse(BaseModel):
    proyecto_id: int
    miembros: List[MiembroPermiso]


class MiembroPermisoActualizar(BaseModel):
    usuario_id: int
    ver: bool = True
    subir_crear: bool = False
    editar_anotar: bool = False
    descargar: bool = False
    consulta_ia: bool = False
    nota: Optional[str] = None


class PermisosProyectoActualizar(BaseModel):
    miembros: List[MiembroPermisoActualizar]
