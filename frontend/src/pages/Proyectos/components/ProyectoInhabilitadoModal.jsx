import { useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import { IconRoles } from '../../../components/icons'
import './ProyectoInhabilitadoModal.css'

export default function ProyectoInhabilitadoModal({ proyecto, onCerrar, returnFocusRef }) {
  const understoodButtonRef = useRef(null)
  if (!proyecto) return null

  return (
    <ModalShell
      open={Boolean(proyecto)}
      onClose={onCerrar}
      title="Acceso inhabilitado"
      icon={<IconRoles />}
      className="proyecto-acceso-inhabilitado"
      dismissOnBackdrop
      initialFocusRef={understoodButtonRef}
      returnFocusRef={returnFocusRef}
      footer={<Button ref={understoodButtonRef} variant="primary" onClick={onCerrar}>Entendido</Button>}
    >
      <p className="proyecto-acceso-inhabilitado__mensaje">
        Fuiste inhabilitado en el proyecto <strong>{proyecto.nombre}</strong>. Ya no tienes acceso a su contenido.
      </p>
      <p className="proyecto-acceso-inhabilitado__orientacion">
        Si consideras que esto es un error, comunícate con un administrador del sistema.
      </p>
    </ModalShell>
  )
}
