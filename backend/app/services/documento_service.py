import os
import time
from uuid import uuid4
from datetime import datetime

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.documento import Documento
from app.models.documento_version import DocumentoVersion
from app.repositories.documento_repository import DocumentoRepository
from app.repositories.proyecto_repository import ProyectoRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.documento import ChatRespuesta, ChatResultado
from app.services import rag_service
from app.services.auditoria_service import registrar_evento

EXTENSIONES_PERMITIDAS = {".docx"}


class DocumentoService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DocumentoRepository(db)
        self.proyectos = ProyectoRepository(db)
        self.usuarios = UsuarioRepository(db)

    def _nombre_actor(self, actor_id: int = None) -> str:
        if not actor_id:
            return "Alguien"
        usuario = self.usuarios.obtener_por_id(actor_id)
        return (usuario.nombre or "").strip() if usuario else "Alguien"

    def _obtener_proyecto_o_404(self, proyecto_id: int):
        proyecto = self.proyectos.obtener_por_id(proyecto_id)
        if not proyecto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proyecto con ID {proyecto_id} no encontrado",
            )
        return proyecto

    def _registrar_actividad(self, proyecto, iniciar: bool = False) -> None:
        """Actualiza la última actividad del proyecto y, si se indica, lo pasa
        de 'Por iniciar' a 'En proceso'."""
        proyecto.fecha_ultima_actividad = datetime.now()
        if iniciar and (proyecto.estado or "").strip().lower() == "por iniciar":
            proyecto.estado = "En proceso"
        self.db.commit()

    def listar_documentos(self, proyecto_id: int) -> list[Documento]:
        self._obtener_proyecto_o_404(proyecto_id)
        return self.repo.listar_por_proyecto(proyecto_id)

    def subir_documento(self, proyecto_id: int, archivo: UploadFile, actor_id: int = None) -> Documento:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)

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
            registrar_evento(
                self.db,
                actor_id=actor_id,
                modulo="proyectos",
                tipo="alerta",
                descripcion=f"Documento '{nombre}' no pudo ser procesado por IA en '{proyecto.nombre}'",
                referencia="DOC-ERR",
                proyecto_id=proyecto_id,
            )
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
            self.db.add(documento)
            self.db.flush()
            self.db.add(DocumentoVersion(
                documento_id=documento.id,
                numero="1",
                nombre=documento.nombre,
                ruta_archivo=documento.ruta_archivo,
                vigente=True,
            ))
            self.db.commit()
            self.db.refresh(documento)
        except Exception:
            self.db.rollback()
            rag_service.eliminar_documento_indexado(proyecto_id, ruta_archivo)
            os.remove(ruta_archivo)
            raise

        self._registrar_actividad(proyecto, iniciar=True)

        actor_nombre = self._nombre_actor(actor_id)
        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="proceso",
            descripcion=f"{actor_nombre} subió '{nombre}' a '{proyecto.nombre}' (OCR automático)",
            referencia=f"DOC-OCR-{documento.id}",
            proyecto_id=proyecto_id,
            actor_nombre_fallback="Sistema",
        )
        return documento

    def eliminar_documento(self, proyecto_id: int, id_documento: int, actor_id: int = None) -> dict:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)

        documento = self.repo.obtener_por_id(id_documento)
        if not documento or documento.proyecto_id != proyecto_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento con ID {id_documento} no encontrado en este proyecto",
            )

        nombre = documento.nombre
        rag_service.eliminar_documento_indexado(proyecto_id, documento.ruta_archivo)
        if os.path.exists(documento.ruta_archivo):
            os.remove(documento.ruta_archivo)

        self.repo.eliminar(documento)

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="eliminacion",
            descripcion=f"Se eliminó el documento '{nombre}' de '{proyecto.nombre}'",
            referencia=f"DOC-DEL-{id_documento}",
            proyecto_id=proyecto_id,
        )
        return {"ok": True, "detail": f"Documento {id_documento} eliminado correctamente"}

    def chat(self, proyecto_id: int, pregunta: str, k: int, actor_id: int = None) -> ChatRespuesta:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)

        inicio = time.perf_counter()
        resultados = rag_service.buscar(proyecto_id, pregunta, k)
        duracion_ms = int((time.perf_counter() - inicio) * 1000)

        self._registrar_actividad(proyecto)

        actor_nombre = self._nombre_actor(actor_id)
        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="consulta_ia",
            tipo="consulta_ia",
            descripcion=f"{actor_nombre} realizó una consulta de IA en '{proyecto.nombre}'",
            referencia=f"TX-{int(time.time()) % 100000}",
            proyecto_id=proyecto_id,
            duracion_ms=duracion_ms,
            actor_nombre_fallback="Sistema",
        )

        return ChatRespuesta(resultados=[ChatResultado(**r) for r in resultados])
