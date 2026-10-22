import './VersionesDocumento.css'

function fechaCompleta(valor) {
  if (!valor) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(valor))
}

export default function HistorialVersiones({ documento, versiones, cargando, error, onCerrar }) {
  if (!documento) return null

  return (
    <div className="versiones-modal__fondo" role="presentation" onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget) onCerrar()
    }}>
      <section className="versiones-modal versiones-modal--historial" role="dialog" aria-modal="true" aria-labelledby="historial-versiones-titulo">
        <header>
          <div>
            <span>Historial documental</span>
            <h2 id="historial-versiones-titulo">{documento.nombre}</h2>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">×</button>
        </header>
        <div className="versiones-historial">
          {cargando && <p>Cargando versiones...</p>}
          {error && <p className="versiones-historial__error">{error}</p>}
          {!cargando && !error && versiones.length === 0 && <p>No hay versiones registradas.</p>}
          {!cargando && versiones.map((version) => (
            <article key={version.version_id || version.id}>
              <div className="versiones-historial__numero">
                <strong>v{version.numero}</strong>
                {version.vigente && <span>Vigente</span>}
              </div>
              <div className="versiones-historial__datos">
                <strong>{version.nombre}</strong>
                <span>{fechaCompleta(version.fecha)}</span>
              </div>
              <span className="versiones-historial__chunks">{version.chunks_indexados} fragmentos</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
