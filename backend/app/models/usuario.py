from sqlalchemy import Boolean, Column, Integer, String
from app.database.conexion import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    correo = Column(String(150), unique=True, nullable=False, index=True)
    contraseña_hash = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False)
    estado = Column(Boolean, default=True)