import { useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import { IconCheckCirculo, IconAlerta } from '../../../components/icons'
import './InvitacionUsuario.css'

export default function InvitacionResultado({ invitacion, onClose, returnFocusRef }) {
  const entendidoRef = useRef(null)
  if (!invitacion) return null
  const proyecto = invitacion.tipo === 'proyecto'
  const titulo = invitacion.enviada ? 'Invitación enviada con éxito' : proyecto ? 'Invitación creada, pero el correo no se pudo enviar' : 'Usuario creado, pero el correo no se pudo enviar'
  return (
    <ModalShell open onClose={onClose} title={titulo}
      icon={invitacion.enviada ? <IconCheckCirculo size={22} /> : <IconAlerta size={22} />}
      className={`invitacion-resultado ${invitacion.enviada ? 'invitacion-resultado--enviada' : 'invitacion-resultado--parcial'}`}
      dismissOnBackdrop initialFocusRef={entendidoRef} returnFocusRef={returnFocusRef}
      footer={<Button ref={entendidoRef} variant="primary" onClick={onClose}>Entendido</Button>}>
      <p className="invitacion-resultado__correo">{invitacion.correo}</p>
      <p className="invitacion-resultado__mensaje">{invitacion.enviada
        ? proyecto ? 'Se envió un correo con la invitación al proyecto. Quedará pendiente hasta que la acepte.' : 'Se envió un correo con los datos de acceso de la cuenta.'
        : 'No se pudo enviar la invitación a este correo. Avísale manualmente.'}</p>
      {proyecto && <span className="invitacion-resultado__pendiente">Pendiente de aceptación</span>}
    </ModalShell>
  )
}
