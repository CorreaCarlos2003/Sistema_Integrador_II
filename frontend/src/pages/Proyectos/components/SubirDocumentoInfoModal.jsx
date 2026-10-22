import { IconDocumento } from '../../../components/icons'
import './ModalNuevoProyecto.css'

export default function SubirDocumentoInfoModal({ visible, onCerrar, onContinuar }) {
  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido modal-contenido--exito" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icono-exito">
          <IconDocumento size={28} />
        </div>

        <h2 className="modal-exito-titulo">Subir documento</h2>
        <p className="modal-exito-texto">
          El tamaño máximo permitido por documento es de <strong>30MB</strong>.
          <br />
          Formatos aceptados: Word (.docx), PDF, Excel (.xlsx), PowerPoint (.pptx),
          Bloc de notas (.txt) y Markdown (.md).
        </p>

        <div className="modal-footer modal-footer--centrado">
          <button type="button" className="btn-cancel" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="button" className="btn-submit" onClick={onContinuar}>
            Seleccionar archivo
          </button>
        </div>
      </div>
    </div>
  )
}
