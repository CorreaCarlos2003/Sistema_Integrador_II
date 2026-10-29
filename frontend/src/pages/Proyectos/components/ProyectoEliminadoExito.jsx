import { useRef } from 'react'
import { IconCheckCirculo } from '../../../components/icons'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import './EliminarProyecto.css'

export default function ProyectoEliminadoExito({ nombreProyecto, onCerrar, returnFocusRef }) {
  const understoodButtonRef = useRef(null)
  if (!nombreProyecto) return null

  return (
    <ModalShell
      open={Boolean(nombreProyecto)}
      onClose={onCerrar}
      title="Proyecto eliminado con éxito"
      className="proyecto-eliminar-resultado"
      dismissOnBackdrop
      initialFocusRef={understoodButtonRef}
      returnFocusRef={returnFocusRef}
      footer={<Button ref={understoodButtonRef} variant="primary" onClick={onCerrar}>Entendido</Button>}
    >
      <span className="proyecto-eliminar-resultado__icono" aria-hidden="true"><IconCheckCirculo size={28} /></span>
      <p className="proyecto-eliminar-resultado__texto">
        <strong>{nombreProyecto}</strong> fue eliminado correctamente junto con sus documentos asociados.
      </p>
    </ModalShell>
  )
}
