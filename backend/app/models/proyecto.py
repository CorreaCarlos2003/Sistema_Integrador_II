from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Boolean, Text, func
from app.database.conexion import Base
from sqlalchemy.orm import relationship

from app.models.usuario_proyecto import UsuarioProyecto


class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    estado = Column(String(50), nullable=False, default="Por Iniciar")
    archivado = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())

    usuarios = relationship("UsuarioProyecto", back_populates="proyecto", cascade="all, delete-orphan")
    documentos = relationship("Documento", back_populates="proyecto", cascade="all, delete-orphan")