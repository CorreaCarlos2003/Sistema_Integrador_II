from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database.conexion import Base


class Mensaje(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True)
    conversacion_id = Column(Integer, ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False)
    rol = Column(String(50), nullable=False)
    contenido = Column(Text, nullable=False)
    tipo = Column(String(30), nullable=False, default="chat")
    metadatos = Column(JSONB, nullable=False, default=dict)
    fecha = Column(DateTime, nullable=False, server_default=func.now())

    conversacion = relationship("Conversacion", back_populates="mensajes")
