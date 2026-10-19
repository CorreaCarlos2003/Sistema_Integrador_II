from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.conexion import Base


class CitaMensaje(Base):
    __tablename__ = "citas_mensaje"

    id = Column(Integer, primary_key=True)
    mensaje_id = Column(Integer, ForeignKey("mensajes.id", ondelete="CASCADE"), nullable=False)
    numero = Column(Integer, nullable=False)
    chunk_id = Column(String(100))
    documento_id = Column(Integer)
    documento_nombre = Column(String(255), nullable=False)
    version_id = Column(Integer)
    version_numero = Column(String(50))
    pagina = Column(Integer)
    seccion = Column(String(255))
    extracto = Column(Text, nullable=False)

    mensaje = relationship("Mensaje", back_populates="citas")
