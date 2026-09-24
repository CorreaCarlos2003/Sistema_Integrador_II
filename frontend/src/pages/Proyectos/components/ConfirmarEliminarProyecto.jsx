import './ModalNuevoProyecto.css'

export default function ConfirmarEliminarProyecto({ proyecto, onCancelar, onConfirmar, loading }) {
  if (!proyecto) return null

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Eliminar proyecto</h2>
          <button className="modal-close" onClick={onCancelar}>&times;</button>
        </div>

        <p>
          ¿Seguro que deseas eliminar <strong>{proyecto.nombre}</strong>? Esta acción eliminará también sus
          documentos asociados y no se puede deshacer. Si prefieres conservar el proyecto sin actividad, usa
          la opción "Archivar" en su lugar.
        </p>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onCancelar} disabled={loading}>
            Cancelar
          </button>
          <button type="button" className="btn-peligro" onClick={onConfirmar} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar proyecto'}
          </button>
        </div>
      </div>
    </div>
  )
}
