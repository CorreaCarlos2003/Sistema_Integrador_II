from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

class ProyectoBase(BaseModel):
    nombre: str = Field(..., max_length=150)
    descripcion: Optional[str] = None


class ProyectoCrear(ProyectoBase):
    estado: Optional[str] = "Por iniciar"


class ProyectoEditar(BaseModel):
    nombre: Optional[str] = Field(None, max_length=150)
    descripcion: Optional[str] = None
    estado: Optional[str] = Field(None, max_length=50)


class ProyectoEstado(BaseModel):
    estado: str = Field(..., max_length=50)


class ProyectoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    estado: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class UsuarioResumen(BaseModel):
    id: int
    nombre: str
    rol: str

    class Config:
        from_attributes = True


class ProyectoCardResponse(BaseModel):
    id: int
    codigo: str  # Ej: PRJ-001
    nombre: str
    descripcion: Optional[str] = None
    estado: str
    fecha_creacion: datetime
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