from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database.conexion import Base


class Conversacion(Base):
    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
    fecha_actualizacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_archivado = Column(DateTime)
    titulo = Column(String(255), nullable=False, default="Nueva conversación")
    titulo_manual = Column(Integer, nullable=False, default=0)
    resumen_contexto = Column(Text, nullable=False, default="")
    mensajes = relationship("Mensaje", back_populates="conversacion", cascade="all, delete-orphan", order_by="Mensaje.id")
