from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from app.database.conexion import Base

class UsuarioProyecto(Base):
    __tablename__ = "usuarios_proyectos"

    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), primary_key=True)
    rol_proyecto = Column(String(50), nullable=False, default="MIEMBRO")
    cargo = Column(String(100), nullable=True)

    # Relaciones inversas hacia las tablas principales
    usuario = relationship("Usuario", back_populates="proyectos")
    proyecto = relationship("Proyecto", back_populates="usuarios")