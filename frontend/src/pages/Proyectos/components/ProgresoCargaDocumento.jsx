import './ProgresoCargaDocumento.css'

const textos = {
  preparando: 'Preparando carga...',
  subiendo: 'Transfiriendo archivo...',
  procesando: 'Procesando e indexando...',
  completado: 'Carga completada',
  error: 'No se pudo completar la carga',
  cancelado: 'Carga cancelada',
}

export default function ProgresoCargaDocumento({ carga, onCancelar, onCerrar }) {
  if (!carga?.visible) return null
  const activa = ['preparando', 'subiendo', 'procesando'].includes(carga.estado)
  const cancelable = ['preparando', 'subiendo'].includes(carga.estado)
  const porcentajeVisible = ['subiendo', 'completado'].includes(carga.estado)
  const titulo = carga.operacion === 'nueva-version' ? 'Subiendo nueva versión' : 'Subiendo documento'
  const grados = Math.round((carga.porcentaje / 100) * 360)

  return (
    <aside className={`progreso-carga progreso-carga--${carga.estado}`} role="status" aria-live="polite">
      <div className="progreso-carga__cabecera">
        <strong>{titulo}</strong>
        {!activa && <button type="button" onClick={onCerrar} aria-label="Cerrar progreso">×</button>}
      </div>
      <span className="progreso-carga__archivo" title={carga.archivo}>{carga.archivo}</span>
      {carga.documentoNombre && <span className="progreso-carga__destino">Documento: {carga.documentoNombre}</span>}
      <div
        className={`progreso-carga__medidor ${porcentajeVisible ? '' : 'progreso-carga__medidor--indeterminado'}`}
        style={{ '--progreso-grados': `${grados}deg` }}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={porcentajeVisible ? carga.porcentaje : undefined}
      >
        <div>{porcentajeVisible ? `${carga.porcentaje}%` : '•••'}</div>
      </div>
      <strong className="progreso-carga__estado">{textos[carga.estado]}</strong>
      {carga.estado === 'completado' && <span className="progreso-carga__detalle">Versión v{carga.versionCreada} disponible</span>}
      {carga.error && <span className="progreso-carga__error">{carga.error}</span>}
      {cancelable && <button type="button" className="progreso-carga__cancelar" onClick={onCancelar}>Cancelar</button>}
    </aside>
  )
}
