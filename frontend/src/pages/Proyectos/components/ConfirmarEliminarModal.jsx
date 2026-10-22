import './ModalNuevoProyecto.css'

export default function ConfirmarEliminarModal({ nombreDocumento, onCancelar, onConfirmar, eliminando }) {
  if (!nombreDocumento) return null

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-contenido modal-contenido--exito" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-exito-titulo">¿Estás seguro de eliminar este documento?</h2>
        <p className="modal-exito-texto">
          Vas a eliminar <strong>{nombreDocumento}</strong>. Esta acción no se puede deshacer.
        </p>

        <div className="modal-footer modal-footer--centrado">
          <button type="button" className="btn-cancel" onClick={onCancelar} disabled={eliminando}>
            Cancelar
          </button>
          <button type="button" className="btn-peligro" onClick={onConfirmar} disabled={eliminando}>
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
