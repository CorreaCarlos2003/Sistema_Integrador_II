import './EstadoRag.css'

export default function EstadoRag({ estado, mensaje, onReintentar }) {
  if (estado === 'listo') return null
  const esError = estado === 'error'

  return (
    <div className={`estado-rag ${esError ? 'estado-rag--error' : ''}`} role={esError ? 'alert' : 'status'} aria-live="polite">
      <span className="estado-rag__indicador" aria-hidden="true" />
      <div>
        <strong>{esError ? 'Asistente documental no disponible' : 'Preparando asistente documental'}</strong>
        <span>{mensaje || 'El chat y las cargas se habilitarán automáticamente.'}</span>
      </div>
      {esError && <button type="button" onClick={onReintentar}>Reintentar</button>}
    </div>
  )
}
