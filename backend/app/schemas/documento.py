from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class DocumentoResponse(BaseModel):
    id: int
    proyecto_id: int
    nombre: str
    chunks_indexados: int
    fecha_subida: datetime
    estado_aprobacion: str
    version_id: Optional[int] = None
    numero_version: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentoPendienteResponse(BaseModel):
    id: int
    proyecto_id: int
    nombre: str
    fecha_subida: datetime
    subido_por: Optional[int] = None
    subido_por_nombre: str

    class Config:
        from_attributes = True


class ChatPregunta(BaseModel):
    pregunta: str = Field(..., min_length=1)
    k: int = Field(5, ge=1, le=20)


class ChatResultado(BaseModel):
    documento: str
    chunk_id: int
    contenido: str
    score: float


class ChatRespuesta(BaseModel):
    resultados: List[ChatResultado]


class DocumentoVersionResponse(BaseModel):
    id: int
    version_id: int
    documento_id: int
    numero: str
    nombre: str
    chunks_indexados: int
    vigente: bool
    fecha: datetime

    class Config:
        from_attributes = True
