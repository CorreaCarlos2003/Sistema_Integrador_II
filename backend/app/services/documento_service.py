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
from app.schemas.documento import ChatRespuesta, ChatResultado, DocumentoVersionResponse
from app.services import rag_service
from app.services.auditoria_service import registrar_evento

EXTENSIONES_PERMITIDAS = {".docx"}


def siguiente_numero_version(numeros_existentes: list[str]) -> str:
    numeros = [int(numero) for numero in numeros_existentes if numero.isdigit()]
    return str(max(numeros, default=0) + 1)


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

    @staticmethod
    def _validar_nombre_archivo(archivo: UploadFile) -> str:
        nombre = os.path.basename((archivo.filename or "").replace("\\", "/"))
        extension = os.path.splitext(nombre)[1].lower()
        if extension not in EXTENSIONES_PERMITIDAS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se admiten archivos .docx por el momento",
            )
        return nombre

    @staticmethod
    def _adjuntar_version(documento: Documento, version: DocumentoVersion | None) -> Documento:
        documento.version_id = version.id if version else None
        documento.numero_version = version.numero if version else None
        return documento

    @staticmethod
    def _eliminar_archivo(ruta_archivo: str) -> None:
        if os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)

    def _limpiar_carga(self, proyecto_id: int, ruta_archivo: str, limpiar_indice: bool) -> None:
        if limpiar_indice:
            try:
                rag_service.eliminar_documento_indexado(proyecto_id, ruta_archivo)
            except Exception:
                # La limpieza del archivo local no debe omitirse si Chroma no está disponible.
                pass
        self._eliminar_archivo(ruta_archivo)

    def listar_documentos(self, proyecto_id: int) -> list[Documento]:
        self._obtener_proyecto_o_404(proyecto_id)
        documentos = self.repo.listar_por_proyecto(proyecto_id)
        if not documentos:
            return []
        versiones = (
            self.db.query(DocumentoVersion)
            .filter(
                DocumentoVersion.documento_id.in_([documento.id for documento in documentos]),
                DocumentoVersion.vigente.is_(True),
            )
            .all()
        )
        vigentes = {version.documento_id: version for version in versiones}
        return [self._adjuntar_version(documento, vigentes.get(documento.id)) for documento in documentos]

    def subir_documento(self, proyecto_id: int, archivo: UploadFile, actor_id: int = None) -> Documento:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)
        nombre = self._validar_nombre_archivo(archivo)

        directorio = rag_service.ruta_documentos(proyecto_id)
        ruta_archivo = os.path.join(directorio, f"{uuid4().hex}_{nombre}")

        with open(ruta_archivo, "wb") as destino:
            destino.write(archivo.file.read())

        documento = Documento(
            proyecto_id=proyecto_id,
            nombre=nombre,
            ruta_archivo=ruta_archivo,
            chunks_indexados=0,
        )
        version = DocumentoVersion(
            documento_id=0,
            numero="1",
            nombre=nombre,
            ruta_archivo=ruta_archivo,
            chunks_indexados=0,
            vigente=False,
        )
        indexacion_iniciada = False
        try:
            self.db.add(documento)
            self.db.flush()
            version.documento_id = documento.id
            self.db.add(version)
            self.db.flush()
            indexacion_iniciada = True
            chunks = rag_service.indexar_documento(
                proyecto_id,
                ruta_archivo,
                nombre,
                documento_id=documento.id,
                version_id=version.id,
                numero_version=version.numero,
            )
            documento.chunks_indexados = chunks
            version.chunks_indexados = chunks
            version.vigente = True
            self.db.commit()
            self.db.refresh(documento)
            self.db.refresh(version)
        except Exception as exc:
            self.db.rollback()
            self._limpiar_carga(proyecto_id, ruta_archivo, indexacion_iniciada)
            try:
                registrar_evento(
                    self.db,
                    actor_id=actor_id,
                    modulo="proyectos",
                    tipo="alerta",
                    descripcion=f"Documento '{nombre}' no pudo ser procesado por IA en '{proyecto.nombre}'",
                    referencia="DOC-ERR",
                    proyecto_id=proyecto_id,
                )
            except Exception:
                self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"No se pudo procesar el documento: {exc}",
            ) from exc

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
        return self._adjuntar_version(documento, version)

    def listar_versiones_documento(
        self, proyecto_id: int, documento_id: int,
    ) -> list[DocumentoVersionResponse]:
        self._obtener_proyecto_o_404(proyecto_id)
        documento = self.repo.obtener_por_id(documento_id)
        if documento is None or documento.proyecto_id != proyecto_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento con ID {documento_id} no encontrado en este proyecto",
            )
        return (
            self.db.query(DocumentoVersion)
            .filter(DocumentoVersion.documento_id == documento_id)
            .order_by(DocumentoVersion.id.desc())
            .all()
        )

    def subir_version(
        self, proyecto_id: int, documento_id: int, archivo: UploadFile, actor_id: int = None,
    ) -> DocumentoVersion:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)
        nombre = self._validar_nombre_archivo(archivo)
        documento = (
            self.db.query(Documento)
            .filter(Documento.id == documento_id, Documento.proyecto_id == proyecto_id)
            .with_for_update()
            .first()
        )
        if documento is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento con ID {documento_id} no encontrado en este proyecto",
            )

        versiones = (
            self.db.query(DocumentoVersion)
            .filter(DocumentoVersion.documento_id == documento_id)
            .order_by(DocumentoVersion.id)
            .all()
        )
        siguiente_numero = siguiente_numero_version([version.numero for version in versiones])
        ruta_archivo = os.path.join(
            rag_service.ruta_documentos(proyecto_id),
            f"{uuid4().hex}_{nombre}",
        )
        with open(ruta_archivo, "wb") as destino:
            destino.write(archivo.file.read())

        version = DocumentoVersion(
            documento_id=documento_id,
            numero=siguiente_numero,
            nombre=nombre,
            ruta_archivo=ruta_archivo,
            chunks_indexados=0,
            vigente=False,
        )
        indexacion_iniciada = False
        try:
            self.db.add(version)
            self.db.flush()
            indexacion_iniciada = True
            chunks = rag_service.indexar_documento(
                proyecto_id,
                ruta_archivo,
                nombre,
                documento_id=documento_id,
                version_id=version.id,
                numero_version=version.numero,
            )
            version.chunks_indexados = chunks
            for anterior in versiones:
                anterior.vigente = False
            self.db.flush()
            version.vigente = True
            documento.nombre = nombre
            documento.ruta_archivo = ruta_archivo
            documento.chunks_indexados = chunks
            documento.fecha_subida = datetime.now()
            self.db.commit()
            self.db.refresh(version)
        except Exception as exc:
            self.db.rollback()
            self._limpiar_carga(proyecto_id, ruta_archivo, indexacion_iniciada)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"No se pudo procesar la nueva versión: {exc}",
            ) from exc

        self._registrar_actividad(proyecto, iniciar=True)
        actor_nombre = self._nombre_actor(actor_id)
        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="proceso",
            descripcion=(
                f"{actor_nombre} subió la versión {version.numero} de '{nombre}' "
                f"en '{proyecto.nombre}'"
            ),
            referencia=f"DOC-VER-{version.id}",
            proyecto_id=proyecto_id,
            actor_nombre_fallback="Sistema",
        )
        return version

    def eliminar_documento(self, proyecto_id: int, id_documento: int, actor_id: int = None) -> dict:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)

        documento = self.repo.obtener_por_id(id_documento)
        if not documento or documento.proyecto_id != proyecto_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento con ID {id_documento} no encontrado en este proyecto",
            )

        nombre = documento.nombre
        versiones = (
            self.db.query(DocumentoVersion)
            .filter(DocumentoVersion.documento_id == documento.id)
            .all()
        )
        rutas = {documento.ruta_archivo, *(version.ruta_archivo for version in versiones)}
        for ruta in rutas:
            rag_service.eliminar_documento_indexado(proyecto_id, ruta)
            self._eliminar_archivo(ruta)

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
