import Button from '../../../components/ui/Button'
import { IconDocumento, IconBuscar, IconAlerta, IconReloj, IconSubirArchivo } from '../../../components/icons'
import './DocumentosListado.css'

function EstadoListado({ tipo, titulo, children }) {
  const Icono = tipo === 'error' ? IconAlerta : tipo === 'busqueda' ? IconBuscar : IconDocumento
  return (
    <div className={`documentos-listado__estado documentos-listado__estado--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span className="documentos-listado__estado-icono" aria-hidden="true"><Icono size={22} /></span>
      <strong>{titulo}</strong>
      {children}
    </div>
  )
}

export default function DocumentosListado({
  documentos, total, cargando, error, busqueda, puedeGestionar, ragListo, subiendo,
  formatFecha, onHistorial, onNuevaVersion, onEliminar, onReintentar, onLimpiarBusqueda,
}) {
  return (
    <section className="documentos-listado" aria-label="Documentos del proyecto">
      <div className="documentos-listado__scroll" role="region" aria-label="Tabla de documentos" tabIndex={0} aria-busy={cargando}>
        <table className="documentos-listado__tabla" aria-label="Documentos del proyecto">
          <colgroup>
            <col /><col className="documentos-listado__col-fragmentos" /><col className="documentos-listado__col-estado" />
            <col className="documentos-listado__col-fecha" /><col className="documentos-listado__col-acciones" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Documento</th>
              <th scope="col" title="Fragmentos indexados para las consultas con IA">Fragmentos</th>
              <th scope="col">Estado</th>
              <th scope="col">Fecha de subida</th>
              <th scope="col" className="documentos-listado__acciones-titulo">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5}><EstadoListado tipo="carga" titulo="Cargando documentos"><p>Estamos consultando los documentos del proyecto.</p></EstadoListado></td></tr>
            ) : error ? (
              <tr><td colSpan={5}><EstadoListado tipo="error" titulo="No pudimos mostrar los documentos"><p>{error}</p><Button onClick={onReintentar}>Reintentar</Button></EstadoListado></td></tr>
            ) : documentos.length === 0 ? (
              <tr><td colSpan={5}>
                <EstadoListado tipo={total > 0 ? 'busqueda' : 'vacio'} titulo={total > 0 ? 'No encontramos coincidencias' : 'Este proyecto aún no tiene documentos'}>
                  <p>{total > 0 ? `Prueba con otro nombre para buscar “${busqueda}”.` : 'Usa «Subir documentos» para agregar la documentación del proyecto.'}</p>
                  {total > 0 && <Button onClick={onLimpiarBusqueda}>Limpiar búsqueda</Button>}
                </EstadoListado>
              </td></tr>
            ) : documentos.map((doc) => (
              <tr key={doc.id} className="documentos-listado__fila">
                <th scope="row">
                  <div className="documentos-listado__documento">
                    <span className="documentos-listado__archivo-icono" aria-hidden="true"><IconDocumento size={18} /></span>
                    <div className="documentos-listado__archivo-info">
                      <span className="documentos-listado__nombre" title={doc.nombre}>{doc.nombre}</span>
                      <span className="documentos-listado__version">Versión vigente · v{doc.numero_version || '1'}</span>
                    </div>
                  </div>
                </th>
                <td className="documentos-listado__fragmentos">{doc.chunks_indexados}</td>
                <td>
                  <span className={`documentos-listado__badge ${doc.estado_aprobacion === 'PENDIENTE' ? 'documentos-listado__badge--pendiente' : ''}`}>
                    <span aria-hidden="true" />{doc.estado_aprobacion === 'PENDIENTE' ? 'Pendiente' : 'Indexado'}
                  </span>
                </td>
                <td className="documentos-listado__fecha">{formatFecha(doc.fecha_subida)}</td>
                <td>
                  <div className="documentos-listado__acciones">
                    <Button onClick={() => onHistorial(doc)} aria-label={`Ver historial de ${doc.nombre}`} title="Ver historial de versiones">
                      <IconReloj size={14} aria-hidden="true" />Historial
                    </Button>
                    {puedeGestionar && <>
                      <Button onClick={() => onNuevaVersion(doc)} disabled={!ragListo || subiendo}
                        aria-label={`Subir nueva versión de ${doc.nombre}`}
                        title={!ragListo ? 'El modelo documental todavía se está preparando' : 'Subir nueva versión'}>
                        <IconSubirArchivo size={14} aria-hidden="true" />Nueva versión
                      </Button>
                      <Button className="documentos-listado__eliminar" onClick={() => onEliminar(doc)} aria-label={`Eliminar ${doc.nombre}`} title="Eliminar documento">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
                        </svg>
                      </Button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!cargando && !error && <footer className="documentos-listado__footer">Mostrando {documentos.length} de {total} documentos</footer>}
    </section>
  )
}
