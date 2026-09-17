from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class DocumentoResponse(BaseModel):
    id: int
    proyecto_id: int
    nombre: str
    chunks_indexados: int
    fecha_subida: datetime

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
