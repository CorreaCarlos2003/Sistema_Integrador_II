from typing import List, Optional

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import obtener_actor_id
from app.database.conexion import get_db
from app.schemas.documento import ChatPregunta, ChatRespuesta, DocumentoPendienteResponse, DocumentoResponse
from app.services.documento_service import DocumentoService

router = APIRouter(prefix="/proyectos/{id_proyecto}", tags=["Documentos RAG"])


@router.get("/documentos", response_model=List[DocumentoResponse])
def listar_documentos(id_proyecto: int, db: Session = Depends(get_db)):
    return DocumentoService(db).listar_documentos(id_proyecto)


@router.get("/documentos/pendientes", response_model=List[DocumentoPendienteResponse])
def listar_documentos_pendientes(id_proyecto: int, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return DocumentoService(db).listar_pendientes(id_proyecto, actor_id=actor_id)


@router.post("/documentos", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
def subir_documento(id_proyecto: int, archivo: UploadFile = File(...), db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return DocumentoService(db).subir_documento(id_proyecto, archivo, actor_id=actor_id)


@router.post("/documentos/{id_documento}/aprobar", response_model=DocumentoResponse)
def aprobar_documento(id_proyecto: int, id_documento: int, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return DocumentoService(db).aprobar_documento(id_proyecto, id_documento, actor_id=actor_id)


@router.post("/documentos/{id_documento}/rechazar")
def rechazar_documento(id_proyecto: int, id_documento: int, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return DocumentoService(db).rechazar_documento(id_proyecto, id_documento, actor_id=actor_id)


@router.delete("/documentos/{id_documento}")
def eliminar_documento(id_proyecto: int, id_documento: int, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return DocumentoService(db).eliminar_documento(id_proyecto, id_documento, actor_id=actor_id)


@router.post("/chat", response_model=ChatRespuesta)
def chat(id_proyecto: int, datos: ChatPregunta, db: Session = Depends(get_db), actor_id: Optional[int] = Depends(obtener_actor_id)):
    return DocumentoService(db).chat(id_proyecto, datos.pregunta, datos.k, actor_id=actor_id)
