from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, func
from app.database.conexion import Base
from sqlalchemy.orm import relationship

from app.models.usuario_proyecto import usuarios_proyectos


class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    descripción = Column(Text, nullable=True)
    estado = Column(String(50), nullable=False, default="Activo")
    fecha_creación = Column(DateTime, nullable=False, server_default=func.sysdatetime())

    usuarios = relationship("Usuario", secondary=usuarios_proyectos, backref="proyectos")