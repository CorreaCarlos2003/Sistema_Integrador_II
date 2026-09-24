from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import backref, relationship

from app.database.conexion import Base


class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    chunks_indexados = Column(Integer, nullable=False, default=0)
    fecha_subida = Column(DateTime, nullable=False, server_default=func.sysdatetime())

    # passive_deletes=True: al borrar un proyecto, deja que la FK con
    # ON DELETE CASCADE en la base de datos elimine los documentos,
    # en vez de que el ORM intente poner proyecto_id en NULL (columna NOT NULL).
    proyecto = relationship("Proyecto", backref=backref("documentos", passive_deletes=True))
