from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database.conexion import Base


class Mensaje(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True)
    conversacion_id = Column(Integer, ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False)
    rol = Column(String(50), nullable=False)
    contenido = Column(Text, nullable=False)
    tipo = Column(String(30), nullable=False, default="chat")
    estado = Column(String(20), nullable=False, default="completado")
    mensaje_origen_id = Column(Integer, ForeignKey("mensajes.id", ondelete="SET NULL"))
    codigo_error = Column(String(80))
    detalle_error = Column(String(500))
    documento_ids = Column(String(500))
    fecha = Column(DateTime, nullable=False, server_default=func.now())

    conversacion = relationship("Conversacion", back_populates="mensajes")
    citas = relationship("CitaMensaje", back_populates="mensaje", cascade="all, delete-orphan", order_by="CitaMensaje.numero")
