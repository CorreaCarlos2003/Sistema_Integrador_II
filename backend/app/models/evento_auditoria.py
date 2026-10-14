from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from app.database.conexion import Base


class EventoAuditoria(Base):
    __tablename__ = "eventos_auditoria"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    actor_nombre = Column(String(255), nullable=False)
    actor_rol = Column(String(50), nullable=True)
    modulo = Column(String(50), nullable=False)
    tipo = Column(String(30), nullable=False, default="info")
    descripcion = Column(String(500), nullable=False)
    referencia = Column(String(150), nullable=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="SET NULL"), nullable=True)
    duracion_ms = Column(Integer, nullable=True)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
