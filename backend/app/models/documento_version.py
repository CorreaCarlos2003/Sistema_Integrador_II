from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func

from app.database.conexion import Base


class DocumentoVersion(Base):
    __tablename__ = "documento_versiones"

    id = Column(Integer, primary_key=True)
    documento_id = Column(Integer, ForeignKey("documentos.id", ondelete="CASCADE"), nullable=False)
    numero = Column(String(50), nullable=False)
    nombre = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    chunks_indexados = Column(Integer, nullable=False, default=0)
    vigente = Column(Boolean, nullable=False, default=True)
    fecha = Column(DateTime, nullable=False, server_default=func.now())

    @property
    def version_id(self) -> int:
        """Alias estable para conservar el contrato usado por el chatbot."""
        return self.id
