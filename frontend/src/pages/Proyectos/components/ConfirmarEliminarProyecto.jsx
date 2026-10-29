import { useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import { IconAdvertenciaTriangulo } from '../../../components/icons'
import './EliminarProyecto.css'

export default function ConfirmarEliminarProyecto({ proyecto, onCancelar, onConfirmar, loading, returnFocusRef }) {
  const cancelButtonRef = useRef(null)
  if (!proyecto) return null

  return (
    <ModalShell
      open={Boolean(proyecto)}
      onClose={onCancelar}
      title="Eliminar proyecto"
      icon={<IconAdvertenciaTriangulo />}
      className="proyecto-eliminar"
      busy={loading}
      dismissOnBackdrop
      initialFocusRef={cancelButtonRef}
      returnFocusRef={returnFocusRef}
      footer={
        <>
          {loading && <span className="proyecto-eliminar__procesando" role="status">Eliminando proyecto...</span>}
          <Button ref={cancelButtonRef} onClick={onCancelar} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirmar} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar proyecto'}
          </Button>
        </>
      }
    >
      <p className="proyecto-eliminar__pregunta">¿Seguro que deseas eliminar <strong>{proyecto.nombre}</strong>?</p>
      <p className="proyecto-eliminar__alcance">
        Esta acción eliminará también sus documentos asociados y <strong>no se puede deshacer.</strong>
      </p>
      <p className="proyecto-eliminar__alternativa">
        Si prefieres conservar el proyecto sin actividad, usa la opción "Archivar" en su lugar.
      </p>
    </ModalShell>
  )
}
