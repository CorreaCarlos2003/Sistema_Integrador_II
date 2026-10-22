from datetime import datetime

from pydantic import BaseModel, Field

from app.core.config import CHAT_MAX_QUESTION_CHARS


class ConversacionCrear(BaseModel):
    titulo: str | None = Field(None, min_length=1, max_length=255)


class ConversacionEditar(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=255)


class CitaRespuesta(BaseModel):
    numero: int
    documento_id: int | None
    documento: str
    version_id: int | None
    version: str | None
    pagina: int | None
    seccion: str | None
    extracto: str
    chunk_id: str | None


class MensajeRespuesta(BaseModel):
    id: int
    rol: str
    contenido: str
    tipo: str
    estado: str
    codigo_error: str | None
    fecha: datetime
    citas: list[CitaRespuesta] = []


class ConversacionRespuesta(BaseModel):
    id: int
    proyecto_id: int
    titulo: str
    archivada: bool
    fecha: datetime
    fecha_actualizacion: datetime


class ConversacionDetalle(ConversacionRespuesta):
    mensajes: list[MensajeRespuesta]


class ConversacionesPagina(BaseModel):
    items: list[ConversacionRespuesta]
    total: int
    page: int
    limit: int


class ChatEnviar(BaseModel):
    pregunta: str = Field(..., min_length=1, max_length=CHAT_MAX_QUESTION_CHARS)
    documento_ids: list[int] | None = Field(None, max_length=20)


class ChatEnviarRespuesta(BaseModel):
    mensaje_usuario_id: int
    mensaje_asistente_id: int | None
    estado: str
    respuesta: str | None
    citas: list[CitaRespuesta]


class DocumentoSeleccion(BaseModel):
    documento_id: int = Field(..., gt=0)
    version_id: int = Field(..., gt=0)


class ComparacionEnviar(BaseModel):
    origen: DocumentoSeleccion
    destino: DocumentoSeleccion
    seccion: str | None = Field(None, max_length=255)
