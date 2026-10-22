from datetime import date, datetime, time, timedelta
from typing import Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.documento import Documento
from app.models.evento_auditoria import EventoAuditoria
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.reporte import (
    ActividadRol,
    DocumentoPorProyecto,
    EstadoDocumentos,
    PuntoSerie,
    ReportesResumenResponse,
    TarjetaMetrica,
    TopUsuarioIa,
    UsoIaFila,
)

MODULO_CONSULTA_IA = "consulta_ia"
REFERENCIA_DOC_ERROR = "DOC-ERR"


def _rango_dia_completo(desde: date, hasta: date) -> Tuple[datetime, datetime]:
    return datetime.combine(desde, time.min), datetime.combine(hasta, time.max)


def _rango_anterior(desde: date, hasta: date) -> Tuple[date, date]:
    duracion = (hasta - desde).days + 1
    hasta_anterior = desde - timedelta(days=1)
    desde_anterior = hasta_anterior - timedelta(days=duracion - 1)
    return desde_anterior, hasta_anterior


def _delta_pct_texto(actual: float, anterior: float, etiqueta: str = "vs. periodo anterior") -> str:
    if anterior <= 0:
        return "Sin datos del periodo anterior" if actual == 0 else f"Nuevo este periodo · {etiqueta}"
    cambio = ((actual - anterior) / anterior) * 100
    flecha = "↑" if cambio >= 0 else "↓"
    return f"{flecha}{abs(cambio):.0f}% {etiqueta}"


