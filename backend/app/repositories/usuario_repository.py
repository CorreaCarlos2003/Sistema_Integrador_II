from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.usuario import Usuario


class UsuarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def obtener_por_id(self, id_usuario: int) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.id == id_usuario).first()

    def obtener_por_correo(self, correo: str) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.correo == correo).first()

    def listar(self) -> List[Usuario]:
        return self.db.query(Usuario).order_by(Usuario.id).all()

    def guardar(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def eliminar(self, usuario: Usuario) -> None:
        self.db.delete(usuario)
        self.db.commit()