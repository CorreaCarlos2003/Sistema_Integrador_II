import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'

export default function ProyectosHeader({
  busqueda,
  onCambioBusqueda,
  filtroEstado,
  onCambioFiltroEstado,
  responsables,
  filtroResponsable,
  onCambioFiltroResponsable,
  ocultarFiltroResponsable,
  orden,
  onCambioOrden,
  vista,
  onCambioVista,
  onNuevoProyecto
}) {
  return (
    <header className="proyectos-header">
      <PageHeader
        title="Proyectos"
        description="Administra todos los proyectos del sistema, sus responsables y su actividad operativa dentro de las bóvedas seguras DocAI."
        actions={
          <Button variant="primary" onClick={onNuevoProyecto}>
            <span aria-hidden="true">+</span> Nuevo Proyecto
          </Button>
        }
      />

      <div className="proyectos-header__filtros-bar">
        <div className="proyectos-header__search-wrap">
          <svg className="proyectos-header__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="proyectos-header__search-input"
            aria-label="Buscar proyecto por nombre, ID o clave"
            placeholder="Buscar proyecto por nombre, ID o clave..."
            value={busqueda}
            onChange={(e) => onCambioBusqueda(e.target.value)}
          />
        </div>

        <div className="proyectos-header__vista-toggle" role="group" aria-label="Vista de proyectos">
          <Button
            className="proyectos-header__btn-vista"
            onClick={() => onCambioVista('cards')}
            title="Vista en tarjetas"
            aria-label="Vista en tarjetas"
            aria-pressed={vista === 'cards'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </Button>
          <Button
            className="proyectos-header__btn-vista"
            onClick={() => onCambioVista('lista')}
            title="Vista en lista"
            aria-label="Vista en lista"
            aria-pressed={vista === 'lista'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M8 6h13M8 12h13M8 18h13" />
              <circle cx="4" cy="6" r="1" />
              <circle cx="4" cy="12" r="1" />
              <circle cx="4" cy="18" r="1" />
            </svg>
          </Button>
        </div>

        <div className="proyectos-header__filters">
          <label className="proyectos-header__select-label">
            <span>Estado</span>
            <select className="proyectos-header__select-inline" aria-label="Estado" value={filtroEstado} onChange={(e) => onCambioFiltroEstado(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Por iniciar">Por iniciar</option>
              <option value="En proceso">En proceso</option>
              <option value="Postergado">Postergado</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </label>

          {!ocultarFiltroResponsable && (
            <label className="proyectos-header__select-label">
              <span>Responsable</span>
              <select className="proyectos-header__select-inline" aria-label="Responsable" value={filtroResponsable} onChange={(e) => onCambioFiltroResponsable(e.target.value)}>
                <option value="Todos">Todos</option>
                {responsables.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </label>
          )}

          <label className="proyectos-header__select-label proyectos-header__select-label--orden">
            <span>Ordenar por</span>
            <select className="proyectos-header__select-inline" aria-label="Ordenar por" value={orden} onChange={(e) => onCambioOrden(e.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
          </label>
        </div>
      </div>
    </header>
  )
}
