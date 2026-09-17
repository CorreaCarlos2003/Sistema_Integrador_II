from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.documento import Documento


class DocumentoRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_por_proyecto(self, proyecto_id: int) -> List[Documento]:
        return (
            self.db.query(Documento)
            .filter(Documento.proyecto_id == proyecto_id)
            .order_by(Documento.id.desc())
            .all()
        )

    def obtener_por_id(self, id_documento: int) -> Optional[Documento]:
        return self.db.query(Documento).filter(Documento.id == id_documento).first()

    def guardar(self, documento: Documento) -> Documento:
        self.db.add(documento)
        self.db.commit()
        self.db.refresh(documento)
        return documento

    def eliminar(self, documento: Documento) -> None:
        self.db.delete(documento)
        self.db.commit()
