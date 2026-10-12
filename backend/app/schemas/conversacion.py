from datetime import datetime

from pydantic import BaseModel, Field


class MensajeResponse(BaseModel):
    id: int
    rol: str
    contenido: str
    tipo: str
    metadatos: dict
    fecha: datetime

    model_config = {"from_attributes": True}


class ConversacionResponse(BaseModel):
    id: int
    proyecto_id: int
    titulo: str
    fecha: datetime

    model_config = {"from_attributes": True}


class ConversacionDetalle(ConversacionResponse):
    mensajes: list[MensajeResponse]


class ComparacionPregunta(BaseModel):
    documento_anterior_id: int = Field(..., gt=0)
    documento_nuevo_id: int = Field(..., gt=0)
    instrucciones: str = Field("", max_length=2000)
    conversacion_id: int | None = Field(None, gt=0)


class ComparacionRespuesta(BaseModel):
    conversacion_id: int
    respuesta: str
    documentos: list[dict]
