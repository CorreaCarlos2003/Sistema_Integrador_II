import { useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import './DocumentoAvisoModal.css'

export default function DocumentoAvisoModal({ nombre, titulo, mensaje, tono, icono, onCerrar, returnFocusRef }) {
  const entendidoRef = useRef(null)
  if (!nombre) return null
  return (
    <ModalShell open onClose={onCerrar} title={titulo} icon={icono}
      className={`documento-aviso documento-aviso--${tono}`} dismissOnBackdrop
      initialFocusRef={entendidoRef} returnFocusRef={returnFocusRef}
      footer={<Button ref={entendidoRef} variant="primary" onClick={onCerrar}>Entendido</Button>}>
      <p className="documento-aviso__nombre">{nombre}</p>
      <p className="documento-aviso__mensaje">{mensaje}</p>
    </ModalShell>
  )
}
