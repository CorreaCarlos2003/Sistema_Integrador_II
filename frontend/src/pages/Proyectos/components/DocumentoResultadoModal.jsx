import { IconCheckCirculo, IconAlerta } from '../../../components/icons'
import DocumentoAvisoModal from './DocumentoAvisoModal'

export default function DocumentoResultadoModal({ resultado, onCerrar, returnFocusRef }) {
  if (!resultado) return null
  const aprobado = resultado.tipo === 'aprobado'
  return (
    <DocumentoAvisoModal nombre={resultado.nombre} onCerrar={onCerrar} returnFocusRef={returnFocusRef}
      titulo={aprobado ? 'Documento aprobado' : 'Documento rechazado'} tono={aprobado ? 'aprobado' : 'rechazado'}
      icono={aprobado ? <IconCheckCirculo size={22} /> : <IconAlerta size={22} />}
      mensaje={aprobado ? 'Fue aprobado y ya está disponible en el proyecto y para el chat de IA.' : 'Fue rechazado y se eliminó del proyecto.'} />
  )
}
