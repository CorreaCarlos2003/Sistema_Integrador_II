from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

class ProyectoBase(BaseModel):
    nombre: str = Field(..., max_length=150)
    descripcion: Optional[str] = None


class ProyectoCrear(ProyectoBase):
    responsable_id: int = Field(..., description="ID del usuario responsable")
    cargo_responsable: Optional[str] = Field(None, description="Cargo del responsable en el proyecto")
    fecha_fin: Optional[date] = Field(None, description="Fecha estimada de fin del proyecto")


class ProyectoEditar(BaseModel):
    nombre: Optional[str] = Field(None, max_length=150)
    descripcion: Optional[str] = None
    estado: Optional[str] = Field(None, max_length=50)
    fecha_fin: Optional[date] = None


class ProyectoEstado(BaseModel):
    estado: str = Field(..., max_length=50)


class ProyectoArchivar(BaseModel):
    archivado: bool


class ProyectoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    estado: str
    archivado: bool = False
    fecha_creacion: datetime
    fecha_ultima_actividad: Optional[datetime] = None
    fecha_fin: Optional[date] = None

    class Config:
        from_attributes = True


class UsuarioResumen(BaseModel):
    id: int
    nombre: str
    correo: Optional[EmailStr] = None
    rol: str
    rol_proyecto: Optional[str] = None
    cargo: Optional[str] = None
    fecha_ingreso: Optional[datetime] = None
    estado_invitacion: Optional[str] = None
    activo: bool = True

    class Config:
        from_attributes = True


class MiembroEstado(BaseModel):
    activo: bool


class MiembroInvitar(BaseModel):
    usuario_id: int = Field(..., description="ID del usuario a invitar")
    rol_proyecto: str = Field("MIEMBRO", description="RESPONSABLE o MIEMBRO")
    cargo: Optional[str] = Field(None, max_length=100)


class MiembroProyectoResponse(BaseModel):
    usuario_id: int
    nombre: str
    correo: EmailStr
    rol_proyecto: str
    cargo: Optional[str] = None
    estado_invitacion: str
    invitacion_enviada: bool


class InvitacionProyectoResponse(BaseModel):
    proyecto_id: int
    proyecto_nombre: str
    rol_proyecto: str
    cargo: Optional[str] = None
    fecha_ingreso: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProyectoCardResponse(BaseModel):
    id: int
    codigo: str  # Ej: PRJ-001
    nombre: str
    descripcion: Optional[str] = None
    estado: str
    archivado: bool = False
    fecha_creacion: datetime
    fecha_ultima_actividad: Optional[datetime] = None
    fecha_fin: Optional[date] = None
    responsable: Optional[UsuarioResumen] = None  # Primer responsable (compatibilidad)
    responsables: List[UsuarioResumen] = []
    miembros: List[UsuarioResumen] = []
    total_documentos: int = 0

    class Config:
        from_attributes = True

class ResponsableOpcion(BaseModel):
    id: int
    nombre: str


class PaginatedProyectosResponse(BaseModel):
    items: List[ProyectoCardResponse]
    total: int
    page: int
    limit: int
    total_pages: int