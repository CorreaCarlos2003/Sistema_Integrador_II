from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

class ProyectoBase(BaseModel):
    nombre: str = Field(..., max_length=150)
    descripcion: Optional[str] = None


class ProyectoCrear(ProyectoBase):
    estado: Optional[str] = "Por iniciar"
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


class ProyectoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    estado: str
    fecha_creacion: datetime
    fecha_fin: Optional[date] = None

    class Config:
        from_attributes = True


class UsuarioResumen(BaseModel):
    id: int
    nombre: str
    rol: str
    cargo: Optional[str] = None

    class Config:
        from_attributes = True


class ProyectoCardResponse(BaseModel):
    id: int
    codigo: str  # Ej: PRJ-001
    nombre: str
    descripcion: Optional[str] = None
    estado: str
    fecha_creacion: datetime
    fecha_fin: Optional[date] = None
    responsable: Optional[UsuarioResumen] = None
    miembros: List[UsuarioResumen] = []
    total_documentos: int = 0  # Listo para enlazar a tu tabla de documentos

    class Config:
        from_attributes = True

class PaginatedProyectosResponse(BaseModel):
    items: List[ProyectoCardResponse]
    total: int
    page: int
    limit: int
    total_pages: int