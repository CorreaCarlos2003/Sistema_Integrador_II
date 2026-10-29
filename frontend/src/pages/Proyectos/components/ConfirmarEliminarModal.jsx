import { useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import { IconAdvertenciaTriangulo } from '../../../components/icons'
import './DocumentoEliminar.css'

export default function ConfirmarEliminarModal({ nombreDocumento, onCancelar, onConfirmar, eliminando, error, returnFocusRef }) {
  const cancelarRef = useRef(null)
  if (!nombreDocumento) return null
  return (
    <ModalShell open onClose={onCancelar} title="Eliminar documento" icon={<IconAdvertenciaTriangulo size={22} />}
      className="documento-eliminar" busy={eliminando} dismissOnBackdrop initialFocusRef={cancelarRef} returnFocusRef={returnFocusRef}
      footer={<><Button ref={cancelarRef} onClick={onCancelar} disabled={eliminando}>Cancelar</Button><Button variant="danger" onClick={onConfirmar} disabled={eliminando}>{eliminando ? 'Eliminando...' : 'Eliminar documento'}</Button></>}>
      <p className="documento-eliminar__pregunta">¿Seguro que deseas eliminar este documento del proyecto?</p>
      <p className="documento-eliminar__nombre">{nombreDocumento}</p>
      <p className="documento-eliminar__advertencia">Esta acción no se puede deshacer.</p>
      {eliminando && <p className="documento-eliminar__estado" role="status">Eliminando documento...</p>}
      {error && <p className="documento-eliminar__error" role="alert">{error}</p>}
    </ModalShell>
  )
}
