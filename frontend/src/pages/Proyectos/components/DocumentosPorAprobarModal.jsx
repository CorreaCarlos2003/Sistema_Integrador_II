import { useEffect, useState } from 'react'
import { actorHeaders } from '../../../utils/actor'
import { IconReloj } from '../../../components/icons'
import DocumentoResultadoModal from './DocumentoResultadoModal'
import './ModalNuevoProyecto.css'
import './DocumentosPorAprobarModal.css'

const API_BASE_URL = 'http://127.0.0.1:8000'

function formatFechaHora(iso) {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function DocumentosPorAprobarModal({ proyectoId, onCerrar, onCambio }) {
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [procesandoId, setProcesandoId] = useState(null)
  const [resultado, setResultado] = useState(null)

  const cargarPendientes = async () => {
    setCargando(true)
    setError('')
    try {
      const respuesta = await fetch(`${API_BASE_URL}/proyectos/${proyectoId}/documentos/pendientes`, {
        headers: { ...actorHeaders() },
      })
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudieron cargar los documentos pendientes')
      }
      setPendientes(await respuesta.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPendientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId])

  const resolver = async (documentoId, nombreDocumento, accion) => {
    setError('')
    setProcesandoId(documentoId)
    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/proyectos/${proyectoId}/documentos/${documentoId}/${accion}`,
        { method: 'POST', headers: { ...actorHeaders() } },
      )
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudo completar la acción')
      }
      setPendientes((prev) => prev.filter((doc) => doc.id !== documentoId))
      setResultado({ tipo: accion === 'aprobar' ? 'aprobado' : 'rechazado', nombre: nombreDocumento })
      onCambio?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesandoId(null)
    }
  }

  return (
    <>
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Documentos por aprobar</h2>
          <button className="modal-close" onClick={onCerrar}>&times;</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {cargando ? (
          <p className="doc-aprobar__vacio">Cargando...</p>
        ) : pendientes.length === 0 ? (
          <p className="doc-aprobar__vacio">No hay documentos esperando aprobación en este proyecto.</p>
        ) : (
          <ul className="doc-aprobar__lista">
            {pendientes.map((doc) => (
              <li key={doc.id} className="doc-aprobar__fila">
                <span className="doc-aprobar__icono">
                  <IconReloj size={18} />
                </span>
                <div className="doc-aprobar__info">
                  <strong>{doc.nombre}</strong>
                  <span>
                    Subido por {doc.subido_por_nombre} · {formatFechaHora(doc.fecha_subida)}
                  </span>
                </div>
                <div className="doc-aprobar__acciones">
                  <button
                    type="button"
                    className="doc-aprobar__btn doc-aprobar__btn--aprobar"
                    disabled={procesandoId === doc.id}
                    onClick={() => resolver(doc.id, doc.nombre, 'aprobar')}
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    className="doc-aprobar__btn doc-aprobar__btn--rechazar"
                    disabled={procesandoId === doc.id}
                    onClick={() => resolver(doc.id, doc.nombre, 'rechazar')}
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-footer modal-footer--centrado">
          <button type="button" className="btn-submit" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <DocumentoResultadoModal resultado={resultado} onCerrar={() => setResultado(null)} />
    </>
  )
}
