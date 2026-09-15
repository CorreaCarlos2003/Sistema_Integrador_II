from sqlalchemy import Column, ForeignKey, Integer, Table
from app.database.conexion import Base

usuarios_proyectos = Table(
    "usuarios_proyectos",
    Base.metadata,
    Column("usuario_id", Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True),
    Column("proyecto_id", Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), primary_key=True),
)