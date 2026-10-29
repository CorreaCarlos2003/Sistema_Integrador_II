import { getInitials, getAvatarColors } from '../../../utils/avatarUtils'
import { formatoRelativo } from '../../../utils/tiempo'
import ProyectoAccionesMenu from './ProyectoAccionesMenu'
import ProyectoEstadoBadge from './ProyectoEstadoBadge'
import SurfaceCard from '../../../components/ui/SurfaceCard'

export default function ProyectoCard({ proyecto, sesion, onSeleccionar, onArchivar, onEliminar }) {
  const miembroActual = (proyecto.miembros || []).find((m) => m.id === sesion?.id)
  const inhabilitado = miembroActual?.activo === false

  // Renderizar avatares de miembros con límite (ej. máx 3)
  const MAX_MIEMBROS = 3
  const miembros = proyecto.miembros || []
  const responsables = proyecto.responsables || []
  const miembrosParaMostrar = miembros.slice(0, MAX_MIEMBROS)
  const miembrosRestantes = miembros.length - MAX_MIEMBROS

  const renderAvatar = (miembro) => {
    const { background, color } = getAvatarColors(miembro.nombre)
    return (
      <div 
        key={miembro.id}
        className="proyecto-card__avatar"
        style={{ backgroundColor: background, color: color }}
        title={`${miembro.nombre} - ${miembro.rol}`}
      >
        {getInitials(miembro.nombre)}
      </div>
    )
  }

  const formatFechaLimite = (fechaStr) => {
    if (!fechaStr) return ''
    // fecha_fin llega como "YYYY-MM-DD"; se parsea en UTC para evitar
    // que el huso horario local recorra el día al mostrarlo.
    const [anio, mes, dia] = fechaStr.split('-').map(Number)
    const fecha = new Date(Date.UTC(anio, mes - 1, dia))
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(fecha)
  }

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return ''
    const fecha = new Date(fechaStr)
    const formatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })
    const parts = formatter.formatToParts(fecha)
    const getPart = (type) => parts.find(p => p.type === type)?.value
    return (
      <>
        <span>{getPart('day')} {getPart('month')}</span>
        <span>{getPart('year')}</span>
      </>
    )
  }

  return (
    <SurfaceCard as="article"
      className={`proyecto-card ${inhabilitado ? 'proyecto-card--inhabilitado' : ''}`}
      onClick={(e) => onSeleccionar && onSeleccionar(proyecto, e.currentTarget)}
      tabIndex={0}
      role="button"
      aria-label={`Ver proyecto ${proyecto.nombre}`}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSeleccionar && onSeleccionar(proyecto, e.currentTarget)
        }
      }}
    >
      <div className="proyecto-card__header">
        <span className="proyecto-card__codigo">{proyecto.codigo || '#PRJ-000'}</span>
        <div className="proyecto-card__header-right">
          {inhabilitado && (
            <span className="proyecto-card__aviso-inhabilitado">Acceso inhabilitado</span>
          )}
          <ProyectoEstadoBadge estado={proyecto.estado} archivado={proyecto.archivado} />
          <ProyectoAccionesMenu proyecto={proyecto} onArchivar={onArchivar} onEliminar={onEliminar} />
        </div>
      </div>

      <div className="proyecto-card__body">
        <h3 className="proyecto-card__titulo">{proyecto.nombre}</h3>
        {proyecto.descripcion && (
          <p className="proyecto-card__descripcion">{proyecto.descripcion}</p>
        )}
      </div>

      <div className="proyecto-card__details">
        <div className="proyecto-card__detail-row">
          <span className="proyecto-card__detail-label">
            {responsables.length > 1 ? 'RESPONSABLES' : 'RESPONSABLE'}
          </span>
          <div className="proyecto-card__detail-value">
            {responsables.length > 0 ? (
              <div className="proyecto-card__responsables">
                {responsables.map((responsable) => (
                  <div key={responsable.id} className="proyecto-card__responsable">
                    {renderAvatar(responsable)}
                    <span className="proyecto-card__responsable-name">
                      {responsable.nombre} <span className="proyecto-card__responsable-rol">({responsable.cargo || 'Responsable'})</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="proyecto-card__no-data">Sin asignar</span>
            )}
          </div>
        </div>

        <div className="proyecto-card__detail-row">
          <span className="proyecto-card__detail-label">DOCUMENTOS</span>
          <div className="proyecto-card__detail-value proyecto-card__documentos">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="proyecto-card__docs-count">{Number(proyecto.total_documentos || 0).toLocaleString()}</span> expedientes
          </div>
        </div>

        <div className="proyecto-card__detail-row">
          <span className="proyecto-card__detail-label">FECHA LÍMITE</span>
          <div className="proyecto-card__detail-value">
            {proyecto.fecha_fin ? (
              <span>{formatFechaLimite(proyecto.fecha_fin)}</span>
            ) : (
              <span className="proyecto-card__no-data">Sin definir</span>
            )}
          </div>
        </div>

        <div className="proyecto-card__detail-row">
          <span className="proyecto-card__detail-label">MIEMBROS</span>
          <div className="proyecto-card__detail-value proyecto-card__miembros">
            {miembros.length > 0 ? (
              <>
                {miembrosParaMostrar.map(renderAvatar)}
                {miembrosRestantes > 0 && (
                  <div className="proyecto-card__avatar proyecto-card__avatar--more">
                    +{miembrosRestantes}
                  </div>
                )}
              </>
            ) : (
              <span className="proyecto-card__no-data">-</span>
            )}
          </div>
        </div>
      </div>

      <div className="proyecto-card__footer">
        <div className="proyecto-card__footer-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="proyecto-card__ultima-act">
            Última act.: {formatoRelativo(new Date(proyecto.fecha_ultima_actividad || proyecto.fecha_creacion))}
          </span>
        </div>
        <div className="proyecto-card__footer-right">
          <div className="proyecto-card__fecha-col">
            {formatFecha(proyecto.fecha_creacion)}
          </div>
        </div>
      </div>
    </SurfaceCard>
  )
}
