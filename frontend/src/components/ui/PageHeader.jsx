import './ui.css'

export default function PageHeader({ title, description, actions, className = '', titleClassName = '', descriptionClassName = '' }) {
  return (
    <header className={`docai-page-header ${className}`}>
      <div className="docai-page-header__copy">
        <h1 className={`docai-page-header__title ${titleClassName}`}>{title}</h1>
        {description && <p className={`docai-page-header__description ${descriptionClassName}`}>{description}</p>}
      </div>
      {actions && <div className="docai-page-header__actions">{actions}</div>}
    </header>
  )
}
