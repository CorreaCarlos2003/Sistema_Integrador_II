import { IconReloj } from '../../../components/icons'
import DocumentoAvisoModal from './DocumentoAvisoModal'

export default function DocumentoPendienteModal({ nombreDocumento, onCerrar }) {
  return (
    <DocumentoAvisoModal nombre={nombreDocumento} onCerrar={onCerrar} titulo="Documento enviado para revisión" tono="pendiente"
      icono={<IconReloj size={22} />} mensaje="Fue recibido y está en espera de aprobación antes de quedar disponible en el proyecto." />
  )
}
