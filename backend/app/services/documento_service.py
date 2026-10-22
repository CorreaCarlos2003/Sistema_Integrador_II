import os
import time
from uuid import uuid4
from datetime import datetime

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.documento import ESTADO_APROBADO, ESTADO_PENDIENTE, Documento
from app.models.documento_version import DocumentoVersion
from app.models.usuario_proyecto import UsuarioProyecto
from app.repositories.documento_repository import DocumentoRepository
from app.repositories.proyecto_repository import ProyectoRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.documento import ChatRespuesta, ChatResultado, DocumentoPendienteResponse
from app.services import rag_service
from app.services.auditoria_service import registrar_evento

EXTENSIONES_PERMITIDAS = {".docx", ".pdf", ".xlsx", ".pptx", ".txt", ".md"}
TAMANO_MAXIMO_BYTES = 30 * 1024 * 1024  # 30 MB
ROLES_QUE_PUEDEN_ELIMINAR_DOCUMENTOS = {"Administrador", "Jefe de Proyecto"}
ROL_REQUIERE_APROBACION = "Colaborador"


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

    def _verificar_puede_eliminar_documentos(self, actor_id: int = None) -> None:
        actor = self.usuarios.obtener_por_id(actor_id) if actor_id else None
        rol = (actor.rol or "").strip() if actor else ""
        if rol not in ROLES_QUE_PUEDEN_ELIMINAR_DOCUMENTOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el Administrador o el Jefe de Proyecto pueden eliminar documentos.",
            )

    def _rol_actor(self, actor_id: int = None) -> str:
        actor = self.usuarios.obtener_por_id(actor_id) if actor_id else None
        return (actor.rol or "").strip() if actor else ""

    def _es_responsable_proyecto(self, proyecto_id: int, actor_id: int) -> bool:
        return (
            self.db.query(UsuarioProyecto)
            .filter(
                UsuarioProyecto.proyecto_id == proyecto_id,
                UsuarioProyecto.usuario_id == actor_id,
                UsuarioProyecto.rol_proyecto == "RESPONSABLE",
            )
            .first()
            is not None
        )

    def _verificar_puede_aprobar(self, proyecto_id: int, actor_id: int = None) -> None:
        rol = self._rol_actor(actor_id)
        puede = rol == "Administrador" or (
            rol == "Jefe de Proyecto" and actor_id is not None
            and self._es_responsable_proyecto(proyecto_id, actor_id)
        )
        if not puede:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el Administrador o el Jefe de Proyecto responsable pueden aprobar documentos.",
            )

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
                detail="Solo se admiten documentos Word (.docx), PDF, Excel (.xlsx), "
                "PowerPoint (.pptx), Bloc de notas (.txt) o Markdown (.md).",
            )

        contenido_archivo = archivo.file.read()
        if len(contenido_archivo) > TAMANO_MAXIMO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="El archivo supera el límite de 30MB permitido.",
            )

        # Un Colaborador necesita que el Jefe de Proyecto (o el Administrador)
        # apruebe el documento antes de que se procese e indexe para la IA.
        requiere_aprobacion = self._rol_actor(actor_id) == ROL_REQUIERE_APROBACION

        directorio = rag_service.ruta_documentos(proyecto_id)
        ruta_archivo = os.path.join(directorio, f"{uuid4().hex}_{nombre}")

        with open(ruta_archivo, "wb") as destino:
            destino.write(contenido_archivo)

        chunks = 0
        if not requiere_aprobacion:
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
            estado_aprobacion=ESTADO_PENDIENTE if requiere_aprobacion else ESTADO_APROBADO,
            subido_por=actor_id,
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
            if not requiere_aprobacion:
                rag_service.eliminar_documento_indexado(proyecto_id, ruta_archivo)
            os.remove(ruta_archivo)
            raise

        actor_nombre = self._nombre_actor(actor_id)

        if requiere_aprobacion:
            self._registrar_actividad(proyecto)
            registrar_evento(
                self.db,
                actor_id=actor_id,
                modulo="proyectos",
                tipo="pendiente",
                descripcion=f"{actor_nombre} subió '{nombre}' a '{proyecto.nombre}' (pendiente de aprobación)",
                referencia=f"DOC-PEND-{documento.id}",
                proyecto_id=proyecto_id,
                actor_nombre_fallback="Sistema",
            )
        else:
            self._registrar_actividad(proyecto, iniciar=True)
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

    def listar_pendientes(self, proyecto_id: int, actor_id: int = None) -> list[DocumentoPendienteResponse]:
        self._obtener_proyecto_o_404(proyecto_id)
        self._verificar_puede_aprobar(proyecto_id, actor_id)

        pendientes = (
            self.db.query(Documento)
            .filter(Documento.proyecto_id == proyecto_id, Documento.estado_aprobacion == ESTADO_PENDIENTE)
            .order_by(Documento.fecha_subida.asc())
            .all()
        )
        resultado = []
        for doc in pendientes:
            autor = self.usuarios.obtener_por_id(doc.subido_por) if doc.subido_por else None
            resultado.append(
                DocumentoPendienteResponse(
                    id=doc.id,
                    proyecto_id=doc.proyecto_id,
                    nombre=doc.nombre,
                    fecha_subida=doc.fecha_subida,
                    subido_por=doc.subido_por,
                    subido_por_nombre=(autor.nombre or "").strip() if autor else "Usuario eliminado",
                )
            )
        return resultado

    def _obtener_pendiente_o_404(self, proyecto_id: int, id_documento: int) -> Documento:
        documento = self.repo.obtener_por_id(id_documento)
        if (
            not documento
            or documento.proyecto_id != proyecto_id
            or documento.estado_aprobacion != ESTADO_PENDIENTE
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento pendiente con ID {id_documento} no encontrado en este proyecto",
            )
        return documento

    def aprobar_documento(self, proyecto_id: int, id_documento: int, actor_id: int = None) -> Documento:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)
        self._verificar_puede_aprobar(proyecto_id, actor_id)
        documento = self._obtener_pendiente_o_404(proyecto_id, id_documento)

        try:
            chunks = rag_service.indexar_documento(proyecto_id, documento.ruta_archivo, documento.nombre)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"No se pudo procesar el documento: {exc}",
            ) from exc

        documento.chunks_indexados = chunks
        documento.estado_aprobacion = ESTADO_APROBADO
        self.db.commit()
        self.db.refresh(documento)

        self._registrar_actividad(proyecto, iniciar=True)

        actor_nombre = self._nombre_actor(actor_id)
        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="proceso",
            descripcion=f"{actor_nombre} aprobó el documento '{documento.nombre}' en '{proyecto.nombre}'",
            referencia=f"DOC-OK-{documento.id}",
            proyecto_id=proyecto_id,
            actor_nombre_fallback="Sistema",
        )
        return documento

    def rechazar_documento(self, proyecto_id: int, id_documento: int, actor_id: int = None) -> dict:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)
        self._verificar_puede_aprobar(proyecto_id, actor_id)
        documento = self._obtener_pendiente_o_404(proyecto_id, id_documento)

        nombre = documento.nombre
        if os.path.exists(documento.ruta_archivo):
            os.remove(documento.ruta_archivo)
        self.repo.eliminar(documento)

        actor_nombre = self._nombre_actor(actor_id)
        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="eliminacion",
            descripcion=f"{actor_nombre} rechazó el documento '{nombre}' en '{proyecto.nombre}'",
            referencia=f"DOC-RECH-{id_documento}",
            proyecto_id=proyecto_id,
            actor_nombre_fallback="Sistema",
        )
        return {"ok": True, "detail": f"Documento {id_documento} rechazado correctamente"}

    def eliminar_documento(self, proyecto_id: int, id_documento: int, actor_id: int = None) -> dict:
        proyecto = self._obtener_proyecto_o_404(proyecto_id)
        self._verificar_puede_eliminar_documentos(actor_id)

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
