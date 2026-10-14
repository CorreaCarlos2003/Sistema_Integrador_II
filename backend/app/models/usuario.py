from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship
from app.database.conexion import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    correo = Column(String(255), unique=True, nullable=False, index=True)
    contraseña_hash = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False)
    estado = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    ultimo_acceso = Column(DateTime, nullable=True)

    proyectos = relationship("UsuarioProyecto", back_populates="usuario", cascade="all, delete-orphan")