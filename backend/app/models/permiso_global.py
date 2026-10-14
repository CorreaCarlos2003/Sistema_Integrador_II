from sqlalchemy import Boolean, Column, DateTime, Integer, String, UniqueConstraint, func
from app.database.conexion import Base


class PermisoGlobal(Base):
    __tablename__ = "permisos_globales"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rol = Column(String(50), nullable=False)
    modulo = Column(String(50), nullable=False)
    asignado = Column(Boolean, nullable=False, default=True)
    ver = Column(Boolean, nullable=False, default=True)
    crear = Column(Boolean, nullable=False, default=False)
    editar = Column(Boolean, nullable=False, default=False)
    eliminar = Column(Boolean, nullable=False, default=False)
    nota = Column(String(150), nullable=True)
    fecha_actualizacion = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (UniqueConstraint("rol", "modulo", name="uq_permiso_global"),)
