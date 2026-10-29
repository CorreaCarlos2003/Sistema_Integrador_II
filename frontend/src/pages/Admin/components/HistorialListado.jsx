import { getInitials, getAvatarColors } from '../../../utils/avatarUtils'
import { IconNavProyectos, IconNavUsuarios, IconNavRoles, IconChispa, IconBuscar } from '../../../components/icons'
import Button from '../../../components/ui/Button'

const ETIQUETA_MODULO = { proyectos: 'Proyectos', usuarios: 'Gestión de Usuarios', roles: 'Roles y Permisos', acceso: 'Acceso', consulta_ia: 'Consulta IA' }

function formatHora(fechaISO) {
  const fecha = new Date(fechaISO)
  return fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function colorPorTipo(tipo) {
  switch (tipo) {
    case 'eliminacion':
      return 'historial__dot--rojo'
    case 'acceso':
      return 'historial__dot--gris'
    case 'proceso':
      return 'historial__dot--negro'
    case 'alerta':
      return 'historial__dot--ambar'
    default:
      return 'historial__dot--teal'
  }
}

const IconAcceso = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

function IconModulo({ modulo, ...props }) {
  if (modulo === 'proyectos') return <IconNavProyectos {...props} />
  if (modulo === 'usuarios') return <IconNavUsuarios {...props} />
  if (modulo === 'roles') return <IconNavRoles {...props} />
  if (modulo === 'consulta_ia') return <IconChispa {...props} />
  if (modulo === 'acceso') return <IconAcceso {...props} />
  return <IconNavProyectos {...props} />
}

export default function HistorialListado({ grupos, expandidoId, onExpandir }) {
  return (
    <>
      {grupos.map(([etiqueta, items]) => (
        <section key={etiqueta} className="historial__grupo" aria-label={etiqueta}>
          <div className="historial__grupo-titulo">
            {etiqueta}
          </div>
          {items.map((evento) => {
            const { background, color } = getAvatarColors(evento.actor_nombre)
            const expandido = expandidoId === evento.id
            return (
              <div key={evento.id} className="historial__fila">
                <span className={`historial__dot ${colorPorTipo(evento.tipo)}`} />
                <span className="historial__avatar" style={{ backgroundColor: background, color }}>
                  {getInitials(evento.actor_nombre)}
                </span>
                <div className="historial__contenido">
                  <div className="historial__linea1">
                    <span className="historial__descripcion">{evento.descripcion}</span>
                    <span className="historial__modulo-tag">
                      <IconModulo modulo={evento.modulo} size={11} />
                      {ETIQUETA_MODULO[evento.modulo] ?? evento.modulo}
                    </span>
                  </div>
                  <div className="historial__linea2">
                    {evento.referencia && <span>{evento.referencia}</span>}
                    <span>{formatHora(evento.fecha)} hrs</span>
                    {evento.duracion_ms != null && <span>{(evento.duracion_ms / 1000).toFixed(1)}s</span>}
                  </div>
                  {expandido && (
                    <div className="historial__detalle" id={`historial-detalle-${evento.id}`}>
                      <span><strong>Actor:</strong> {evento.actor_nombre} {evento.actor_rol ? `(${evento.actor_rol})` : ''}</span>
                      <span><strong>Módulo:</strong> {ETIQUETA_MODULO[evento.modulo] ?? evento.modulo}</span>
                      <span><strong>Tipo:</strong> {evento.tipo}</span>
                      {evento.proyecto_id && <span><strong>Proyecto ID:</strong> {evento.proyecto_id}</span>}
                      <span><strong>Fecha completa:</strong> {new Date(evento.fecha).toLocaleString('es-PE')}</span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  className="historial__btn-detalle"
                  aria-expanded={expandido}
                  aria-controls={`historial-detalle-${evento.id}`}
                  aria-label={`${expandido ? 'Ocultar' : 'Ver detalle'}: ${evento.descripcion}`}
                  onClick={() => onExpandir(expandido ? null : evento.id)}
                >
                  <IconBuscar size={12} />
                  {expandido ? 'Ocultar' : 'Ver detalle'}
                </Button>
              </div>
            )
          })}
        </section>
      ))}
    </>
  )
}
