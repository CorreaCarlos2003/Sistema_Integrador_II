from datetime import date, datetime, time, timedelta

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.documento import Documento
from app.models.evento_auditoria import EventoAuditoria
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.inicio import AlertaOperativa, InicioResumenResponse
from app.services.reportes_service import MODULO_CONSULTA_IA, REFERENCIA_DOC_ERROR

VENTANA_ALERTAS_DIAS = 30


class InicioService:
    def __init__(self, db: Session):
        self.db = db

    def _consultas_ia_hoy(self) -> int:
        hoy = date.today()
        inicio, fin = datetime.combine(hoy, time.min), datetime.combine(hoy, time.max)
        return (
            self.db.query(func.count(EventoAuditoria.id))
            .filter(
                EventoAuditoria.modulo == MODULO_CONSULTA_IA,
                EventoAuditoria.fecha >= inicio,
                EventoAuditoria.fecha <= fin,
            )
            .scalar()
            or 0
        )

    def _proyectos_activos(self) -> int:
        return self.db.query(func.count(Proyecto.id)).filter(Proyecto.archivado.is_(False)).scalar() or 0

    def _documentos_totales(self) -> int:
        return self.db.query(func.count(Documento.id)).scalar() or 0

    def _alertas(self) -> list[AlertaOperativa]:
        limite = datetime.now() - timedelta(days=VENTANA_ALERTAS_DIAS)
        alertas: list[AlertaOperativa] = []

        docs_error = (
            self.db.query(func.count(EventoAuditoria.id))
            .filter(EventoAuditoria.referencia == REFERENCIA_DOC_ERROR, EventoAuditoria.fecha >= limite)
            .scalar()
            or 0
        )
        if docs_error:
            alertas.append(
                AlertaOperativa(
                    tipo="documentos_error",
                    texto=(
                        f"{docs_error} documento{'s' if docs_error != 1 else ''} con error "
                        "en el procesamiento de IA"
                    ),
                    cantidad=docs_error,
                    accion="Diagnosticar",
                )
            )

        proyectos_inactivos = (
            self.db.query(func.count(Proyecto.id))
            .filter(Proyecto.archivado.is_(False), Proyecto.fecha_ultima_actividad < limite)
            .scalar()
            or 0
        )
        if proyectos_inactivos:
            alertas.append(
                AlertaOperativa(
                    tipo="proyectos_inactivos",
                    texto=(
                        f"{proyectos_inactivos} proyecto{'s' if proyectos_inactivos != 1 else ''} sin actividad "
                        f"en los últimos {VENTANA_ALERTAS_DIAS} días"
                    ),
                    cantidad=proyectos_inactivos,
                    accion="Archivar",
                )
            )

        usuarios_inactivos = (
            self.db.query(func.count(Usuario.id))
            .filter(
                Usuario.estado.is_(True),
                or_(Usuario.ultimo_acceso.is_(None), Usuario.ultimo_acceso < limite),
            )
            .scalar()
            or 0
        )
        if usuarios_inactivos:
            alertas.append(
                AlertaOperativa(
                    tipo="usuarios_inactivos",
                    texto=(
                        f"{usuarios_inactivos} usuario{'s' if usuarios_inactivos != 1 else ''} sin acceso "
                        f"en los últimos {VENTANA_ALERTAS_DIAS} días"
                    ),
                    cantidad=usuarios_inactivos,
                    accion="Revisar",
                )
            )

        return alertas

    def resumen(self) -> InicioResumenResponse:
        return InicioResumenResponse(
            consultas_ia_hoy=self._consultas_ia_hoy(),
            proyectos_activos=self._proyectos_activos(),
            documentos_totales=self._documentos_totales(),
            alertas=self._alertas(),
        )
