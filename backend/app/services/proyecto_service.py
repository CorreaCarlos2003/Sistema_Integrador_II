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
    UsuarioResumen, ProyectoCardResponse


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

    def crear_proyecto(self, datos: ProyectoCrear) -> Proyecto:
        # Validar si el responsable existe
        usuario_repo = UsuarioRepository(self.db)
        responsable = usuario_repo.obtener_por_id(datos.responsable_id)
        if not responsable:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario responsable con ID {datos.responsable_id} no encontrado",
            )

        estado_input = datos.estado.strip() if datos.estado else "Por iniciar"

        if estado_input.lower() == "por iniciar":
            estado_input = "Por iniciar"

        nuevo = Proyecto(
            nombre=datos.nombre.strip(),
            descripcion=datos.descripcion.strip() if datos.descripcion else None,
            estado=estado_input,
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
        
        return self.repo.guardar(nuevo)

    def editar_proyecto(self, id_proyecto: int, datos: ProyectoEditar) -> Proyecto:
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

        return self.repo.guardar(proyecto)

    def cambiar_estado(self, id_proyecto: int, datos: ProyectoEstado) -> Proyecto:
        proyecto = self.obtener_por_id(id_proyecto)
        
        estado_anterior = proyecto.estado.lower() if proyecto.estado else ""
        nuevo_estado = datos.estado.strip()
        proyecto.estado = nuevo_estado
        
        if nuevo_estado.lower() == "finalizado" and estado_anterior != "finalizado":
            if proyecto.detalle:
                proyecto.detalle.fecha_real_fin = datetime.now()
                
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
            miembros = []
            responsable = None
            
            for up in p.usuarios:
                if not up.usuario:
                    continue
                usuario_resumen = UsuarioResumen(
                    id=up.usuario.id,
                    nombre=(up.usuario.nombre or "").strip(),
                    rol=(up.usuario.rol or "").strip(),
                    cargo=up.cargo
                )
                miembros.append(usuario_resumen)
                
                if up.rol_proyecto == "RESPONSABLE":
                    responsable = usuario_resumen

            # Código con padding PRJ-001, PRJ-002...
            codigo = f"PRJ-{str(p.id).zfill(3)}"

            items.append(
                ProyectoCardResponse(
                    id=p.id,
                    codigo=codigo,
                    nombre=p.nombre,
                    descripcion=p.descripcion,
                    estado=p.estado,
                    fecha_creacion=p.fecha_creacion,
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