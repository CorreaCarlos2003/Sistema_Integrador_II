import { IconReloj } from '../../../components/icons'
import './ModalNuevoProyecto.css'

export default function DocumentoPendienteModal({ nombreDocumento, onCerrar }) {
  if (!nombreDocumento) return null

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido modal-contenido--exito" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icono-pendiente">
          <IconReloj size={28} />
        </div>

        <h2 className="modal-exito-titulo">Documento enviado para revisión</h2>
        <p className="modal-exito-texto">
          <strong>{nombreDocumento}</strong> fue recibido. Su documento está en espera de ser aprobado
          por un Jefe de Proyecto antes de quedar disponible en el proyecto.
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
