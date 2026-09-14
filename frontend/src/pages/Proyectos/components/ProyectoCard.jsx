import { getInitials, getAvatarColors } from '../../../utils/avatarUtils'

export default function ProyectoCard({ proyecto, onSeleccionar }) {
  const esActivo = proyecto.estado?.toLowerCase() === 'activo'
  const esPausado = proyecto.estado?.toLowerCase() === 'pausado'
  const esInactivo = proyecto.estado?.toLowerCase() === 'inactivo' || proyecto.estado?.toLowerCase() === 'archivado'
  
  // Función para determinar clase del badge
  const getBadgeClass = () => {
    if (esActivo) return 'proyecto-card__badge--activo'
    if (esPausado) return 'proyecto-card__badge--pausado'
    if (esInactivo) return 'proyecto-card__badge--inactivo'
    return 'proyecto-card__badge--default'
  }

  // Renderizar avatares de miembros con límite (ej. máx 3)
  const MAX_MIEMBROS = 3
  const miembros = proyecto.miembros || []
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
    <article
      className="proyecto-card"
      onClick={() => onSeleccionar && onSeleccionar(proyecto)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSeleccionar && onSeleccionar(proyecto)
        }
      }}
    >
      <div className="proyecto-card__header">
        <span className="proyecto-card__codigo">{proyecto.codigo || '#PRJ-000'}</span>
        <div className="proyecto-card__header-right">
          <span className={`proyecto-card__badge ${getBadgeClass()}`}>
            <span className="proyecto-card__badge-dot"></span>
            {proyecto.estado?.toUpperCase()}
          </span>
          <button className="proyecto-card__btn-options" aria-label="Opciones" onClick={(e) => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>

      <div className="proyecto-card__body">
        <h3 className="proyecto-card__titulo">{proyecto.nombre}</h3>
        {proyecto.descripción && (
          <p className="proyecto-card__descripcion">{proyecto.descripción}</p>
        )}
      </div>

      <div className="proyecto-card__details">
        <div className="proyecto-card__detail-row">
          <span className="proyecto-card__detail-label">RESPONSABLE</span>
          <div className="proyecto-card__detail-value">
            {proyecto.responsable ? (
              <div className="proyecto-card__responsable">
                {renderAvatar(proyecto.responsable)}
                <span className="proyecto-card__responsable-name">
                  {proyecto.responsable.nombre} <span className="proyecto-card__responsable-rol">({proyecto.responsable.rol || 'Jefe'})</span>
                </span>
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
          <span className="proyecto-card__ultima-act">Última act.: hace 2 horas</span> 
          {/* Asumiendo que la API no manda la hora relativa, harcodamos la lógica por ahora o mostramos un dummy */}
        </div>
        <div className="proyecto-card__footer-right">
          <div className="proyecto-card__fecha-col">
            {formatFecha(proyecto.fecha_creación)}
          </div>
        </div>
      </div>
    </article>
  )
}
