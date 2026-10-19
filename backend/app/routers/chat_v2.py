from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.chat_auth import usuario_chat, verificar_consulta_proyecto
from app.core.rag_readiness import requerir_rag_listo
from app.database.conexion import get_db
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoVersionResponse
from app.schemas.chat_v2 import (
    ChatEnviar,
    ChatEnviarRespuesta,
    ComparacionEnviar,
    ConversacionCrear,
    ConversacionDetalle,
    ConversacionEditar,
    ConversacionRespuesta,
    ConversacionesPagina,
)
from app.services.chat_v2_service import ChatV2Service

router = APIRouter(prefix="/proyectos/{proyecto_id}/conversaciones", tags=["Chat documental v2"])
versiones_router = APIRouter(prefix="/proyectos/{proyecto_id}/documentos", tags=["Chat documental v2"])


def servicio(
    proyecto_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_chat),
) -> ChatV2Service:
    verificar_consulta_proyecto(db, usuario, proyecto_id)
    return ChatV2Service(db, usuario.id)


@versiones_router.get("/versiones", response_model=list[DocumentoVersionResponse])
def listar_versiones(proyecto_id: int, chat: ChatV2Service = Depends(servicio)):
    return chat.listar_versiones(proyecto_id)


@router.post("", response_model=ConversacionRespuesta, status_code=201)
def crear(proyecto_id: int, datos: ConversacionCrear, chat: ChatV2Service = Depends(servicio)):
    return chat.crear(proyecto_id, datos.titulo)


@router.get("", response_model=ConversacionesPagina)
def listar(
    proyecto_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    archivadas: bool = False,
    chat: ChatV2Service = Depends(servicio),
):
    return chat.listar(proyecto_id, page, limit, archivadas)


@router.get("/{conversacion_id}", response_model=ConversacionDetalle)
def detalle(proyecto_id: int, conversacion_id: int, chat: ChatV2Service = Depends(servicio)):
    return chat.detalle(proyecto_id, conversacion_id)


@router.patch("/{conversacion_id}", response_model=ConversacionRespuesta)
def renombrar(
    proyecto_id: int, conversacion_id: int, datos: ConversacionEditar,
    chat: ChatV2Service = Depends(servicio),
):
    return chat.renombrar(proyecto_id, conversacion_id, datos.titulo)


@router.post("/{conversacion_id}/archivar", response_model=ConversacionRespuesta)
def archivar(proyecto_id: int, conversacion_id: int, chat: ChatV2Service = Depends(servicio)):
    return chat.archivar(proyecto_id, conversacion_id, False)


@router.post("/{conversacion_id}/restaurar", response_model=ConversacionRespuesta)
def restaurar(proyecto_id: int, conversacion_id: int, chat: ChatV2Service = Depends(servicio)):
    return chat.archivar(proyecto_id, conversacion_id, True)


@router.post("/{conversacion_id}/mensajes", response_model=ChatEnviarRespuesta)
def enviar(
    proyecto_id: int, conversacion_id: int, datos: ChatEnviar,
    chat: ChatV2Service = Depends(servicio),
    _rag: None = Depends(requerir_rag_listo),
):
    return chat.enviar(proyecto_id, conversacion_id, datos)


@router.post("/{conversacion_id}/mensajes/{mensaje_id}/reintentar", response_model=ChatEnviarRespuesta)
def reintentar(
    proyecto_id: int, conversacion_id: int, mensaje_id: int,
    chat: ChatV2Service = Depends(servicio),
    _rag: None = Depends(requerir_rag_listo),
):
    return chat.reintentar(proyecto_id, conversacion_id, mensaje_id)


@router.post("/{conversacion_id}/comparaciones", response_model=ChatEnviarRespuesta)
def comparar(
    proyecto_id: int, conversacion_id: int, datos: ComparacionEnviar,
    chat: ChatV2Service = Depends(servicio),
):
    return chat.comparar(proyecto_id, conversacion_id, datos)
