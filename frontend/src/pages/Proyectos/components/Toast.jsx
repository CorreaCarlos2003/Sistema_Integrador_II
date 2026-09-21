import './Toast.css'

export default function Toast({ visible, type, message, onClose }) {
  if (!visible) return null;

  return (
    <div className={`toast-container toast-${type}`}>
      <div className="toast-icon">
        {type === 'loading' && (
          <div className="toast-spinner"></div>
        )}
        {type === 'success' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
        {type === 'error' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        )}
      </div>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      {onClose && type !== 'loading' && (
        <button type="button" className="toast-close" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  )
}
