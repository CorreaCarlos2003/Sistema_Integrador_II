from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.permiso_repository import PermisoRepository
from app.services.auditoria_service import registrar_evento
from app.schemas.permiso import (
    MiembroPermiso,
    PermisosGlobalesActualizar,
    PermisosGlobalesResponse,
    PermisosProyectoActualizar,
    PermisosProyectoResponse,
    ModuloPermiso,
)

ROL_ADMINISTRADOR = "Administrador"
ROLES_GLOBALES_EDITABLES = {"Jefe de Proyecto", "Colaborador"}

MODULOS = [
    {"clave": "inicio", "nombre": "Inicio", "descripcion": "Panel principal y telemetría"},
    {"clave": "proyectos", "nombre": "Proyectos", "descripcion": "Expedientes y carpetas documentales"},
    {"clave": "usuarios", "nombre": "Gestión de Usuarios", "descripcion": "Directorio institucional"},
    {"clave": "roles", "nombre": "Roles y Permisos", "descripcion": "Gobernanza RBAC del sistema"},
    {"clave": "historial", "nombre": "Historial", "descripcion": "Pistas de auditoría y eventos"},
    {"clave": "reportes", "nombre": "Reportes", "descripcion": "Métricas avanzadas y exportación de datos"},
]


class PermisoService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PermisoRepository(db)

    def obtener_globales(self, rol: str) -> PermisosGlobalesResponse:
        if rol == ROL_ADMINISTRADOR:
            return PermisosGlobalesResponse(
                rol=ROL_ADMINISTRADOR,
                bloqueado=True,
                modulos=[
                    ModuloPermiso(
                        clave=m["clave"],
                        nombre=m["nombre"],
                        descripcion=m["descripcion"],
                        asignado=True,
                        ver=True,
                        crear=True,
                        editar=True,
                        eliminar=True,
                        nota="Acceso total",
                    )
                    for m in MODULOS
                ],
            )

        if rol not in ROLES_GLOBALES_EDITABLES:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rol '{rol}' no reconocido")

        existentes = {p.modulo: p for p in self.repo.listar_globales_por_rol(rol)}
        modulos: List[ModuloPermiso] = []
        for m in MODULOS:
            p = existentes.get(m["clave"])
            modulos.append(
                ModuloPermiso(
                    clave=m["clave"],
                    nombre=m["nombre"],
                    descripcion=m["descripcion"],
                    asignado=p.asignado if p else False,
                    ver=p.ver if p else False,
                    crear=p.crear if p else False,
                    editar=p.editar if p else False,
                    eliminar=p.eliminar if p else False,
                    nota=p.nota if p else "Módulo no asignado a este rol",
                )
            )

        return PermisosGlobalesResponse(rol=rol, bloqueado=False, modulos=modulos)

    def actualizar_globales(self, rol: str, datos: PermisosGlobalesActualizar, actor_id: int = None) -> PermisosGlobalesResponse:
        if rol == ROL_ADMINISTRADOR:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El rol Administrador tiene acceso total y no se puede editar.",
            )
        if rol not in ROLES_GLOBALES_EDITABLES:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rol '{rol}' no reconocido")

        claves_validas = {m["clave"] for m in MODULOS}
        for modulo in datos.modulos:
            if modulo.clave not in claves_validas:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Módulo '{modulo.clave}' no reconocido",
                )
            self.repo.guardar_global(rol, modulo)

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="roles",
            tipo="alerta",
            descripcion=f"Se modificó la matriz de permisos globales del rol {rol}",
            referencia=f"RBAC-MOD-{rol.replace(' ', '')[:12]}",
        )

        return self.obtener_globales(rol)

    def obtener_por_proyecto(self, proyecto_id: int) -> PermisosProyectoResponse:
        relaciones = self.repo.listar_miembros_proyecto(proyecto_id)
        existentes = {p.usuario_id: p for p in self.repo.listar_permisos_proyecto(proyecto_id)}

        miembros: List[MiembroPermiso] = []
        for rel in relaciones:
            if rel.estado_invitacion == "PENDIENTE" or not rel.usuario:
                continue
            p = existentes.get(rel.usuario_id)
            es_responsable = rel.rol_proyecto == "RESPONSABLE"
            miembros.append(
                MiembroPermiso(
                    usuario_id=rel.usuario_id,
                    nombre=(rel.usuario.nombre or "").strip(),
                    correo=rel.usuario.correo,
                    rol_proyecto=rel.rol_proyecto,
                    cargo=rel.cargo,
                    ver=p.ver if p else True,
                    subir_crear=p.subir_crear if p else es_responsable,
                    editar_anotar=p.editar_anotar if p else es_responsable,
                    descargar=p.descargar if p else True,
                    consulta_ia=p.consulta_ia if p else True,
                    nota=p.nota if p else None,
                )
            )

        return PermisosProyectoResponse(proyecto_id=proyecto_id, miembros=miembros)

    def actualizar_por_proyecto(self, proyecto_id: int, datos: PermisosProyectoActualizar, actor_id: int = None) -> PermisosProyectoResponse:
        ids_validos = {m.usuario_id for m in self.repo.listar_miembros_proyecto(proyecto_id)}
        for miembro in datos.miembros:
            if miembro.usuario_id not in ids_validos:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"El usuario {miembro.usuario_id} no pertenece a este proyecto.",
                )
            self.repo.guardar_proyecto(proyecto_id, miembro)

        registrar_evento(
            self.db,
            actor_id=actor_id,
            modulo="roles",
            tipo="alerta",
            descripcion=f"Se modificaron los permisos locales de {len(datos.miembros)} miembro(s) en un proyecto",
            referencia=f"RBAC-PRJ-{proyecto_id}",
            proyecto_id=proyecto_id,
        )

        return self.obtener_por_proyecto(proyecto_id)
