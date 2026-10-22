from typing import List
from pydantic import BaseModel


class AlertaOperativa(BaseModel):
    tipo: str
    texto: str
    cantidad: int
    accion: str


class InicioResumenResponse(BaseModel):
    consultas_ia_hoy: int
    proyectos_activos: int
    documentos_totales: int
    alertas: List[AlertaOperativa]
