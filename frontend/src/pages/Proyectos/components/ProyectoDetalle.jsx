import { useEffect, useMemo, useRef, useState } from 'react'
import { getInitials, getAvatarColors } from '../../../utils/avatarUtils'
import { actorHeaders } from '../../../utils/actor'
import ProyectoAccionesMenu from './ProyectoAccionesMenu'
import DocumentoPendienteModal from './DocumentoPendienteModal'
import DocumentosPorAprobarModal from './DocumentosPorAprobarModal'
import SubirDocumentoInfoModal from './SubirDocumentoInfoModal'
import ConfirmarEliminarModal from './ConfirmarEliminarModal'
import DocumentoEliminadoModal from './DocumentoEliminadoModal'
import EstadoRag from './EstadoRag'
import HistorialVersiones from './HistorialVersiones'
import ModalNuevaVersion from './ModalNuevaVersion'
import ProyectoEstadoBadge from './ProyectoEstadoBadge'
import Button from '../../../components/ui/Button'
import DocumentosListado from './DocumentosListado'
import { IconSubirArchivo } from '../../../components/icons'
import { DOCUMENTO_ACCEPT, validarArchivoDocumento } from '../../../utils/documentoArchivo'
import './ProyectoDetalle.css'

const API_BASE_URL = 'http://127.0.0.1:8000'

const IconVolver = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconCalendarioMini = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconUsuariosMini = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3 3 0 0 1 0 6" />
    <path d="M17.5 14.2a6.5 6.5 0 0 1 4 5.8" />
  </svg>
)

const IconDocMini = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </svg>
)

const IconBuscarMini = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-3.5-3.5" />
  </svg>
)

const IconChat = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)



const IconRelojMini = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
)


function formatFecha(fechaStr) {
  if (!fechaStr) return ''
  // Las fechas "solo día" (YYYY-MM-DD, ej. fecha_fin) se parsean en UTC
  // para que el huso horario local no recorra el día al mostrarlo.
  const esSoloFecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)
  if (esSoloFecha) {
    const [anio, mes, dia] = fechaStr.split('-').map(Number)
    const fecha = new Date(Date.UTC(anio, mes - 1, dia))
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(fecha)
  }
  const fecha = new Date(fechaStr)
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha)
}

