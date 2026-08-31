export default function ProyectosHeader({
  filtroEstado,
  onCambioFiltroEstado,
  vista,
  onCambioVista,
  onFiltrar,
}) {
  return (
    <header className="proyectos-header">
      <div className="proyectos-header__info">
        <h1 className="proyectos-header__titulo">Listado de Proyectos</h1>
        <p className="proyectos-header__subtitulo">
          Gestiona y supervisa todos los proyectos documentales activos.
        </p>
      </div>

      <div className="proyectos-header__acciones">
        {/* Desplegable de Estado */}
        <div className="proyectos-header__select-wrap">
          <select
            className="proyectos-header__select"
            value={filtroEstado}
            onChange={(e) => onCambioFiltroEstado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Archivado">Archivado</option>
          </select>
        </div>

        {/* Botón Filtrar */}
        <button
          type="button"
          className="proyectos-header__btn-filtrar"
          onClick={onFiltrar}
        >
          <svg
            className="proyectos-header__icono"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filtrar</span>
        </button>

        {/* Selector de tipo de vista (Cards vs Lista) */}
        <div className="proyectos-header__vista-toggle">
          <button
            type="button"
            className={`proyectos-header__btn-vista ${
              vista === 'cards' ? 'proyectos-header__btn-vista--activo' : ''
            }`}
            onClick={() => onCambioVista('cards')}
            title="Vista en tarjetas"
            aria-label="Vista en tarjetas"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>

          <button
            type="button"
            className={`proyectos-header__btn-vista ${
              vista === 'lista' ? 'proyectos-header__btn-vista--activo' : ''
            }`}
            onClick={() => onCambioVista('lista')}
            title="Vista en lista"
            aria-label="Vista en lista"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
