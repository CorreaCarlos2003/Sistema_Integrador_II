import { IconCheckCirculo } from '../../../components/icons'
import './ModalNuevoProyecto.css'

const IconXCirculo = (p) => (
  <svg width={p.size ?? 28} height={p.size ?? 28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </svg>
)

export default function DocumentoResultadoModal({ resultado, onCerrar }) {
  if (!resultado) return null
  const { tipo, nombre } = resultado
  const aprobado = tipo === 'aprobado'

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido modal-contenido--exito" onClick={(e) => e.stopPropagation()}>
        <div className={aprobado ? 'modal-icono-exito' : 'modal-icono-rechazo'}>
          {aprobado ? <IconCheckCirculo size={28} /> : <IconXCirculo size={28} />}
        </div>

        <h2 className="modal-exito-titulo">
          {aprobado ? 'Documento aprobado' : 'Documento rechazado'}
        </h2>
        <p className="modal-exito-texto">
          {aprobado ? (
            <><strong>{nombre}</strong> fue aprobado exitosamente y ya está disponible en el proyecto y para el chat de IA.</>
          ) : (
            <><strong>{nombre}</strong> fue rechazado y se eliminó del proyecto.</>
          )}
        </p>

        <div className="modal-footer modal-footer--centrado">
          <button type="button" className="btn-submit" onClick={onCerrar}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
