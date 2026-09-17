from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.database.conexion import get_db
from app.schemas.documento import ChatPregunta, ChatRespuesta, DocumentoResponse
from app.services.documento_service import DocumentoService

router = APIRouter(prefix="/proyectos/{id_proyecto}", tags=["Documentos RAG"])


@router.get("/documentos", response_model=List[DocumentoResponse])
def listar_documentos(id_proyecto: int, db: Session = Depends(get_db)):
    return DocumentoService(db).listar_documentos(id_proyecto)


@router.post("/documentos", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
def subir_documento(id_proyecto: int, archivo: UploadFile = File(...), db: Session = Depends(get_db)):
    return DocumentoService(db).subir_documento(id_proyecto, archivo)


@router.delete("/documentos/{id_documento}")
def eliminar_documento(id_proyecto: int, id_documento: int, db: Session = Depends(get_db)):
    return DocumentoService(db).eliminar_documento(id_proyecto, id_documento)


@router.post("/chat", response_model=ChatRespuesta)
def chat(id_proyecto: int, datos: ChatPregunta, db: Session = Depends(get_db)):
    return DocumentoService(db).chat(id_proyecto, datos.pregunta, datos.k)
