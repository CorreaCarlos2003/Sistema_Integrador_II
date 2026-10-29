import { useRef } from 'react'
import { IconSubirArchivo } from '../../../components/icons'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import ReglasArchivoDocumento from './ReglasArchivoDocumento'

export default function SubirDocumentoInfoModal({ visible, error, onCerrar, onContinuar }) {
  const seleccionarRef = useRef(null)
  return (
    <ModalShell open={visible} onClose={onCerrar} title="Subir documento"
      description="Agrega un archivo a la documentación de este proyecto."
      icon={<IconSubirArchivo size={20} />} className="documento-carga-modal" dismissOnBackdrop initialFocusRef={seleccionarRef}
      footer={<><Button onClick={onCerrar}>Cancelar</Button><Button variant="primary" ref={seleccionarRef} onClick={onContinuar}><IconSubirArchivo size={16} aria-hidden="true" />Seleccionar archivo</Button></>}>
      <div className="documento-carga__introduccion">
        <span className="documento-carga__ilustracion" aria-hidden="true"><IconSubirArchivo size={28} /></span>
        <strong>Selecciona el documento que quieres subir</strong>
        <p>La carga comenzará al elegir el archivo. Comprueba el formato y el tamaño antes de continuar.</p>
      </div>
      <ReglasArchivoDocumento />
      {error && <p className="documento-carga__error" role="alert">{error}</p>}
    </ModalShell>
  )
}
