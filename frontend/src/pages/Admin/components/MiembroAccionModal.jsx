import { useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import { IconRoles, IconUsuarioMas, IconAdvertenciaTriangulo, IconCheckCirculo } from '../../../components/icons'
import './MiembroAccionModal.css'

const ACCIONES = {
  habilitar: { titulo: 'Habilitar en el proyecto', boton: 'Habilitar', mensaje: 'Podrá volver a interactuar con este proyecto.' },
  inhabilitar: { titulo: 'Inhabilitar en el proyecto', boton: 'Inhabilitar', mensaje: 'Seguirá apareciendo en este proyecto, pero ya no podrá manipularlo.' },
  cancelar: { titulo: 'Cancelar invitación', boton: 'Cancelar invitación', mensaje: 'Se cancelará su invitación pendiente a este proyecto.' },
  eliminar: { titulo: 'Eliminar del proyecto', boton: 'Eliminar', mensaje: 'Será eliminado de este proyecto y ya no tendrá acceso a él. Esta acción no se puede deshacer.' },
}

export default function MiembroAccionModal({ accion, procesando, error, onClose, onConfirm, returnFocusRef }) {
  const volverRef = useRef(null)
  if (!accion) return null
  const config = ACCIONES[accion.tipo]
  const icono = accion.tipo === 'habilitar' ? <IconUsuarioMas size={22} /> : accion.tipo === 'inhabilitar' ? <IconRoles size={22} /> : <IconAdvertenciaTriangulo size={22} />
  return (
    <ModalShell open onClose={onClose} title={config.titulo} icon={icono}
      className={`miembro-accion miembro-accion--${accion.tipo}`} busy={procesando} dismissOnBackdrop
      initialFocusRef={volverRef} returnFocusRef={returnFocusRef}
      footer={<><Button ref={volverRef} onClick={onClose} disabled={procesando}>Volver</Button><Button variant={accion.tipo === 'habilitar' ? 'primary' : 'danger'} onClick={onConfirm} disabled={procesando}>{procesando ? 'Procesando...' : config.boton}</Button></>}>
      <div className="miembro-accion__identidad"><strong>{accion.usuario.nombre}</strong>{accion.usuario.correo && <span>{accion.usuario.correo}</span>}</div>
      <p className="miembro-accion__proyecto">Proyecto: <strong>{accion.proyectoNombre}</strong></p>
      <p className={`miembro-accion__alcance ${accion.tipo === 'eliminar' ? 'miembro-accion__alcance--peligro' : ''}`}>{config.mensaje}</p>
      {procesando && <p className="miembro-accion__estado" role="status">Procesando la acción del miembro...</p>}
      {error && <p className="miembro-accion__error" role="alert">{error}</p>}
    </ModalShell>
  )
}

export function MiembroEliminadoResultado({ miembro, onClose, returnFocusRef }) {
  const entendidoRef = useRef(null)
  if (!miembro) return null
  return (
    <ModalShell open onClose={onClose} title="Usuario eliminado con éxito" icon={<IconCheckCirculo size={22} />}
      className="miembro-accion miembro-accion--resultado" dismissOnBackdrop initialFocusRef={entendidoRef} returnFocusRef={returnFocusRef}
      footer={<Button ref={entendidoRef} variant="primary" onClick={onClose}>Entendido</Button>}>
      <div className="miembro-accion__identidad"><strong>{miembro.nombre}</strong></div>
      <p className="miembro-accion__alcance">Fue eliminado del proyecto correctamente.</p>
      <p className="miembro-accion__proyecto">Proyecto: <strong>{miembro.proyectoNombre}</strong></p>
    </ModalShell>
  )
}
