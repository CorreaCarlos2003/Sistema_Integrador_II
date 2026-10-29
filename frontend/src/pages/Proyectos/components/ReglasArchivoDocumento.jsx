import { EXTENSIONES_DOCUMENTO } from '../../../utils/documentoArchivo'
import './DocumentoCarga.css'

export default function ReglasArchivoDocumento() {
  return (
    <div className="documento-carga__reglas">
      <div className="documento-carga__limite"><strong>Formatos admitidos</strong><span>Máximo 30MB por archivo</span></div>
      <ul aria-label="Formatos de documento admitidos">
        {EXTENSIONES_DOCUMENTO.map((extension) => <li key={extension}>{extension.slice(1).toUpperCase()}</li>)}
      </ul>
    </div>
  )
}
