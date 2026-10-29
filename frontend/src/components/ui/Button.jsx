import './ui.css'

export default function Button({ variant = 'secondary', className = '', type = 'button', children, ...props }) {
  return (
    <button type={type} className={`docai-button docai-button--${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}
