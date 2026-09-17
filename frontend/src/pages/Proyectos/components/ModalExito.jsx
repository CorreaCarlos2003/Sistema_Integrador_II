import './ModalNuevoProyecto.css' // Reuse modal styles

export default function ModalExito({ isOpen, onClose, mensaje }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="modal-contenido" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div className="modal-header" style={{ justifyContent: 'center' }}>
          <h2 style={{ color: '#28a745' }}>¡Éxito!</h2>
        </div>
        
        <div style={{ padding: '20px 0' }}>
          <p>{mensaje}</p>
        </div>
        
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button 
            type="button" 
            className="btn-submit" 
            onClick={onClose}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
