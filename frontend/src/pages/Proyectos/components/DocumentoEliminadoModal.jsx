import { IconCheckCirculo } from '../../../components/icons'
import './ModalNuevoProyecto.css'

export default function DocumentoEliminadoModal({ visible, onCerrar }) {
  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido modal-contenido--exito" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icono-exito">
          <IconCheckCirculo size={28} />
        </div>

        <h2 className="modal-exito-titulo">Eliminación exitosa</h2>
        <p className="modal-exito-texto">El documento se eliminó correctamente del proyecto.</p>

        <div className="modal-footer modal-footer--centrado">
          <button type="button" className="btn-submit" onClick={onCerrar}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
