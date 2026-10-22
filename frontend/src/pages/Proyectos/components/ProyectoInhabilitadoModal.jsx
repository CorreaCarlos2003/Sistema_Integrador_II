import './ModalNuevoProyecto.css'

export default function ProyectoInhabilitadoModal({ proyecto, onCerrar }) {
  if (!proyecto) return null

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Acceso inhabilitado</h2>
          <button className="modal-close" onClick={onCerrar}>&times;</button>
        </div>

        <p>
          Fuiste inhabilitado en el proyecto <strong>{proyecto.nombre}</strong>. Ya no tienes acceso a su
          contenido. Si consideras que esto es un error, comunícate con un administrador del sistema.
        </p>

        <div className="modal-footer">
          <button type="button" className="btn-submit" onClick={onCerrar}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
