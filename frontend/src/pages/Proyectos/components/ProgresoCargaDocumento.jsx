import { useId } from 'react'
import Button from '../../../components/ui/Button'
import { IconDocumento } from '../../../components/icons'
import './ProgresoCargaDocumento.css'

const textos = {
  preparando: 'Preparando carga...',
  subiendo: 'Transfiriendo archivo...',
  procesando: 'Procesando e indexando...',
  completado: 'Carga completada',
  error: 'No se pudo completar la carga',
  cancelado: 'Carga cancelada',
}

export default function ProgresoCargaDocumento({ carga, onCancelar, onCerrar, inline = false }) {
  const estadoId = useId()
  if (!carga?.visible) return null
  const activa = ['preparando', 'subiendo', 'procesando'].includes(carga.estado)
  const cancelable = ['preparando', 'subiendo'].includes(carga.estado)
  const porcentajeVisible = ['subiendo', 'completado'].includes(carga.estado)
  const titulo = carga.operacion === 'nueva-version' ? 'Carga de nueva versión' : 'Carga de documento'

  return (
    <aside className={`progreso-carga progreso-carga--${carga.estado} ${inline ? 'progreso-carga--inline' : ''}`} aria-label={titulo}>
      <div className="progreso-carga__cabecera">
        <span className="progreso-carga__icono" aria-hidden="true"><IconDocumento size={18} /></span>
        <strong>{titulo}</strong>
        {!activa && <Button onClick={onCerrar} aria-label="Cerrar progreso">×</Button>}
      </div>
      <span className="progreso-carga__archivo" title={carga.archivo}>{carga.archivo}</span>
      {carga.documentoNombre && <span className="progreso-carga__destino">Documento: {carga.documentoNombre}</span>}
      <div className="progreso-carga__estado-fila">
        <strong id={estadoId} className="progreso-carga__estado" role="status">{textos[carga.estado]}</strong>
        {porcentajeVisible && <span>{carga.porcentaje}%</span>}
      </div>
      <div className={`progreso-carga__barra ${activa && !porcentajeVisible ? 'progreso-carga__barra--indeterminada' : ''}`}
        role="progressbar" aria-labelledby={estadoId} aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={porcentajeVisible ? carga.porcentaje : undefined}>
        <span style={{ width: porcentajeVisible ? `${carga.porcentaje}%` : undefined }} />
      </div>
      {carga.estado === 'completado' && <span className="progreso-carga__detalle">Versión v{carga.versionCreada} disponible</span>}
      {carga.error && <span className="progreso-carga__error">{carga.error}</span>}
      {cancelable && <Button className="progreso-carga__cancelar" onClick={onCancelar}>Cancelar carga</Button>}
    </aside>
  )
}
