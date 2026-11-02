import logo from '../../assets/brand/proyecta-ti-horizontal.webp'
import './ProyectaLogo.css'

export default function ProyectaLogo({ className = '' }) {
  return (
    <img
      className={`proyecta-logo ${className}`}
      src={logo}
      width={232}
      height={59}
      alt="Proyecta TI Solutions"
    />
  )
}
