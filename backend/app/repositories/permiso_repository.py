from typing import List
from sqlalchemy.orm import Session, joinedload

from app.models.permiso_global import PermisoGlobal
from app.models.permiso_proyecto import PermisoProyecto
from app.models.usuario_proyecto import UsuarioProyecto
from app.schemas.permiso import MiembroPermisoActualizar, ModuloPermisoActualizar


class PermisoRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_globales_por_rol(self, rol: str) -> List[PermisoGlobal]:
        return self.db.query(PermisoGlobal).filter(PermisoGlobal.rol == rol).all()

    def guardar_global(self, rol: str, modulo: ModuloPermisoActualizar) -> PermisoGlobal:
        existente = (
            self.db.query(PermisoGlobal)
            .filter(PermisoGlobal.rol == rol, PermisoGlobal.modulo == modulo.clave)
            .first()
        )
        if not existente:
            existente = PermisoGlobal(rol=rol, modulo=modulo.clave)
            self.db.add(existente)

        existente.asignado = modulo.asignado
        existente.ver = modulo.ver
        existente.crear = modulo.crear
        existente.editar = modulo.editar
        existente.eliminar = modulo.eliminar
        existente.nota = modulo.nota

        self.db.commit()
        self.db.refresh(existente)
        return existente

    def listar_miembros_proyecto(self, proyecto_id: int) -> List[UsuarioProyecto]:
        return (
            self.db.query(UsuarioProyecto)
            .options(joinedload(UsuarioProyecto.usuario))
            .filter(UsuarioProyecto.proyecto_id == proyecto_id)
            .all()
        )

    def listar_permisos_proyecto(self, proyecto_id: int) -> List[PermisoProyecto]:
        return self.db.query(PermisoProyecto).filter(PermisoProyecto.proyecto_id == proyecto_id).all()

    def guardar_proyecto(self, proyecto_id: int, miembro: MiembroPermisoActualizar) -> PermisoProyecto:
        existente = (
            self.db.query(PermisoProyecto)
            .filter(
                PermisoProyecto.proyecto_id == proyecto_id,
                PermisoProyecto.usuario_id == miembro.usuario_id,
            )
            .first()
        )
        if not existente:
            existente = PermisoProyecto(usuario_id=miembro.usuario_id, proyecto_id=proyecto_id)
            self.db.add(existente)

        existente.ver = miembro.ver
        existente.subir_crear = miembro.subir_crear
        existente.editar_anotar = miembro.editar_anotar
        existente.descargar = miembro.descargar
        existente.consulta_ia = miembro.consulta_ia
        existente.nota = miembro.nota

        self.db.commit()
        self.db.refresh(existente)
        return existente
