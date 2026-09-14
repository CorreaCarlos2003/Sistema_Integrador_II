from math import ceil
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.proyecto import Proyecto
from app.repositories.proyecto_repository import ProyectoRepository
from app.schemas.proyecto import ProyectoCrear, ProyectoEditar, ProyectoEstado, PaginatedProyectosResponse, \
    UsuarioResumen, ProyectoCardResponse


class ProyectoService:
    def __init__(self, db: Session):
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

    def crear_proyecto(self, datos: ProyectoCrear) -> Proyecto:
        nuevo = Proyecto(
            nombre=datos.nombre.strip(),
            descripción=datos.descripción.strip() if datos.descripción else None,
            estado=datos.estado.strip() if datos.estado else "Activo",
        )
        return self.repo.guardar(nuevo)

    def editar_proyecto(self, id_proyecto: int, datos: ProyectoEditar) -> Proyecto:
        proyecto = self.obtener_por_id(id_proyecto)

        if datos.nombre is not None:
            proyecto.nombre = datos.nombre.strip()
        if datos.descripción is not None:
            proyecto.descripción = datos.descripción.strip()
        if datos.estado is not None:
            proyecto.estado = datos.estado.strip()

        return self.repo.guardar(proyecto)

    def cambiar_estado(self, id_proyecto: int, datos: ProyectoEstado) -> Proyecto:
        proyecto = self.obtener_por_id(id_proyecto)
        proyecto.estado = datos.estado.strip()
        return self.repo.guardar(proyecto)

    def eliminar_proyecto(self, id_proyecto: int) -> dict:
        proyecto = self.obtener_por_id(id_proyecto)
        self.repo.eliminar(proyecto)
        return {"ok": True, "detail": f"Proyecto {id_proyecto} eliminado correctamente"}

    def listar_cards_proyectos(
            self,
            busqueda: Optional[str] = None,
            estado: Optional[str] = None,
            page: int = 1,
            limit: int = 6,
    ) -> PaginatedProyectosResponse:
        skip = (page - 1) * limit
        proyectos_db, total = self.repo.listar_cards(
            busqueda=busqueda, estado=estado, skip=skip, limit=limit
        )

        items = []
        for p in proyectos_db:
            # Miembros asignados al proyecto
            miembros = [
                UsuarioResumen(
                    id=u.id,
                    nombre=(u.nombre or "").strip(),
                    rol=(u.rol or "").strip(),
                )
                for u in p.usuarios
            ]

            # Seleccionar responsable: busca rol líder/jefe/admin, o toma el primero
            responsable = None
            if miembros:
                responsable = next(
                    (m for m in miembros if m.rol.lower() in ["jefe", "lider", "admin"]),
                    miembros[0],
                )

            # Código con padding PRJ-001, PRJ-002...
            codigo = f"PRJ-{str(p.id).zfill(3)}"

            items.append(
                ProyectoCardResponse(
                    id=p.id,
                    codigo=codigo,
                    nombre=p.nombre,
                    descripción=p.descripción,
                    estado=p.estado,
                    fecha_creación=p.fecha_creación,
                    responsable=responsable,
                    miembros=miembros,
                    total_documentos=0,  # Conectar al count real cuando exista la tabla
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