const SECCIONES_POR_ROL = {
  Administrador: ['inicio', 'proyectos', 'usuarios', 'roles', 'historial', 'reportes'],
  'Jefe de Proyecto': ['inicio', 'proyectos', 'usuarios', 'roles'],
  Colaborador: ['inicio', 'proyectos'],
}

export function obtenerSeccionesPermitidas(rol) {
  return SECCIONES_POR_ROL[rol] ?? SECCIONES_POR_ROL.Colaborador
}
