import { IconCheckCirculo } from '../../../components/icons'
import DocumentoAvisoModal from './DocumentoAvisoModal'

export default function DocumentoSubidoModal({ nombreDocumento, onCerrar }) {
  return <DocumentoAvisoModal nombre={nombreDocumento} onCerrar={onCerrar} titulo="Documento subido correctamente" tono="aprobado"
    icono={<IconCheckCirculo size={22} />} mensaje="Se subió e indexó correctamente. Ya puedes hacer preguntas sobre su contenido en el chat." />
}
