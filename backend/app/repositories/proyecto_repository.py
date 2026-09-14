from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from app.models.proyecto import Proyecto


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
        self.db.commit()

    def listar_cards(
            self,
            busqueda: Optional[str] = None,
            estado: Optional[str] = None,
            skip: int = 0,
            limit: int = 6,
    ) -> Tuple[List[Proyecto], int]:
        query = self.db.query(Proyecto).options(joinedload(Proyecto.usuarios))

        # Filtro por estado
        if estado and estado.lower() != "todos":
            query = query.filter(Proyecto.estado.ilike(estado))

        # Búsqueda por nombre o descripción
        if busqueda:
            termino = f"%{busqueda.strip()}%"
            query = query.filter(
                (Proyecto.nombre.ilike(termino)) | (Proyecto.descripción.ilike(termino))
            )

        total = query.distinct().count()

        proyectos = (
            query.order_by(Proyecto.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return proyectos, total