from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.models.usuario_proyecto import UsuarioProyecto

ORDENES_PROYECTO = {
    "recientes": (Proyecto.fecha_creacion.desc(), Proyecto.id.desc()),
    "antiguos": (Proyecto.fecha_creacion.asc(), Proyecto.id.asc()),
    "az": (func.lower(Proyecto.nombre).asc(), Proyecto.id.asc()),
    "za": (func.lower(Proyecto.nombre).desc(), Proyecto.id.desc()),
}


class ProyectoRepository:
    def __init__(self, db: Session):
        self.db = db

    def obtener_por_id(self, id_proyecto: int) -> Optional[Proyecto]:
        return self.db.query(Proyecto).filter(Proyecto.id == id_proyecto).first()

    def listar(self) -> List[Proyecto]:
        return self.db.query(Proyecto).order_by(Proyecto.id.desc()).all()

    def guardar(self, proyecto: Proyecto) -> Proyecto:
        self.db.add(proyecto)
        self.db.commit()
        self.db.refresh(proyecto)
        return proyecto

    def eliminar(self, proyecto: Proyecto) -> None:
        self.db.delete(proyecto)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def listar_cards(
            self,
            busqueda: Optional[str] = None,
            estado: Optional[str] = None,
            responsable_id: Optional[int] = None,
            orden: str = "recientes",
            skip: int = 0,
            limit: int = 6,
    ) -> Tuple[List[Proyecto], int]:
        query = self.db.query(Proyecto).options(joinedload(Proyecto.usuarios), joinedload(Proyecto.detalle))

        # Filtro por estado
        if estado and estado.lower() != "todos":
            query = query.filter(Proyecto.estado.ilike(estado))

        # Búsqueda por nombre o descripción
        if busqueda:
            termino = f"%{busqueda.strip()}%"
            query = query.filter(
                (Proyecto.nombre.ilike(termino)) | (Proyecto.descripcion.ilike(termino))
            )

        # Filtro por responsable del proyecto
        if responsable_id:
            query = query.filter(
                Proyecto.usuarios.any(
                    (UsuarioProyecto.usuario_id == responsable_id)
                    & (UsuarioProyecto.rol_proyecto == "RESPONSABLE")
                )
            )

        total = query.distinct().count()

        proyectos = (
            query.order_by(*ORDENES_PROYECTO.get(orden, ORDENES_PROYECTO["recientes"]))
            .offset(skip)
            .limit(limit)
            .all()
        )

        return proyectos, total

    def listar_responsables(self) -> List[Usuario]:
        return (
            self.db.query(Usuario)
            .join(UsuarioProyecto, UsuarioProyecto.usuario_id == Usuario.id)
            .filter(UsuarioProyecto.rol_proyecto == "RESPONSABLE")
            .distinct()
            .order_by(Usuario.nombre)
            .all()
        )