export default function ProyectoDetalle({
  proyecto,
  sesion,
  onVolver,
  onIniciarChat,
  onArchivar,
  onEliminar,
  onActividad,
  estadoRag,
  cargaDocumentos,
}) {
  const [tab, setTab] = useState('documentos')
  const [busqueda, setBusqueda] = useState('')

  const [documentos, setDocumentos] = useState([])
  const [cargandoDocumentos, setCargandoDocumentos] = useState(true)
  const [errorDocumentos, setErrorDocumentos] = useState(null)
  const [mostrarInfoSubida, setMostrarInfoSubida] = useState(false)
  const [documentoPendienteAviso, setDocumentoPendienteAviso] = useState(null)
  const [mostrarAprobacion, setMostrarAprobacion] = useState(false)
  const [pendientesCount, setPendientesCount] = useState(0)
  const [documentoAEliminar, setDocumentoAEliminar] = useState(null)
  const [eliminandoDocumento, setEliminandoDocumento] = useState(false)
  const [errorEliminarDocumento, setErrorEliminarDocumento] = useState(null)
  const eliminarDocumentoRef = useRef(null)
  const buscarDocumentoRef = useRef(null)
  const [documentoEliminadoAviso, setDocumentoEliminadoAviso] = useState(null)
  const [documentoVersion, setDocumentoVersion] = useState(null)
  const [errorNuevaVersion, setErrorNuevaVersion] = useState(null)
  const [errorSubida, setErrorSubida] = useState(null)
  const [documentoHistorial, setDocumentoHistorial] = useState(null)
  const [versiones, setVersiones] = useState([])
  const [cargandoVersiones, setCargandoVersiones] = useState(false)
  const [errorVersiones, setErrorVersiones] = useState(null)
  const inputArchivoRef = useRef(null)
  const ragListo = estadoRag?.estado === 'listo'
  const subiendo = cargaDocumentos?.activa

  const miembros = proyecto.miembros || []
  const puedeEliminarDocumentos = sesion?.rol === 'Administrador' || sesion?.rol === 'Jefe de Proyecto'
  const esResponsableDeEsteProyecto = (proyecto.responsables || []).some((r) => r.id === sesion?.id)
  const puedeAprobarDocumentos =
    sesion?.rol === 'Administrador' || (sesion?.rol === 'Jefe de Proyecto' && esResponsableDeEsteProyecto)

  const fetchPendientesCount = async () => {
    if (!puedeAprobarDocumentos) return
    try {
      const respuesta = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/documentos/pendientes`, {
        headers: { ...actorHeaders() },
      })
      if (!respuesta.ok) return
      const data = await respuesta.json()
      setPendientesCount(data.length)
    } catch {
      // El contador es informativo; si falla, simplemente no se actualiza.
    }
  }

  const fetchDocumentos = async () => {
    setCargandoDocumentos(true)
    setErrorDocumentos(null)
    try {
      const response = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/documentos`)
      if (!response.ok) throw new Error('No se pudieron cargar los documentos del proyecto')
      const data = await response.json()
      setDocumentos(data)
    } catch (err) {
      setErrorDocumentos(err.message)
      setDocumentos([])
    } finally {
      setCargandoDocumentos(false)
    }
  }

  useEffect(() => {
    // La consulta asincrona sincroniza la tabla con el proyecto seleccionado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocumentos()
    fetchPendientesCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto.id])

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => doc.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  }, [documentos, busqueda])

  const handleSubirClick = () => {
    setErrorSubida(null)
    setMostrarInfoSubida(true)
  }

  const abrirNuevaVersion = (documento) => {
    setErrorNuevaVersion(null)
    setDocumentoVersion(documento)
  }

  const handleContinuarSubida = () => {
    setMostrarInfoSubida(false)
    inputArchivoRef.current?.click()
  }

  const handleArchivoSeleccionado = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    const errorArchivo = validarArchivoDocumento(archivo)
    if (errorArchivo) {
      setErrorSubida(errorArchivo)
      setMostrarInfoSubida(true)
      return
    }
    setErrorSubida(null)
    setErrorDocumentos(null)
    try {
      const documentoSubido = await cargaDocumentos.subirDocumento({ proyectoId: proyecto.id, archivo })
      await fetchDocumentos()
      if (documentoSubido.estado_aprobacion === 'PENDIENTE') {
        setDocumentoPendienteAviso(documentoSubido.nombre)
      }
      onActividad?.()
    } catch (err) {
      if (err.message !== 'Carga cancelada') {
        setErrorSubida(err.message)
        setMostrarInfoSubida(true)
      }
    }
  }

  const handleSubirVersion = async (archivo) => {
    if (!documentoVersion) return
    const errorArchivo = validarArchivoDocumento(archivo)
    if (errorArchivo) {
      setErrorNuevaVersion(errorArchivo)
      return
    }
    setErrorNuevaVersion(null)
    try {
      await cargaDocumentos.subirVersion({
        proyectoId: proyecto.id,
        documento: documentoVersion,
        archivo,
      })
      setDocumentoVersion(null)
      await fetchDocumentos()
      onActividad?.()
    } catch (err) {
      if (err.message === 'Carga cancelada') setDocumentoVersion(null)
      else setErrorNuevaVersion(err.message)
    }
  }

  const abrirHistorial = async (documento) => {
    setDocumentoHistorial(documento)
    setVersiones([])
    setErrorVersiones(null)
    setCargandoVersiones(true)
    try {
      const response = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/documentos/${documento.id}/versiones`)
      if (!response.ok) {
        const detalle = await response.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudo cargar el historial de versiones')
      }
      setVersiones(await response.json())
    } catch (err) {
      setErrorVersiones(err.message)
    } finally {
      setCargandoVersiones(false)
    }
  }

  const handlePedirEliminarDocumento = (documento) => {
    if (!puedeEliminarDocumentos) return
    eliminarDocumentoRef.current = document.activeElement
    setErrorEliminarDocumento(null)
    setDocumentoAEliminar(documento)
  }

  const handleConfirmarEliminarDocumento = async () => {
    if (!documentoAEliminar || eliminandoDocumento) return
    const exito = await handleEliminarDocumento(documentoAEliminar.id)
    if (exito) {
      setDocumentoEliminadoAviso(documentoAEliminar.nombre)
      setDocumentoAEliminar(null)
    }
  }

  const handleEliminarDocumento = async (idDocumento) => {
    if (!puedeEliminarDocumentos) return false
    setEliminandoDocumento(true)
    setErrorEliminarDocumento(null)
    try {
      const response = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/documentos/${idDocumento}`, {
        method: 'DELETE',
        headers: { ...actorHeaders() },
      })
      if (!response.ok) {
        const detalle = await response.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudo eliminar el documento')
      }
      setDocumentos((prev) => prev.filter((doc) => doc.id !== idDocumento))
      fetchPendientesCount()
      return true
    } catch (err) {
      setErrorEliminarDocumento(err.message)
      return false
    } finally {
      setEliminandoDocumento(false)
    }
  }

  return (
    <div className="proyecto-detalle proyecto-detalle--modern" data-docai-layout="modern">
      <nav className="proyecto-detalle__breadcrumb" aria-label="Migas de pan">
        <button type="button" className="proyecto-detalle__volver" onClick={onVolver}>
          <IconVolver />
          Volver a Proyectos
        </button>
        <span className="proyecto-detalle__separador" aria-hidden="true">/</span>
        <button type="button" className="proyecto-detalle__crumb-btn" onClick={onVolver}>
          Proyectos
        </button>
        <span className="proyecto-detalle__separador" aria-hidden="true">/</span>
        <span className="proyecto-detalle__crumb proyecto-detalle__crumb--activo" aria-current="page">
          {proyecto.nombre}
        </span>
      </nav>

      <div className="proyecto-detalle__header">
        <div className="proyecto-detalle__header-top">
          <div className="proyecto-detalle__header-info">
            <div className="proyecto-detalle__titulo-fila">
              <h1 className="proyecto-detalle__titulo">{proyecto.nombre}</h1>
              <span className="proyecto-detalle__codigo">{proyecto.codigo || '#PRJ-000'}</span>
              <ProyectoEstadoBadge estado={proyecto.estado} archivado={proyecto.archivado} />
            </div>

            {proyecto.descripcion && (
              <p className="proyecto-detalle__descripcion">{proyecto.descripcion}</p>
            )}

            <div className="proyecto-detalle__meta">
              {(proyecto.responsables || []).map((responsable) => (
                <span key={responsable.id} className="proyecto-detalle__meta-item">
                  <span className="proyecto-detalle__meta-avatar">{getInitials(responsable.nombre)}</span>
                  <strong>{responsable.nombre}</strong>
                  <span className="proyecto-detalle__meta-tenue">({responsable.rol || 'Jefe de Proyectos'})</span>
                </span>
              ))}
              <span className="proyecto-detalle__meta-sep">•</span>
              <span className="proyecto-detalle__meta-item">
                <IconCalendarioMini />
                Creado: <strong>{formatFecha(proyecto.fecha_creacion)}</strong>
              </span>
              {proyecto.fecha_fin && (
                <>
                  <span className="proyecto-detalle__meta-sep">•</span>
                  <span className="proyecto-detalle__meta-item">
                    <IconCalendarioMini />
                    Fecha límite: <strong>{formatFecha(proyecto.fecha_fin)}</strong>
                  </span>
                </>
              )}
              <span className="proyecto-detalle__meta-sep">•</span>
              <span className="proyecto-detalle__meta-item">
                <IconUsuariosMini />
                <strong>{miembros.length}</strong> miembros
              </span>
              <span className="proyecto-detalle__meta-sep">•</span>
              <span className="proyecto-detalle__meta-item">
                <IconDocMini />
                <strong>{documentos.length}</strong> expedientes
              </span>
            </div>
          </div>

          <ProyectoAccionesMenu proyecto={proyecto} onArchivar={onArchivar} onEliminar={onEliminar} />
        </div>
      </div>

      <EstadoRag estado={estadoRag?.estado} mensaje={estadoRag?.mensaje} onReintentar={estadoRag?.refrescar} />

      <section className="proyecto-detalle__chat-banner" aria-labelledby="proyecto-chat-titulo">
        <span className="proyecto-detalle__chat-icono" aria-hidden="true"><IconChat /></span>
        <div className="proyecto-detalle__chat-texto">
          <h2 id="proyecto-chat-titulo">Consulta tus documentos con IA</h2>
          <p>{ragListo ? 'Haz preguntas sobre la documentación de este proyecto.' : 'Estamos preparando el asistente documental de este proyecto.'}</p>
        </div>
        <Button
          variant="primary"
          onClick={() => onIniciarChat?.()}
          disabled={!ragListo}
          title={!ragListo ? 'El asistente documental todavía se está preparando' : undefined}
        >
          {ragListo ? 'Iniciar Chat con IA' : 'Preparando Chat con IA'}
        </Button>
      </section>
      <input
        ref={inputArchivoRef}
        type="file"
        accept={DOCUMENTO_ACCEPT}
        style={{ display: 'none' }}
        onChange={handleArchivoSeleccionado}
      />

      <nav className="proyecto-detalle__tabs">
        <button
          type="button"
          className={`proyecto-detalle__tab ${tab === 'documentos' ? 'proyecto-detalle__tab--activo' : ''}`}
          onClick={() => setTab('documentos')}
        >
          <IconDocMini />
          Documentos
          <span className="proyecto-detalle__tab-contador proyecto-detalle__tab-contador--activo">
            {documentos.length}
          </span>
        </button>
        <button
          type="button"
          className={`proyecto-detalle__tab ${tab === 'miembros' ? 'proyecto-detalle__tab--activo' : ''}`}
          onClick={() => setTab('miembros')}
        >
          <IconUsuariosMini />
          Miembros
          <span className="proyecto-detalle__tab-contador">{miembros.length}</span>
        </button>
      </nav>

      {tab === 'documentos' ? (
        <div className="proyecto-detalle__contenido">
          <div className="proyecto-detalle__toolbar">
            <div className="proyecto-detalle__buscador">
              <IconBuscarMini className="proyecto-detalle__buscador-icono" />
              <input
                type="text"
                ref={buscarDocumentoRef}
                aria-label="Buscar por nombre de documento"
                placeholder="Buscar por nombre de documento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="proyecto-detalle__documento-acciones">
              {puedeAprobarDocumentos && (
                <Button onClick={() => setMostrarAprobacion(true)}>
                  <span aria-hidden="true"><IconRelojMini /></span>
                  Por aprobar
                  {pendientesCount > 0 && <span className="proyecto-detalle__pendientes">{pendientesCount}</span>}
                </Button>
              )}
              <Button variant="primary" onClick={handleSubirClick} disabled={subiendo || !ragListo}>
                <span aria-hidden="true"><IconSubirArchivo size={14} /></span>
                {!ragListo ? 'Preparando...' : subiendo ? 'Subiendo...' : 'Subir documentos'}
              </Button>
            </div>
          </div>

          <DocumentosListado
            documentos={documentosFiltrados}
            total={documentos.length}
            cargando={cargandoDocumentos}
            error={errorDocumentos}
            busqueda={busqueda}
            puedeGestionar={puedeEliminarDocumentos}
            ragListo={ragListo}
            subiendo={subiendo}
            formatFecha={formatFecha}
            onHistorial={abrirHistorial}
            onNuevaVersion={abrirNuevaVersion}
            onEliminar={handlePedirEliminarDocumento}
            onReintentar={fetchDocumentos}
            onLimpiarBusqueda={() => setBusqueda('')}
          />
        </div>
      ) : (
        <div className="proyecto-detalle__miembros">
          {miembros.length === 0 ? (
            <div className="proyecto-detalle__vacio">Este proyecto todavía no tiene miembros asignados.</div>
          ) : (
            miembros.map((miembro) => {
              const { background, color } = getAvatarColors(miembro.nombre)
              return (
                <div key={miembro.id} className="proyecto-detalle__miembro">
                  <span className="proyecto-detalle__miembro-avatar" style={{ backgroundColor: background, color }}>
                    {getInitials(miembro.nombre)}
                  </span>
                  <div>
                    <strong>{miembro.nombre}</strong>
                    <span>{miembro.rol}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <SubirDocumentoInfoModal
        visible={mostrarInfoSubida}
        error={errorSubida}
        onCerrar={() => setMostrarInfoSubida(false)}
        onContinuar={handleContinuarSubida}
      />

      <DocumentoPendienteModal
        nombreDocumento={documentoPendienteAviso}
        onCerrar={() => setDocumentoPendienteAviso(null)}
      />

      <ConfirmarEliminarModal
        nombreDocumento={documentoAEliminar?.nombre}
        eliminando={eliminandoDocumento}
        error={errorEliminarDocumento}
        returnFocusRef={eliminarDocumentoRef}
        onCancelar={() => setDocumentoAEliminar(null)}
        onConfirmar={handleConfirmarEliminarDocumento}
      />

      <DocumentoEliminadoModal
        visible={Boolean(documentoEliminadoAviso)}
        nombreDocumento={documentoEliminadoAviso}
        returnFocusRef={buscarDocumentoRef}
        onCerrar={() => setDocumentoEliminadoAviso(null)}
      />

      {mostrarAprobacion && (
        <DocumentosPorAprobarModal
          proyectoId={proyecto.id}
          onCerrar={() => setMostrarAprobacion(false)}
          onCambio={() => {
            fetchDocumentos()
            fetchPendientesCount()
          }}
        />
      )}

      <ModalNuevaVersion
        key={documentoVersion?.id || 'cerrado'}
        documento={documentoVersion}
        cargando={subiendo}
        carga={cargaDocumentos?.carga}
        error={errorNuevaVersion}
        onArchivoCambiado={() => setErrorNuevaVersion(null)}
        onCancelarCarga={cargaDocumentos?.cancelar}
        onCancelar={() => setDocumentoVersion(null)}
        onConfirmar={handleSubirVersion}
      />
      <HistorialVersiones
        documento={documentoHistorial}
        versiones={versiones}
        cargando={cargandoVersiones}
        error={errorVersiones}
        onReintentar={() => abrirHistorial(documentoHistorial)}
        onCerrar={() => setDocumentoHistorial(null)}
      />
    </div>
  )
}
