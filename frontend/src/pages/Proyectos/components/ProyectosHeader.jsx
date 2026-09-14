export default function ProyectosHeader({
  busqueda,
  onCambioBusqueda,
  filtroEstado,
  onCambioFiltroEstado,
  vista,
  onCambioVista,
}) {
  return (
    <header className="proyectos-header">
      <div className="proyectos-header__top">
        <div className="proyectos-header__info">
          <h1 className="proyectos-header__titulo">Proyectos</h1>
          <p className="proyectos-header__subtitulo">
            Administra todos los proyectos del sistema, sus responsables y su actividad operativa dentro de las bóvedas seguras DocAI.
          </p>
        </div>
        <button className="proyectos-header__btn-nuevo">
          <span>+ Nuevo Proyecto</span>
        </button>
      </div>

      <div className="proyectos-header__filtros-bar">
        <div className="proyectos-header__search-wrap">
          <svg className="proyectos-header__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="proyectos-header__search-input" 
            placeholder="Buscar proyecto por nombre, ID o clave..."
            value={busqueda}
            onChange={(e) => onCambioBusqueda(e.target.value)}
          />
        </div>

        <div className="proyectos-header__select-group">
          <label className="proyectos-header__select-label">
            Estado: 
            <select
              className="proyectos-header__select-inline"
              value={filtroEstado}
              onChange={(e) => onCambioFiltroEstado(e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Pausado">Pausado</option>
              <option value="Archivado">Archivado</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>
        </div>

        <div className="proyectos-header__select-group">
          <label className="proyectos-header__select-label">
            Responsable: 
            <select className="proyectos-header__select-inline">
              <option value="Todos">Todos</option>
              {/* Estático por ahora para coincidir con la UI */}
            </select>
          </label>
        </div>

        <div className="proyectos-header__select-group proyectos-header__select-group--orden">
          <label className="proyectos-header__select-label">
            Ordenar por: 
            <select className="proyectos-header__select-inline">
              <option value="reciente">Más reciente</option>
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: '4px'}}>
              <line x1="21" y1="10" x2="3" y2="10"></line>
              <line x1="21" y1="6" x2="3" y2="6"></line>
              <line x1="21" y1="14" x2="3" y2="14"></line>
              <line x1="21" y1="18" x2="3" y2="18"></line>
            </svg>
          </label>
        </div>

        {/* Selector de tipo de vista */}
        <div className="proyectos-header__vista-toggle">
          <button
            type="button"
            className={`proyectos-header__btn-vista ${
              vista === 'cards' ? 'proyectos-header__btn-vista--activo' : ''
            }`}
            onClick={() => onCambioVista('cards')}
            title="Vista en tarjetas"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/>
              <circle cx="4" cy="6" r="1.5" />
              <circle cx="4" cy="12" r="1.5" />
              <circle cx="4" cy="18" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
