import { IconCheckCirculo } from '../../../components/icons'
import DocumentoAvisoModal from './DocumentoAvisoModal'

export default function DocumentoEliminadoModal({ visible, nombreDocumento, onCerrar, returnFocusRef }) {
  if (!visible) return null
  return (
    <DocumentoAvisoModal nombre={nombreDocumento} titulo="Eliminación exitosa" tono="eliminado"
      icono={<IconCheckCirculo size={22} />} mensaje="El documento se eliminó correctamente del proyecto."
      onCerrar={onCerrar} returnFocusRef={returnFocusRef} />
  )
}
