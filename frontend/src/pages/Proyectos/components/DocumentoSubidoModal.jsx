import { IconCheckCirculo } from '../../../components/icons'
import './ModalNuevoProyecto.css'

export default function DocumentoSubidoModal({ nombreDocumento, onCerrar }) {
  if (!nombreDocumento) return null

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido modal-contenido--exito" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icono-exito">
          <IconCheckCirculo size={28} />
        </div>

        <h2 className="modal-exito-titulo">Documento subido correctamente</h2>
        <p className="modal-exito-texto">
          <strong>{nombreDocumento}</strong> se subió e indexó correctamente. Ya puedes hacer
          preguntas sobre su contenido en el chat.
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
