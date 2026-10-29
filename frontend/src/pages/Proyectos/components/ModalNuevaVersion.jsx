import { useId, useRef, useState } from 'react'
import { IconDocumento, IconSubirArchivo } from '../../../components/icons'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { DOCUMENTO_ACCEPT, validarArchivoDocumento } from '../../../utils/documentoArchivo'
import ReglasArchivoDocumento from './ReglasArchivoDocumento'
import ProgresoCargaDocumento from './ProgresoCargaDocumento'

export default function ModalNuevaVersion({ documento, cargando, carga, error, onArchivoCambiado, onCancelarCarga, onCancelar, onConfirmar }) {
  const [archivo, setArchivo] = useState(null)
  const [errorArchivo, setErrorArchivo] = useState(null)
  const inputRef = useRef(null)
  const formId = useId()
  const inputId = `${formId}-archivo`
  const errorId = `${formId}-error`
  const mensajeError = errorArchivo || error
  const confirmar = (evento) => {
    evento.preventDefault()
    if (archivo && !errorArchivo && !cargando) onConfirmar(archivo)
  }

  return (
    <ModalShell open={Boolean(documento)} onClose={onCancelar} title="Nueva versión"
      description="Actualiza el documento conservando sus versiones anteriores."
      className="documento-carga-modal documento-carga-modal--version" icon={<IconSubirArchivo size={20} />}
      busy={cargando} dismissOnBackdrop initialFocusRef={inputRef}
      footer={<><Button onClick={onCancelar} disabled={cargando}>Cancelar</Button><Button variant="primary" type="submit" form={formId} disabled={!archivo || Boolean(errorArchivo) || cargando}>{cargando ? 'Procesando...' : 'Subir nueva versión'}</Button></>}>
      {documento && <form id={formId} onSubmit={confirmar}>
        <div className="documento-carga__actual">
          <span className="documento-carga__archivo-icono" aria-hidden="true"><IconDocumento size={20} /></span>
          <div><strong>{documento.nombre}</strong><span>Versión vigente · v{documento.numero_version || '1'}</span></div>
        </div>
        <FormField htmlFor={inputId} label="Archivo de la nueva versión" required>
          <input id={inputId} ref={inputRef} type="file" accept={DOCUMENTO_ACCEPT} required disabled={cargando}
            aria-invalid={Boolean(errorArchivo)} aria-describedby={mensajeError ? errorId : undefined}
            onChange={(evento) => {
              const elegido = evento.target.files?.[0] || null
              setArchivo(elegido)
              setErrorArchivo(elegido ? validarArchivoDocumento(elegido) : null)
              onArchivoCambiado?.()
            }} />
        </FormField>
        <ReglasArchivoDocumento />
        <p className="documento-carga__nota">Se asignará el siguiente número de versión automáticamente. Las versiones anteriores seguirán disponibles en el historial.</p>
        {mensajeError && <p id={errorId} className="documento-carga__error" role="alert">{mensajeError}</p>}
      </form>}
      {documento && cargando && <ProgresoCargaDocumento carga={carga} onCancelar={onCancelarCarga} inline />}
    </ModalShell>
  )
}
