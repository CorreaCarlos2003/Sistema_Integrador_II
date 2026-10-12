from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.conexion import get_db
from app.core.seguridad import usuario_actual, verificar_acceso_proyecto
from app.models.usuario import Usuario
from app.repositories.conversacion_repository import ConversacionRepository
from app.schemas.conversacion import (
    ComparacionPregunta, ComparacionRespuesta, ConversacionDetalle, ConversacionResponse,
)
from app.schemas.documento import ChatPregunta, ChatRespuesta, DocumentoResponse
from app.services.documento_service import DocumentoService

router = APIRouter(prefix="/proyectos/{id_proyecto}", tags=["Documentos RAG"])


@router.get("/documentos", response_model=List[DocumentoResponse])
def listar_documentos(
    id_proyecto: int, db: Session = Depends(get_db), usuario: Usuario = Depends(usuario_actual)
):
    verificar_acceso_proyecto(db, usuario, id_proyecto)
    return DocumentoService(db).listar_documentos(id_proyecto)


@router.post("/documentos", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
def subir_documento(
    id_proyecto: int, archivo: UploadFile = File(...), db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    verificar_acceso_proyecto(db, usuario, id_proyecto)
    return DocumentoService(db).subir_documento(id_proyecto, archivo)


@router.delete("/documentos/{id_documento}")
def eliminar_documento(
    id_proyecto: int, id_documento: int, db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    verificar_acceso_proyecto(db, usuario, id_proyecto)
    return DocumentoService(db).eliminar_documento(id_proyecto, id_documento)


@router.post("/chat", response_model=ChatRespuesta)
def chat(
    id_proyecto: int, datos: ChatPregunta, db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    verificar_acceso_proyecto(db, usuario, id_proyecto)
    return DocumentoService(db).chat(
        id_proyecto, usuario.id, datos.pregunta.strip(), datos.k, datos.conversacion_id
    )


@router.post("/comparaciones", response_model=ComparacionRespuesta)
def comparar(
    id_proyecto: int, datos: ComparacionPregunta, db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    verificar_acceso_proyecto(db, usuario, id_proyecto)
    return DocumentoService(db).comparar(
        id_proyecto, usuario.id, datos.documento_anterior_id, datos.documento_nuevo_id,
        datos.instrucciones, datos.conversacion_id,
    )


@router.get("/conversaciones", response_model=List[ConversacionResponse])
def listar_conversaciones(
    id_proyecto: int, db: Session = Depends(get_db), usuario: Usuario = Depends(usuario_actual)
):
    verificar_acceso_proyecto(db, usuario, id_proyecto)
    DocumentoService(db)._obtener_proyecto_o_404(id_proyecto)
    return ConversacionRepository(db).listar(id_proyecto, usuario.id)


@router.post("/conversaciones", response_model=ConversacionResponse, status_code=status.HTTP_201_CREATED)
def crear_conversacion(
    id_proyecto: int, db: Session = Depends(get_db), usuario: Usuario = Depends(usuario_actual)
):
    verificar_acceso_proyecto(db, usuario, id_proyecto)
    DocumentoService(db)._obtener_proyecto_o_404(id_proyecto)
    return ConversacionRepository(db).crear(id_proyecto, usuario.id)


@router.get("/conversaciones/{id_conversacion}", response_model=ConversacionDetalle)
def obtener_conversacion(
    id_proyecto: int, id_conversacion: int, db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    verificar_acceso_proyecto(db, usuario, id_proyecto)
    conversacion = ConversacionRepository(db).obtener(id_conversacion, id_proyecto, usuario.id)
    if conversacion is None:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return conversacion
