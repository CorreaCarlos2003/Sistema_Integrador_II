from sqlalchemy import Column, Integer, ForeignKey, DateTime, Date, func
from sqlalchemy.orm import relationship
from app.database.conexion import Base

class ProyectoDetalle(Base):
    __tablename__ = "proyecto_detalle"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    fecha_inicio = Column(DateTime, server_default=func.now())
    fecha_fin = Column(Date, nullable=True)
    fecha_real_fin = Column(DateTime, nullable=True)

    proyecto = relationship("Proyecto", back_populates="detalle")
