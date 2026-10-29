import './ui.css'

export default function SurfaceCard({ as: Element = 'section', className = '', children, ...props }) {
  return <Element className={`docai-surface ${className}`} {...props}>{children}</Element>
}
