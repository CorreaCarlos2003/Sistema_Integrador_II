from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


class TarjetaMetrica(BaseModel):
    valor: float
    valor_formateado: str
    delta_texto: str


class PuntoSerie(BaseModel):
    fecha: date
    valor: int


class DocumentoPorProyecto(BaseModel):
    proyecto_id: int
    nombre: str
    total: int
    porcentaje: float


class ActividadRol(BaseModel):
    rol: str
    total: int
    porcentaje: float


class EstadoDocumentos(BaseModel):
    indexados: int
    en_proceso: int
    con_error: int
    tasa_exito_pct: float


class UsoIaFila(BaseModel):
    usuario_id: int
    nombre: str
    correo: Optional[str] = None
    rol: Optional[str] = None
    proyecto_id: Optional[int] = None
    proyecto_nombre: Optional[str] = None
    consultas: int
    ultima_consulta: Optional[datetime] = None
    promedio_diario: float


class TopUsuarioIa(BaseModel):
    usuario_id: int
    nombre: str
    consultas: int


class ReportesResumenResponse(BaseModel):
    desde: date
    hasta: date
    consultas_ia_totales: TarjetaMetrica
    documentos_procesados: TarjetaMetrica
    usuarios_activos: TarjetaMetrica
    tiempo_prom_respuesta_ia: TarjetaMetrica
    serie_consultas_ia: List[PuntoSerie]
    documentos_por_proyecto: List[DocumentoPorProyecto]
    actividad_por_rol: List[ActividadRol]
    estado_documentos: EstadoDocumentos
    uso_ia: List[UsoIaFila]
    top_usuarios_ia: List[TopUsuarioIa]
