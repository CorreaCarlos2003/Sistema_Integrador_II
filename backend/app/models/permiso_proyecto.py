from sqlalchemy import Boolean, Column, DateTime, ForeignKeyConstraint, Integer, String, func
from app.database.conexion import Base


class PermisoProyecto(Base):
    __tablename__ = "permisos_proyecto"

    usuario_id = Column(Integer, primary_key=True)
    proyecto_id = Column(Integer, primary_key=True)
    ver = Column(Boolean, nullable=False, default=True)
    subir_crear = Column(Boolean, nullable=False, default=False)
    editar_anotar = Column(Boolean, nullable=False, default=False)
    descargar = Column(Boolean, nullable=False, default=False)
    consulta_ia = Column(Boolean, nullable=False, default=False)
    nota = Column(String(150), nullable=True)
    fecha_actualizacion = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        ForeignKeyConstraint(
            ["usuario_id", "proyecto_id"],
            ["usuarios_proyectos.usuario_id", "usuarios_proyectos.proyecto_id"],
            ondelete="CASCADE",
        ),
    )
