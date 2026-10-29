import { useEffect, useRef, useState } from 'react'
import { actorHeaders } from '../../../utils/actor'
import { IconReloj, IconDocumento, IconAlerta } from '../../../components/icons'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import DocumentoResultadoModal from './DocumentoResultadoModal'
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
  const [errorCarga, setErrorCarga] = useState(false)
  const cerrarRef = useRef(null)
  const [procesandoId, setProcesandoId] = useState(null)
  const [accionEnCurso, setAccionEnCurso] = useState(null)
  const [resultado, setResultado] = useState(null)

  const cargarPendientes = async () => {
    setCargando(true)
    setError('')
    setErrorCarga(false)
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
      setErrorCarga(true)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPendientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId])

  const resolver = async (documentoId, nombreDocumento, accion) => {
    if (procesandoId !== null) return
    setError('')
    setProcesandoId(documentoId)
    setAccionEnCurso(accion)
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
      setAccionEnCurso(null)
    }
  }

  const procesando = procesandoId !== null
  return (
    <>
      <ModalShell open onClose={onCerrar} title="Documentos por aprobar"
        description="Revisa los archivos pendientes antes de incorporarlos al proyecto."
        icon={<IconReloj size={20} />} className="doc-aprobar-modal" busy={procesando} dismissOnBackdrop initialFocusRef={cerrarRef}
        footer={<>{procesando && <span className="doc-aprobar__procesando" role="status">Procesando decisión...</span>}<Button ref={cerrarRef} onClick={onCerrar} disabled={procesando}>Cerrar</Button></>}>
        {cargando ? (
          <div className="doc-aprobar__estado" role="status"><IconReloj size={24} aria-hidden="true" /><strong>Cargando documentos pendientes...</strong><p>Estamos consultando los archivos por revisar.</p></div>
        ) : errorCarga ? (
          <div className="doc-aprobar__estado doc-aprobar__estado--error" role="alert"><IconAlerta size={24} aria-hidden="true" /><strong>No pudimos cargar los documentos pendientes</strong><p>{error}</p><Button onClick={cargarPendientes}>Reintentar</Button></div>
        ) : <>
          {error && <p className="doc-aprobar__error" role="alert">{error}</p>}
          {pendientes.length === 0 ? (
            <div className="doc-aprobar__estado" role="status"><IconDocumento size={24} aria-hidden="true" /><strong>No hay documentos pendientes</strong><p>No hay documentos esperando aprobación en este proyecto.</p></div>
          ) : <>
            <div className="doc-aprobar__resumen"><strong>{pendientes.length} {pendientes.length === 1 ? 'documento pendiente' : 'documentos pendientes'}</strong><span>Rechazar elimina el documento del proyecto.</span></div>
            <ul className="doc-aprobar__lista" aria-label="Documentos pendientes de aprobación">
              {pendientes.map((doc) => (
                <li key={doc.id} className="doc-aprobar__fila" aria-busy={procesandoId === doc.id}>
                  <span className="doc-aprobar__icono" aria-hidden="true"><IconDocumento size={18} /></span>
                  <div className="doc-aprobar__info">
                    <strong>{doc.nombre}</strong>
                    <span>Subido por {doc.subido_por_nombre || 'Usuario no disponible'}</span>
                    <span>{formatFechaHora(doc.fecha_subida)}</span>
                  </div>
                  <div className="doc-aprobar__acciones">
                    <Button className="doc-aprobar__rechazar" disabled={procesando} onClick={() => resolver(doc.id, doc.nombre, 'rechazar')} aria-label={`Rechazar ${doc.nombre}`}>{procesandoId === doc.id && accionEnCurso === 'rechazar' ? 'Rechazando...' : 'Rechazar'}</Button>
                    <Button variant="primary" disabled={procesando} onClick={() => resolver(doc.id, doc.nombre, 'aprobar')} aria-label={`Aprobar ${doc.nombre}`}>{procesandoId === doc.id && accionEnCurso === 'aprobar' ? 'Aprobando...' : 'Aprobar'}</Button>
                  </div>
                </li>
              ))}
            </ul>
          </>}
        </>}
      </ModalShell>
      <DocumentoResultadoModal resultado={resultado} onCerrar={() => setResultado(null)} returnFocusRef={cerrarRef} />
    </>
  )
}
