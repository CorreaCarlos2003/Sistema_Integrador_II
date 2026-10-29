import { useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import { IconAdvertenciaTriangulo, IconCheckCirculo } from '../../../components/icons'
import './EliminarCuentaModal.css'

export default function EliminarCuentaModal({ usuario, eliminando, error, onClose, onConfirm, returnFocusRef }) {
  const volverRef = useRef(null)
  if (!usuario) return null
  return (
    <ModalShell open onClose={onClose} title="Eliminar usuario" icon={<IconAdvertenciaTriangulo size={22} />}
      className="cuenta-eliminar" busy={eliminando} dismissOnBackdrop initialFocusRef={volverRef} returnFocusRef={returnFocusRef}
      footer={<><Button ref={volverRef} onClick={onClose} disabled={eliminando}>Volver</Button><Button variant="danger" onClick={onConfirm} disabled={eliminando}>{eliminando ? 'Eliminando...' : 'Eliminar usuario'}</Button></>}>
      <div className="cuenta-eliminar__identidad"><strong>{usuario.nombre}</strong><span>{usuario.correo}</span></div>
      <p className="cuenta-eliminar__alcance">Será eliminado del sistema y ya no tendrá acceso a la plataforma ni a ninguno de sus proyectos. Esta acción no se puede deshacer.</p>
      {eliminando && <p className="cuenta-eliminar__estado" role="status">Eliminando la cuenta del usuario...</p>}
      {error && <p className="cuenta-eliminar__error" role="alert">{error}</p>}
    </ModalShell>
  )
}

export function CuentaEliminadaResultado({ usuario, onClose, returnFocusRef }) {
  const entendidoRef = useRef(null)
  if (!usuario) return null
  return (
    <ModalShell open onClose={onClose} title="Usuario eliminado con éxito" icon={<IconCheckCirculo size={22} />}
      className="cuenta-eliminada" dismissOnBackdrop initialFocusRef={entendidoRef} returnFocusRef={returnFocusRef}
      footer={<Button ref={entendidoRef} variant="primary" onClick={onClose}>Entendido</Button>}>
      <div className="cuenta-eliminar__identidad"><strong>{usuario.nombre}</strong><span>{usuario.correo}</span></div>
      <p className="cuenta-eliminar__resultado">Fue eliminado del sistema correctamente.</p>
    </ModalShell>
  )
}
