import './ProyectoEstadoBadge.css'

const TONOS = {
  activo: 'teal',
  'en proceso': 'teal',
  pausado: 'warning',
  postergado: 'warning',
  finalizado: 'success',
  inactivo: 'muted',
}

export default function ProyectoEstadoBadge({ estado, archivado }) {
  const tono = archivado ? 'muted' : TONOS[estado?.toLowerCase()] || 'neutral'
  return (
    <span className={`proyecto-estado-badge proyecto-estado-badge--${tono}`}>
      <span className="proyecto-estado-badge__dot" aria-hidden="true" />
      {archivado ? 'ARCHIVADO' : estado?.toUpperCase()}
    </span>
  )
}
