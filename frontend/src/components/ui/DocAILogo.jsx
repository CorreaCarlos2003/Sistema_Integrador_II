import symbol from '../../assets/brand/docai-symbol.svg'
import './DocAILogo.css'

export default function DocAILogo({ variant = 'horizontal', size = 38, className = '' }) {
  return (
    <span className={`docai-logo ${className}`} role="img" aria-label="DocAI">
      <img className="docai-logo__symbol" src={symbol} width={size} height={size} alt="" />
      {variant === 'horizontal' && <span className="docai-logo__name" aria-hidden="true">Doc<span>AI</span></span>}
    </span>
  )
}
