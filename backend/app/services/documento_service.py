import os
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.documento import Documento
from app.repositories.documento_repository import DocumentoRepository
from app.repositories.proyecto_repository import ProyectoRepository
from app.repositories.conversacion_repository import ConversacionRepository
from app.schemas.documento import ChatRespuesta, ChatResultado
from app.services import groq_service, rag_service

EXTENSIONES_PERMITIDAS = {".docx"}


class DocumentoService:
    def __init__(self, db: Session):
        self.repo = DocumentoRepository(db)
        self.proyectos = ProyectoRepository(db)
        self.conversaciones = ConversacionRepository(db)

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

        nombre = os.path.basename((archivo.filename or "").replace("\\", "/"))
        extension = os.path.splitext(nombre)[1].lower()
        if extension not in EXTENSIONES_PERMITIDAS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se admiten archivos .docx por el momento",
            )

        directorio = rag_service.ruta_documentos(proyecto_id)
        ruta_archivo = os.path.join(directorio, f"{uuid4().hex}_{nombre}")

        with open(ruta_archivo, "wb") as destino:
            destino.write(archivo.file.read())

        try:
            chunks = rag_service.indexar_documento(proyecto_id, ruta_archivo, nombre)
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

    def chat(
        self, proyecto_id: int, usuario_id: int, pregunta: str, k: int,
        conversacion_id: int | None = None,
    ) -> ChatRespuesta:
        self._obtener_proyecto_o_404(proyecto_id)
        if not pregunta.strip():
            raise HTTPException(status_code=422, detail="La pregunta no puede estar vacía")
        conversacion = self._obtener_conversacion(proyecto_id, usuario_id, conversacion_id)
        resultados = rag_service.buscar(proyecto_id, pregunta, k)
        if not resultados:
            raise HTTPException(status_code=422, detail="El proyecto no tiene fragmentos indexados")
        documentos = {
            documento.ruta_archivo: documento
            for documento in self.repo.listar_por_proyecto(proyecto_id)
        }
        fuentes = []
        for resultado in resultados:
            documento = documentos.get(resultado.pop("ruta_archivo"))
            if documento is None:
                continue
            resultado["documento_id"] = documento.id
            resultado["documento"] = documento.nombre
            fuentes.append(resultado)
        if not fuentes:
            raise HTTPException(status_code=422, detail="El proyecto no tiene fragmentos vigentes")
        respuesta = groq_service.responder_pregunta(pregunta, fuentes)
        conversacion = self.conversaciones.guardar_intercambio(
            conversacion, proyecto_id, usuario_id, pregunta, respuesta, "chat",
            {"resultados": fuentes},
        )
        return ChatRespuesta(
            conversacion_id=conversacion.id,
            respuesta=respuesta,
            resultados=[ChatResultado(**fuente) for fuente in fuentes],
        )

    def _obtener_conversacion(self, proyecto_id: int, usuario_id: int, conversacion_id: int | None):
        if conversacion_id is None:
            return None
        conversacion = self.conversaciones.obtener(conversacion_id, proyecto_id, usuario_id)
        if conversacion is None:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
        return conversacion

    def comparar(
        self, proyecto_id: int, usuario_id: int, documento_anterior_id: int,
        documento_nuevo_id: int, instrucciones: str, conversacion_id: int | None,
    ) -> dict:
        self._obtener_proyecto_o_404(proyecto_id)
        if documento_anterior_id == documento_nuevo_id:
            raise HTTPException(status_code=422, detail="Selecciona dos documentos diferentes")
        conversacion = self._obtener_conversacion(proyecto_id, usuario_id, conversacion_id)
        anterior = self.repo.obtener_por_id(documento_anterior_id)
        nuevo = self.repo.obtener_por_id(documento_nuevo_id)
        if not anterior or not nuevo or anterior.proyecto_id != proyecto_id or nuevo.proyecto_id != proyecto_id:
            raise HTTPException(status_code=404, detail="Documento no encontrado en el proyecto")
        if not os.path.isfile(anterior.ruta_archivo) or not os.path.isfile(nuevo.ruta_archivo):
            raise HTTPException(status_code=404, detail="No se encuentra el archivo de una versión")
        texto_anterior = rag_service.extraer_texto_docx(anterior.ruta_archivo)
        texto_nuevo = rag_service.extraer_texto_docx(nuevo.ruta_archivo)
        pregunta = f"Compara {anterior.nombre} con {nuevo.nombre}"
        if instrucciones.strip():
            pregunta += f". {instrucciones.strip()}"
        respuesta = groq_service.comparar_documentos(
            anterior.nombre, texto_anterior, nuevo.nombre, texto_nuevo, instrucciones.strip()
        )
        documentos = [
            {"id": anterior.id, "nombre": anterior.nombre, "version": "anterior"},
            {"id": nuevo.id, "nombre": nuevo.nombre, "version": "nueva"},
        ]
        conversacion = self.conversaciones.guardar_intercambio(
            conversacion, proyecto_id, usuario_id, pregunta, respuesta, "comparacion",
            {"documentos": documentos},
        )
        return {"conversacion_id": conversacion.id, "respuesta": respuesta, "documentos": documentos}
