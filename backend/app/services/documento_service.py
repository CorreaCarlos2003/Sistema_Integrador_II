import os

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.documento import Documento
from app.repositories.documento_repository import DocumentoRepository
from app.repositories.proyecto_repository import ProyectoRepository
from app.schemas.documento import ChatRespuesta, ChatResultado
from app.services import rag_service

EXTENSIONES_PERMITIDAS = {".docx"}


class DocumentoService:
    def __init__(self, db: Session):
        self.repo = DocumentoRepository(db)
        self.proyectos = ProyectoRepository(db)

    def _obtener_proyecto_o_404(self, proyecto_id: int):
        proyecto = self.proyectos.obtener_por_id(proyecto_id)
        if not proyecto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proyecto con ID {proyecto_id} no encontrado",
            )
        return proyecto

    def listar_documentos(self, proyecto_id: int) -> list[Documento]:
        self._obtener_proyecto_o_404(proyecto_id)
        return self.repo.listar_por_proyecto(proyecto_id)

    def subir_documento(self, proyecto_id: int, archivo: UploadFile) -> Documento:
        self._obtener_proyecto_o_404(proyecto_id)

        nombre = archivo.filename or ""
        extension = os.path.splitext(nombre)[1].lower()
        if extension not in EXTENSIONES_PERMITIDAS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se admiten archivos .docx por el momento",
            )

        directorio = rag_service.ruta_documentos(proyecto_id)
        ruta_archivo = os.path.join(directorio, nombre)

        with open(ruta_archivo, "wb") as destino:
            destino.write(archivo.file.read())

        try:
            chunks = rag_service.indexar_documento(proyecto_id, ruta_archivo)
        except Exception as exc:
            os.remove(ruta_archivo)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"No se pudo procesar el documento: {exc}",
            ) from exc

        documento = Documento(
            proyecto_id=proyecto_id,
            nombre=nombre,
            ruta_archivo=ruta_archivo,
            chunks_indexados=chunks,
        )
        try:
            return self.repo.guardar(documento)
        except Exception:
            rag_service.eliminar_documento_indexado(proyecto_id, ruta_archivo)
            os.remove(ruta_archivo)
            raise

    def eliminar_documento(self, proyecto_id: int, id_documento: int) -> dict:
        self._obtener_proyecto_o_404(proyecto_id)

        documento = self.repo.obtener_por_id(id_documento)
        if not documento or documento.proyecto_id != proyecto_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento con ID {id_documento} no encontrado en este proyecto",
            )

        rag_service.eliminar_documento_indexado(proyecto_id, documento.ruta_archivo)
        if os.path.exists(documento.ruta_archivo):
            os.remove(documento.ruta_archivo)

        self.repo.eliminar(documento)
        return {"ok": True, "detail": f"Documento {id_documento} eliminado correctamente"}

    def chat(self, proyecto_id: int, pregunta: str, k: int) -> ChatRespuesta:
        self._obtener_proyecto_o_404(proyecto_id)

        resultados = rag_service.buscar(proyecto_id, pregunta, k)
        return ChatRespuesta(resultados=[ChatResultado(**r) for r in resultados])
