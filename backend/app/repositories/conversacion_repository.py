from sqlalchemy.orm import Session, selectinload

from app.models.conversacion import Conversacion
from app.models.mensaje import Mensaje


class ConversacionRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar(self, proyecto_id: int, usuario_id: int) -> list[Conversacion]:
        return (
            self.db.query(Conversacion)
            .filter_by(proyecto_id=proyecto_id, usuario_id=usuario_id)
            .order_by(Conversacion.fecha.desc(), Conversacion.id.desc())
            .all()
        )

    def obtener(self, conversacion_id: int, proyecto_id: int, usuario_id: int) -> Conversacion | None:
        return (
            self.db.query(Conversacion)
            .options(selectinload(Conversacion.mensajes))
            .filter_by(id=conversacion_id, proyecto_id=proyecto_id, usuario_id=usuario_id)
            .first()
        )

    def crear(self, proyecto_id: int, usuario_id: int) -> Conversacion:
        conversacion = Conversacion(proyecto_id=proyecto_id, usuario_id=usuario_id)
        self.db.add(conversacion)
        self.db.commit()
        self.db.refresh(conversacion)
        return conversacion

    def guardar_intercambio(
        self,
        conversacion: Conversacion | None,
        proyecto_id: int,
        usuario_id: int,
        pregunta: str,
        respuesta: str,
        tipo: str,
        metadatos: dict,
    ) -> Conversacion:
        if conversacion is None:
            conversacion = Conversacion(proyecto_id=proyecto_id, usuario_id=usuario_id)
            self.db.add(conversacion)
            self.db.flush()
        if conversacion.titulo == "Nueva conversación":
            conversacion.titulo = pregunta[:255]
        self.db.add_all([
            Mensaje(conversacion_id=conversacion.id, rol="usuario", contenido=pregunta, tipo=tipo),
            Mensaje(
                conversacion_id=conversacion.id,
                rol="asistente",
                contenido=respuesta,
                tipo=tipo,
                metadatos=metadatos,
            ),
        ])
        try:
            self.db.commit()
            self.db.refresh(conversacion)
        except Exception:
            self.db.rollback()
            raise
        return conversacion
