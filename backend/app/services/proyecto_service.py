import logging
from datetime import datetime
from math import ceil
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.models.usuario_proyecto import UsuarioProyecto
from app.repositories.proyecto_repository import ProyectoRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.proyecto import ProyectoCrear, ProyectoEditar, ProyectoEstado, PaginatedProyectosResponse, \
    UsuarioResumen, ProyectoCardResponse, MiembroInvitar, InvitacionProyectoResponse, ResponsableOpcion
from app.services import rag_service
from app.services.auditoria_service import registrar_evento
from app.services.mail_service import enviar_invitacion_proyecto

logger = logging.getLogger(__name__)

ROLES_PROYECTO_VALIDOS = {"RESPONSABLE", "MIEMBRO"}
ROL_ADMINISTRADOR = "Administrador"


class ProyectoService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProyectoRepository(db)

    def listar_proyectos(self) -> List[Proyecto]:
        return self.repo.listar()

    def obtener_por_id(self, id_proyecto: int) -> Proyecto:
        proyecto = self.repo.obtener_por_id(id_proyecto)
        if not proyecto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proyecto con ID {id_proyecto} no encontrado",
            )
        return proyecto

    def crear_proyecto(self, datos: ProyectoCrear, actor_id: int = None) -> Proyecto:
        # Validar si el responsable existe
        usuario_repo = UsuarioRepository(self.db)
        responsable = usuario_repo.obtener_por_id(datos.responsable_id)
        if not responsable:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario responsable con ID {datos.responsable_id} no encontrado",
            )

        nuevo = Proyecto(
            nombre=datos.nombre.strip(),
            descripcion=datos.descripcion.strip() if datos.descripcion else None,
            estado="Por iniciar",  # Todo proyecto nuevo inicia en este estado
        )
        
        relacion_responsable = UsuarioProyecto(
            usuario_id=datos.responsable_id,
            rol_proyecto="RESPONSABLE",
            cargo=datos.cargo_responsable
        )
        nuevo.usuarios.append(relacion_responsable)
        
        detalle = ProyectoDetalle(
            fecha_inicio=datetime.now(),
            fecha_fin=datos.fecha_fin
        )
        nuevo.detalle = detalle

        nuevo = self.repo.guardar(nuevo)

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="creacion",
            descripcion=f"Nuevo proyecto '{nuevo.nombre}' (#PRJ-{str(nuevo.id).zfill(3)}) creado",
            referencia=f"PRJ-CRT-{nuevo.id}",
            proyecto_id=nuevo.id,
        )
        return nuevo

    def editar_proyecto(self, id_proyecto: int, datos: ProyectoEditar, actor_id: int = None) -> Proyecto:
        proyecto = self.obtener_por_id(id_proyecto)

        if datos.nombre is not None:
            proyecto.nombre = datos.nombre.strip()
        if datos.descripcion is not None:
            proyecto.descripcion = datos.descripcion.strip()
        if datos.estado is not None:
            estado_anterior = proyecto.estado.lower() if proyecto.estado else ""
            nuevo_estado = datos.estado.strip()
            proyecto.estado = nuevo_estado

            if nuevo_estado.lower() == "finalizado" and estado_anterior != "finalizado":
                if proyecto.detalle:
                    proyecto.detalle.fecha_real_fin = datetime.now()
        if datos.fecha_fin is not None and proyecto.detalle:
            proyecto.detalle.fecha_fin = datos.fecha_fin

        proyecto = self.repo.guardar(proyecto)

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="edicion",
            descripcion=f"Se editó el proyecto '{proyecto.nombre}'",
            referencia=f"PRJ-UPD-{proyecto.id}",
            proyecto_id=proyecto.id,
        )
        return proyecto

    def cambiar_estado(self, id_proyecto: int, datos: ProyectoEstado, actor_id: int = None) -> Proyecto:
        proyecto = self.obtener_por_id(id_proyecto)

        estado_anterior = proyecto.estado.lower() if proyecto.estado else ""
        nuevo_estado = datos.estado.strip()
        proyecto.estado = nuevo_estado

        if nuevo_estado.lower() == "finalizado" and estado_anterior != "finalizado":
            if proyecto.detalle:
                proyecto.detalle.fecha_real_fin = datetime.now()

        proyecto = self.repo.guardar(proyecto)

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="edicion",
            descripcion=f"El proyecto '{proyecto.nombre}' cambió de estado a {nuevo_estado}",
            referencia=f"PRJ-EST-{proyecto.id}",
            proyecto_id=proyecto.id,
        )
        return proyecto

    def invitar_miembro(self, id_proyecto: int, datos: MiembroInvitar, actor_id: int = None):
        proyecto = self.obtener_por_id(id_proyecto)

        usuario_repo = UsuarioRepository(self.db)
        usuario = usuario_repo.obtener_por_id(datos.usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario con ID {datos.usuario_id} no encontrado",
            )

        rol_proyecto = (datos.rol_proyecto or "MIEMBRO").strip().upper()
        if rol_proyecto not in ROLES_PROYECTO_VALIDOS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="rol_proyecto debe ser RESPONSABLE o MIEMBRO",
            )

        ya_es_miembro = any(up.usuario_id == usuario.id for up in proyecto.usuarios)
        if ya_es_miembro:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El usuario ya forma parte de este proyecto.",
            )

        relacion = UsuarioProyecto(
            usuario_id=usuario.id,
            proyecto_id=proyecto.id,
            rol_proyecto=rol_proyecto,
            cargo=datos.cargo.strip() if datos.cargo else None,
            estado_invitacion="PENDIENTE",
        )
        self.db.add(relacion)
        self.db.commit()
        self.db.refresh(relacion)

        invitacion_enviada = True
        try:
            enviar_invitacion_proyecto(
                nombre=usuario.nombre,
                correo=usuario.correo,
                proyecto_nombre=proyecto.nombre,
                rol_proyecto=rol_proyecto,
                cargo=relacion.cargo,
            )
        except Exception:
            invitacion_enviada = False
            logger.exception(
                "No se pudo enviar el correo de invitación a proyecto a %s", usuario.correo
            )

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="creacion",
            descripcion=f"Se invitó a {usuario.nombre} al proyecto '{proyecto.nombre}' como {rol_proyecto.title()}",
            referencia=f"PRJ-INV-{proyecto.id}-{usuario.id}",
            proyecto_id=proyecto.id,
        )

        return usuario, relacion, invitacion_enviada

    def quitar_miembro(self, id_proyecto: int, usuario_id: int, actor_id: int = None) -> dict:
        proyecto = self.obtener_por_id(id_proyecto)

        relacion = (
            self.db.query(UsuarioProyecto)
            .filter(
                UsuarioProyecto.proyecto_id == id_proyecto,
                UsuarioProyecto.usuario_id == usuario_id,
            )
            .first()
        )
        if not relacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El usuario no forma parte de este proyecto.",
            )

        nombre_usuario = relacion.usuario.nombre if relacion.usuario else f"usuario {usuario_id}"
        self.db.delete(relacion)
        self.db.commit()

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="eliminacion",
            descripcion=f"Se quitó a {nombre_usuario} del proyecto '{proyecto.nombre}'",
            referencia=f"PRJ-DEL-{id_proyecto}-{usuario_id}",
            proyecto_id=id_proyecto,
        )
        return {"ok": True, "detail": "Usuario quitado del proyecto correctamente"}

    def cambiar_estado_miembro(self, id_proyecto: int, usuario_id: int, activo: bool, actor_id: int = None) -> dict:
        proyecto = self.obtener_por_id(id_proyecto)

        relacion = (
            self.db.query(UsuarioProyecto)
            .filter(
                UsuarioProyecto.proyecto_id == id_proyecto,
                UsuarioProyecto.usuario_id == usuario_id,
            )
            .first()
        )
        if not relacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El usuario no forma parte de este proyecto.",
            )
        if relacion.estado_invitacion == "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se puede cambiar el estado de una invitación pendiente.",
            )

        relacion.activo = activo
        self.db.commit()

        nombre_usuario = relacion.usuario.nombre if relacion.usuario else f"usuario {usuario_id}"
        detalle = "Usuario habilitado en el proyecto" if activo else "Usuario inhabilitado en el proyecto"
        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="edicion" if activo else "alerta",
            descripcion=f"{nombre_usuario} fue {'habilitado' if activo else 'inhabilitado'} en el proyecto '{proyecto.nombre}'",
            referencia=f"PRJ-MBR-{id_proyecto}-{usuario_id}",
            proyecto_id=id_proyecto,
        )
        return {"ok": True, "detail": detalle}

    def listar_invitaciones_pendientes(self, usuario_id: int) -> List[InvitacionProyectoResponse]:
        relaciones = (
            self.db.query(UsuarioProyecto)
            .filter(
                UsuarioProyecto.usuario_id == usuario_id,
                UsuarioProyecto.estado_invitacion == "PENDIENTE",
            )
            .all()
        )
        return [
            InvitacionProyectoResponse(
                proyecto_id=r.proyecto_id,
                proyecto_nombre=r.proyecto.nombre if r.proyecto else "",
                rol_proyecto=r.rol_proyecto,
                cargo=r.cargo,
                fecha_ingreso=r.fecha_ingreso,
            )
            for r in relaciones
        ]

    def responder_invitacion(self, id_proyecto: int, usuario_id: int, aceptar: bool) -> dict:
        relacion = (
            self.db.query(UsuarioProyecto)
            .filter(
                UsuarioProyecto.proyecto_id == id_proyecto,
                UsuarioProyecto.usuario_id == usuario_id,
                UsuarioProyecto.estado_invitacion == "PENDIENTE",
            )
            .first()
        )
        if not relacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró una invitación pendiente para este usuario en este proyecto.",
            )

        if aceptar:
            relacion.estado_invitacion = "ACEPTADA"
            relacion.fecha_ingreso = datetime.now()
            self.db.commit()
            return {"ok": True, "detail": "Invitación aceptada correctamente"}

        self.db.delete(relacion)
        self.db.commit()
        return {"ok": True, "detail": "Invitación cancelada correctamente"}

    def _validar_administrador(self, actor_id: int, accion: str) -> None:
        actor = UsuarioRepository(self.db).obtener_por_id(actor_id) if actor_id else None
        if not actor or (actor.rol or "").strip() != ROL_ADMINISTRADOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Solo el Administrador del sistema puede {accion} proyectos.",
            )

    def archivar_proyecto(self, id_proyecto: int, archivado: bool, actor_id: int = None) -> Proyecto:
        self._validar_administrador(actor_id, "archivar")

        proyecto = self.obtener_por_id(id_proyecto)
        proyecto.archivado = archivado
        proyecto = self.repo.guardar(proyecto)

        accion = "archivó" if archivado else "reactivó"
        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="alerta" if archivado else "edicion",
            descripcion=f"Se {accion} el proyecto '{proyecto.nombre}'",
            referencia=f"PRJ-ARC-{proyecto.id}",
            proyecto_id=proyecto.id,
        )
        return proyecto

    def eliminar_proyecto(self, id_proyecto: int, actor_id: int = None) -> dict:
        self._validar_administrador(actor_id, "eliminar")

        proyecto = self.obtener_por_id(id_proyecto)
        nombre = proyecto.nombre
        self.repo.eliminar(proyecto)

        try:
            rag_service.eliminar_proyecto_indexado(id_proyecto)
        except OSError:
            logger.exception("No se pudieron borrar los archivos del proyecto %s", id_proyecto)

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="proyectos",
            tipo="eliminacion",
            descripcion=f"Se eliminó el proyecto '{nombre}'",
            referencia=f"PRJ-RM-{id_proyecto}",
        )
        return {"ok": True, "detail": f"Proyecto {id_proyecto} eliminado correctamente"}

    def listar_responsables(self) -> List[ResponsableOpcion]:
        return [
            ResponsableOpcion(id=u.id, nombre=(u.nombre or "").strip())
            for u in self.repo.listar_responsables()
        ]

    def listar_cards_proyectos(
            self,
            busqueda: Optional[str] = None,
            estado: Optional[str] = None,
            responsable_id: Optional[int] = None,
            orden: str = "recientes",
            page: int = 1,
            limit: int = 6,
    ) -> PaginatedProyectosResponse:
        skip = (page - 1) * limit
        proyectos_db, total = self.repo.listar_cards(
            busqueda=busqueda, estado=estado, responsable_id=responsable_id,
            orden=orden, skip=skip, limit=limit,
        )

        items = []
        for p in proyectos_db:
            # Miembros asignados al proyecto
            miembros = []
            responsables = []
            
            for up in p.usuarios:
                if not up.usuario:
                    continue
                usuario_resumen = UsuarioResumen(
                    id=up.usuario.id,
                    nombre=(up.usuario.nombre or "").strip(),
                    correo=up.usuario.correo,
                    rol=(up.usuario.rol or "").strip(),
                    rol_proyecto=up.rol_proyecto,
                    cargo=up.cargo,
                    fecha_ingreso=up.fecha_ingreso,
                    estado_invitacion=up.estado_invitacion,
                    activo=up.activo,
                )
                miembros.append(usuario_resumen)
                
                if up.rol_proyecto == "RESPONSABLE":
                    responsables.append(usuario_resumen)

            # Código con padding PRJ-001, PRJ-002...
            codigo = f"PRJ-{str(p.id).zfill(3)}"

            items.append(
                ProyectoCardResponse(
                    id=p.id,
                    codigo=codigo,
                    nombre=p.nombre,
                    descripcion=p.descripcion,
                    estado=p.estado,
                    archivado=p.archivado,
                    fecha_creacion=p.fecha_creacion,
                    fecha_ultima_actividad=p.fecha_ultima_actividad,
                    fecha_fin=p.fecha_fin,
                    responsable=responsables[0] if responsables else None,
                    responsables=responsables,
                    miembros=miembros,
                    total_documentos=len(p.documentos),
                )
            )

        total_pages = ceil(total / limit) if total > 0 else 1

        return PaginatedProyectosResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )