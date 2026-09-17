from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database.conexion import Base


class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    chunks_indexados = Column(Integer, nullable=False, default=0)
    fecha_subida = Column(DateTime, nullable=False, server_default=func.sysdatetime())

    proyecto = relationship("Proyecto", backref="documentos")
