from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.database.conexion import Base


class EjecucionIA(Base):
    __tablename__ = "ejecuciones_ia"

    id = Column(Integer, primary_key=True)
    mensaje_usuario_id = Column(Integer, ForeignKey("mensajes.id", ondelete="CASCADE"), nullable=False)
    mensaje_asistente_id = Column(Integer, ForeignKey("mensajes.id", ondelete="SET NULL"))
    proveedor = Column(String(30), nullable=False, default="groq")
    modelo = Column(String(100), nullable=False)
    estado = Column(String(20), nullable=False)
    chunks_recuperados = Column(Integer, nullable=False, default=0)
    tokens_entrada = Column(Integer)
    tokens_salida = Column(Integer)
    duracion_recuperacion_ms = Column(Integer)
    duracion_generacion_ms = Column(Integer)
    duracion_total_ms = Column(Integer)
    fuentes = Column(String(500))
    codigo_error = Column(String(80))
    fecha = Column(DateTime, nullable=False, server_default=func.now())
