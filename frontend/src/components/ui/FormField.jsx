import './FormField.css'

export default function FormField({ htmlFor, label, required = false, optional = false, className = '', children }) {
  return (
    <div className={`docai-field ${className}`}>
      <label htmlFor={htmlFor}>
        <span>{label}{required && <span className="docai-field__required" aria-hidden="true"> *</span>}</span>
        {optional && <span className="docai-field__optional">Opcional</span>}
      </label>
      {children}
    </div>
  )
}
