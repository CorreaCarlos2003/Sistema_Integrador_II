function getIconoTipo(tipo) {
  switch (tipo) {
    case 'legal':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
          <path d="m16 16 6-6" />
          <path d="m8 8 6-6" />
          <path d="m9 7 8 8" />
          <path d="m21 11-8-8" />
        </svg>
      )
    case 'archivo':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      )
    case 'documento':
    default:
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
  }
}

export default function ProyectoCard({ proyecto, onSeleccionar }) {
  const esActivo = proyecto.estado.toLowerCase() === 'activo'

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
      {/* Cabecera de la Card: Icono y Badge de estado */}
      <div className="proyecto-card__header">
        <div className={`proyecto-card__icono-wrap proyecto-card__icono-wrap--${proyecto.tipo || 'documento'}`}>
          {getIconoTipo(proyecto.tipo)}
        </div>
        <span
          className={`proyecto-card__badge ${
            esActivo ? 'proyecto-card__badge--activo' : 'proyecto-card__badge--archivado'
          }`}
        >
          {proyecto.estado}
        </span>
      </div>

      {/* Cuerpo: Título del proyecto y Cliente */}
      <div className="proyecto-card__body">
        <h3 className="proyecto-card__titulo">{proyecto.nombre}</h3>
        <p className="proyecto-card__cliente">Cliente: {proyecto.cliente}</p>
      </div>

      {/* Pie de la Card: Documentos y Última modificación */}
      <div className="proyecto-card__footer">
        <div className="proyecto-card__meta-item">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>{Number(proyecto.totalDocs).toLocaleString()} docs</span>
        </div>

        <div className="proyecto-card__meta-item">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{proyecto.ultimaModificacion}</span>
        </div>
      </div>
    </article>
  )
}
