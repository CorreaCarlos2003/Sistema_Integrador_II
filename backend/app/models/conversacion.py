from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database.conexion import Base


class Conversacion(Base):
    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(255), nullable=False, default="Nueva conversación")
    fecha = Column(DateTime, nullable=False, server_default=func.now())

    mensajes = relationship("Mensaje", back_populates="conversacion", cascade="all, delete-orphan", order_by="Mensaje.id")
