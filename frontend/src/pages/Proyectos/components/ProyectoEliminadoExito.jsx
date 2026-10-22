import { IconCheckCirculo } from '../../../components/icons'
import './ModalNuevoProyecto.css'

export default function ProyectoEliminadoExito({ nombreProyecto, onCerrar }) {
  if (!nombreProyecto) return null

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido modal-contenido--exito" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icono-exito">
          <IconCheckCirculo size={28} />
        </div>

        <h2 className="modal-exito-titulo">Proyecto eliminado con éxito</h2>
        <p className="modal-exito-texto">
          <strong>{nombreProyecto}</strong> fue eliminado correctamente junto con sus documentos asociados.
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