class ReportesService:
    def __init__(self, db: Session):
        self.db = db

    def _contar_consultas_ia(self, desde: date, hasta: date) -> int:
        inicio, fin = _rango_dia_completo(desde, hasta)
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

    def _contar_documentos(self, desde: date, hasta: date) -> int:
        inicio, fin = _rango_dia_completo(desde, hasta)
        return (
            self.db.query(func.count(Documento.id))
            .filter(Documento.fecha_subida >= inicio, Documento.fecha_subida <= fin)
            .scalar()
            or 0
        )

    def _promedio_duracion_ms(self, desde: date, hasta: date) -> float:
        inicio, fin = _rango_dia_completo(desde, hasta)
        promedio = (
            self.db.query(func.avg(EventoAuditoria.duracion_ms))
            .filter(
                EventoAuditoria.modulo == MODULO_CONSULTA_IA,
                EventoAuditoria.fecha >= inicio,
                EventoAuditoria.fecha <= fin,
                EventoAuditoria.duracion_ms.isnot(None),
            )
            .scalar()
        )
        return float(promedio) if promedio else 0.0

    def _tarjeta_consultas_ia(self, desde: date, hasta: date) -> TarjetaMetrica:
        actual = self._contar_consultas_ia(desde, hasta)
        desde_ant, hasta_ant = _rango_anterior(desde, hasta)
        anterior = self._contar_consultas_ia(desde_ant, hasta_ant)
        return TarjetaMetrica(
            valor=actual,
            valor_formateado=f"{actual:,}",
            delta_texto=_delta_pct_texto(actual, anterior),
        )

    def _tarjeta_documentos(self, desde: date, hasta: date) -> TarjetaMetrica:
        actual = self._contar_documentos(desde, hasta)
        desde_ant, hasta_ant = _rango_anterior(desde, hasta)
        anterior = self._contar_documentos(desde_ant, hasta_ant)
        return TarjetaMetrica(
            valor=actual,
            valor_formateado=f"{actual:,}",
            delta_texto=_delta_pct_texto(actual, anterior),
        )

    def _tarjeta_usuarios_activos(self, desde: date, hasta: date) -> TarjetaMetrica:
        inicio, fin = _rango_dia_completo(desde, hasta)
        total_habilitados = self.db.query(func.count(Usuario.id)).filter(Usuario.estado.is_(True)).scalar() or 0
        nuevos = (
            self.db.query(func.count(Usuario.id))
            .filter(Usuario.fecha_creacion >= inicio, Usuario.fecha_creacion <= fin)
            .scalar()
            or 0
        )
        return TarjetaMetrica(
            valor=total_habilitados,
            valor_formateado=str(total_habilitados),
            delta_texto=f"+{nuevos} nuevo{'s' if nuevos != 1 else ''} este periodo",
        )

    def _tarjeta_tiempo_respuesta(self, desde: date, hasta: date) -> TarjetaMetrica:
        promedio_ms = self._promedio_duracion_ms(desde, hasta)
        segundos = promedio_ms / 1000
        texto = (
            f"↓ Latencia óptima (SLO < 2.0s)"
            if segundos > 0 and segundos < 2.0
            else ("Sin consultas en este periodo" if segundos == 0 else f"↑ Por encima del SLO (2.0s)")
        )
        return TarjetaMetrica(valor=segundos, valor_formateado=f"{segundos:.1f}s", delta_texto=texto)

    def _serie_consultas_ia(self, desde: date, hasta: date) -> list[PuntoSerie]:
        inicio, fin = _rango_dia_completo(desde, hasta)
        filas = (
            self.db.query(func.date(EventoAuditoria.fecha).label("dia"), func.count(EventoAuditoria.id))
            .filter(
                EventoAuditoria.modulo == MODULO_CONSULTA_IA,
                EventoAuditoria.fecha >= inicio,
                EventoAuditoria.fecha <= fin,
            )
            .group_by("dia")
            .all()
        )
        por_dia = {f[0]: f[1] for f in filas}

        serie = []
        cursor = desde
        while cursor <= hasta:
            serie.append(PuntoSerie(fecha=cursor, valor=por_dia.get(cursor, 0)))
            cursor += timedelta(days=1)
        return serie

    def _documentos_por_proyecto(self) -> list[DocumentoPorProyecto]:
        filas = (
            self.db.query(Proyecto.id, Proyecto.nombre, func.count(Documento.id))
            .join(Documento, Documento.proyecto_id == Proyecto.id)
            .group_by(Proyecto.id, Proyecto.nombre)
            .order_by(func.count(Documento.id).desc())
            .limit(6)
            .all()
        )
        total = sum(f[2] for f in filas) or 1
        return [
            DocumentoPorProyecto(
                proyecto_id=f[0], nombre=f[1], total=f[2], porcentaje=round(f[2] / total * 100, 1)
            )
            for f in filas
        ]

    def _actividad_por_rol(self, desde: date, hasta: date) -> list[ActividadRol]:
        inicio, fin = _rango_dia_completo(desde, hasta)
        filas = (
            self.db.query(EventoAuditoria.actor_rol, func.count(EventoAuditoria.id))
            .filter(
                EventoAuditoria.fecha >= inicio,
                EventoAuditoria.fecha <= fin,
                EventoAuditoria.actor_rol.isnot(None),
            )
            .group_by(EventoAuditoria.actor_rol)
            .all()
        )
        total = sum(f[1] for f in filas) or 1
        return [
            ActividadRol(rol=f[0], total=f[1], porcentaje=round(f[1] / total * 100, 1))
            for f in filas
            if f[0]
        ]

    def _estado_documentos(self, desde: date, hasta: date) -> EstadoDocumentos:
        inicio, fin = _rango_dia_completo(desde, hasta)
        indexados = self.db.query(func.count(Documento.id)).filter(Documento.chunks_indexados > 0).scalar() or 0
        con_error = (
            self.db.query(func.count(EventoAuditoria.id))
            .filter(
                EventoAuditoria.referencia == REFERENCIA_DOC_ERROR,
                EventoAuditoria.fecha >= inicio,
                EventoAuditoria.fecha <= fin,
            )
            .scalar()
            or 0
        )
        total = indexados + con_error
        tasa = round(indexados / total * 100, 1) if total else 100.0
        return EstadoDocumentos(indexados=indexados, en_proceso=0, con_error=con_error, tasa_exito_pct=tasa)

    def _uso_ia(self, desde: date, hasta: date) -> list[UsoIaFila]:
        inicio, fin = _rango_dia_completo(desde, hasta)
        dias_rango = max(1, (hasta - desde).days + 1)

        filas = (
            self.db.query(
                EventoAuditoria.usuario_id,
                EventoAuditoria.proyecto_id,
                func.count(EventoAuditoria.id),
                func.max(EventoAuditoria.fecha),
            )
            .filter(
                EventoAuditoria.modulo == MODULO_CONSULTA_IA,
                EventoAuditoria.fecha >= inicio,
                EventoAuditoria.fecha <= fin,
                EventoAuditoria.usuario_id.isnot(None),
                EventoAuditoria.proyecto_id.isnot(None),
            )
            .group_by(EventoAuditoria.usuario_id, EventoAuditoria.proyecto_id)
            .order_by(func.count(EventoAuditoria.id).desc())
            .all()
        )

        resultado = []
        for usuario_id, proyecto_id, consultas, ultima in filas:
            usuario = self.db.query(Usuario).filter(Usuario.id == usuario_id).first()
            proyecto = self.db.query(Proyecto).filter(Proyecto.id == proyecto_id).first() if proyecto_id else None
            resultado.append(
                UsoIaFila(
                    usuario_id=usuario_id,
                    nombre=(usuario.nombre or "").strip() if usuario else "Usuario eliminado",
                    correo=usuario.correo if usuario else None,
                    rol=(usuario.rol or "").strip() if usuario else None,
                    proyecto_id=proyecto_id,
                    proyecto_nombre=proyecto.nombre if proyecto else None,
                    consultas=consultas,
                    ultima_consulta=ultima,
                    promedio_diario=round(consultas / dias_rango, 2),
                )
            )
        return resultado

    def _top_usuarios_ia(self, desde: date, hasta: date, limite: int = 5) -> list[TopUsuarioIa]:
        inicio, fin = _rango_dia_completo(desde, hasta)
        filas = (
            self.db.query(EventoAuditoria.usuario_id, func.count(EventoAuditoria.id))
            .filter(
                EventoAuditoria.modulo == MODULO_CONSULTA_IA,
                EventoAuditoria.fecha >= inicio,
                EventoAuditoria.fecha <= fin,
                EventoAuditoria.usuario_id.isnot(None),
            )
            .group_by(EventoAuditoria.usuario_id)
            .order_by(func.count(EventoAuditoria.id).desc())
            .limit(limite)
            .all()
        )
        resultado = []
        for usuario_id, consultas in filas:
            usuario = self.db.query(Usuario).filter(Usuario.id == usuario_id).first()
            resultado.append(
                TopUsuarioIa(
                    usuario_id=usuario_id,
                    nombre=(usuario.nombre or "").strip() if usuario else "Usuario eliminado",
                    consultas=consultas,
                )
            )
        return resultado

    def resumen(self, desde: Optional[date] = None, hasta: Optional[date] = None) -> ReportesResumenResponse:
        hasta = hasta or date.today()
        desde = desde or (hasta - timedelta(days=29))

        return ReportesResumenResponse(
            desde=desde,
            hasta=hasta,
            consultas_ia_totales=self._tarjeta_consultas_ia(desde, hasta),
            documentos_procesados=self._tarjeta_documentos(desde, hasta),
            usuarios_activos=self._tarjeta_usuarios_activos(desde, hasta),
            tiempo_prom_respuesta_ia=self._tarjeta_tiempo_respuesta(desde, hasta),
            serie_consultas_ia=self._serie_consultas_ia(desde, hasta),
            documentos_por_proyecto=self._documentos_por_proyecto(),
            actividad_por_rol=self._actividad_por_rol(desde, hasta),
            estado_documentos=self._estado_documentos(desde, hasta),
            uso_ia=self._uso_ia(desde, hasta),
            top_usuarios_ia=self._top_usuarios_ia(desde, hasta),
        )

    def exportar_csv(self, desde: Optional[date] = None, hasta: Optional[date] = None) -> str:
        import csv
        import io

        resumen = self.resumen(desde, hasta)
        buffer = io.StringIO()
        escritor = csv.writer(buffer)

        escritor.writerow(["Reporte DocAI", f"{resumen.desde} a {resumen.hasta}"])
        escritor.writerow([])
        escritor.writerow(["Métrica", "Valor", "Variación"])
        escritor.writerow(["Consultas IA totales", resumen.consultas_ia_totales.valor_formateado, resumen.consultas_ia_totales.delta_texto])
        escritor.writerow(["Documentos procesados", resumen.documentos_procesados.valor_formateado, resumen.documentos_procesados.delta_texto])
        escritor.writerow(["Usuarios activos", resumen.usuarios_activos.valor_formateado, resumen.usuarios_activos.delta_texto])
        escritor.writerow(["Tiempo prom. respuesta IA", resumen.tiempo_prom_respuesta_ia.valor_formateado, resumen.tiempo_prom_respuesta_ia.delta_texto])
        escritor.writerow([])

        escritor.writerow(["Documentos por proyecto", "Total", "Porcentaje"])
        for d in resumen.documentos_por_proyecto:
            escritor.writerow([d.nombre, d.total, f"{d.porcentaje}%"])
        escritor.writerow([])

        escritor.writerow(["Top usuarios por consultas IA", "Consultas"])
        for u in resumen.top_usuarios_ia:
            escritor.writerow([u.nombre, u.consultas])

        return buffer.getvalue()
