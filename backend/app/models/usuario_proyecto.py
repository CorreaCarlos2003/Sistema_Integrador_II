from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from app.database.conexion import Base

class UsuarioProyecto(Base):
    __tablename__ = "usuarios_proyectos"

    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), primary_key=True)
    rol_proyecto = Column(String(50), nullable=False, default="MIEMBRO")
    cargo = Column(String(100), nullable=True)
    fecha_ingreso = Column(DateTime, nullable=False, server_default=func.now())
    estado_invitacion = Column(String(20), nullable=False, default="PENDIENTE", server_default="ACEPTADA")
    activo = Column(Boolean, nullable=False, default=True, server_default="true")

    # Relaciones inversas hacia las tablas principales
    usuario = relationship("Usuario", back_populates="proyectos")
    proyecto = relationship("Proyecto", back_populates="usuarios")