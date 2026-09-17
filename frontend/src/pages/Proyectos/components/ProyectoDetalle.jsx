import { useEffect, useMemo, useRef, useState } from 'react'
import { getInitials, getAvatarColors } from '../../../utils/avatarUtils'
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

const IconSubir = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M12 3v12" />
    <polyline points="7 8 12 3 17 8" />
    <path d="M5 21h14" />
  </svg>
)

const IconEliminar = (p) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
)

const IconPuntos = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
)

function formatFecha(fechaStr) {
  if (!fechaStr) return ''
  const fecha = new Date(fechaStr)
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha)
}

export default function ProyectoDetalle({ proyecto, onVolver, onIniciarChat }) {
  const [tab, setTab] = useState('documentos')
  const [busqueda, setBusqueda] = useState('')

  const [documentos, setDocumentos] = useState([])
  const [cargandoDocumentos, setCargandoDocumentos] = useState(true)
  const [errorDocumentos, setErrorDocumentos] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const inputArchivoRef = useRef(null)

  const estado = (proyecto.estado || '').toLowerCase()
  const miembros = proyecto.miembros || []

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
    fetchDocumentos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto.id])

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => doc.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  }, [documentos, busqueda])

  const handleSubirClick = () => inputArchivoRef.current?.click()

  const handleArchivoSeleccionado = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    setSubiendo(true)
    setErrorDocumentos(null)
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)

      const response = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/documentos`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const detalle = await response.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudo subir el documento')
      }

      await fetchDocumentos()
    } catch (err) {
      setErrorDocumentos(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  const handleEliminarDocumento = async (idDocumento) => {
    try {
      const response = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/documentos/${idDocumento}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('No se pudo eliminar el documento')
      setDocumentos((prev) => prev.filter((doc) => doc.id !== idDocumento))
    } catch (err) {
      setErrorDocumentos(err.message)
    }
  }

  return (
    <div className="proyecto-detalle">
      <div className="proyecto-detalle__breadcrumb">
        <button type="button" className="proyecto-detalle__volver" onClick={onVolver}>
          <IconVolver />
          VOLVER A PROYECTOS
        </button>
        <span className="proyecto-detalle__separador">/</span>
        <span className="proyecto-detalle__crumb">Proyectos</span>
        <span className="proyecto-detalle__separador">/</span>
        <span className="proyecto-detalle__crumb proyecto-detalle__crumb--activo">{proyecto.nombre}</span>
      </div>

      <div className="proyecto-detalle__header">
        <div className="proyecto-detalle__header-top">
          <div className="proyecto-detalle__header-info">
            <div className="proyecto-detalle__titulo-fila">
              <h1 className="proyecto-detalle__titulo">{proyecto.nombre}</h1>
              <span className="proyecto-detalle__codigo">{proyecto.codigo || '#PRJ-000'}</span>
              <span className={`proyecto-detalle__badge proyecto-detalle__badge--${estado}`}>
                <span className="proyecto-detalle__badge-dot" />
                {proyecto.estado?.toUpperCase()}
              </span>
            </div>

            {proyecto.descripción && (
              <p className="proyecto-detalle__descripcion">{proyecto.descripción}</p>
            )}

            <div className="proyecto-detalle__meta">
              {proyecto.responsable && (
                <span className="proyecto-detalle__meta-item">
                  <span className="proyecto-detalle__meta-avatar">{getInitials(proyecto.responsable.nombre)}</span>
                  <strong>{proyecto.responsable.nombre}</strong>
                  <span className="proyecto-detalle__meta-tenue">({proyecto.responsable.rol || 'Jefe de Proyectos'})</span>
                </span>
              )}
              <span className="proyecto-detalle__meta-sep">•</span>
              <span className="proyecto-detalle__meta-item">
                <IconCalendarioMini />
                Creado: <strong>{formatFecha(proyecto.fecha_creación)}</strong>
              </span>
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

          <button type="button" className="proyecto-detalle__btn-menu" aria-label="Menú contextual">
            <IconPuntos />
          </button>
        </div>
      </div>

      <div className="proyecto-detalle__acciones">
        <button
          type="button"
          className="proyecto-detalle__accion proyecto-detalle__accion--principal"
          onClick={() => onIniciarChat?.()}
        >
          <span className="proyecto-detalle__accion-info">
            <span className="proyecto-detalle__accion-icono proyecto-detalle__accion-icono--principal">
              <IconChat />
            </span>
            <span className="proyecto-detalle__accion-titulo">Iniciar Chat con IA</span>
          </span>
          <span className="proyecto-detalle__accion-btn proyecto-detalle__accion-btn--oscuro">Consultar</span>
        </button>

        <button type="button" className="proyecto-detalle__accion" onClick={handleSubirClick} disabled={subiendo}>
          <span className="proyecto-detalle__accion-info">
            <span className="proyecto-detalle__accion-icono">
              <IconSubir />
            </span>
            <span className="proyecto-detalle__accion-titulo">Subir Documentos</span>
          </span>
          <span className="proyecto-detalle__accion-btn">{subiendo ? 'Subiendo...' : 'Seleccionar'}</span>
        </button>
        <input
          ref={inputArchivoRef}
          type="file"
          accept=".docx"
          style={{ display: 'none' }}
          onChange={handleArchivoSeleccionado}
        />
      </div>

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
                placeholder="Buscar por nombre de documento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="proyecto-detalle__tabla-wrap">
            <div className="proyecto-detalle__tabla-header">
              <div className="proyecto-detalle__col-nombre">NOMBRE DE EXPEDIENTE</div>
              <div>FRAGMENTOS INDEXADOS</div>
              <div>ESTADO</div>
              <div>FECHA DE SUBIDA</div>
              <div className="proyecto-detalle__col-comandos">COMANDOS</div>
            </div>

            {cargandoDocumentos ? (
              <div className="proyecto-detalle__vacio">Cargando documentos...</div>
            ) : errorDocumentos ? (
              <div className="proyecto-detalle__vacio">Error: {errorDocumentos}</div>
            ) : documentosFiltrados.length === 0 ? (
              <div className="proyecto-detalle__vacio">No se encontraron expedientes con los filtros seleccionados.</div>
            ) : (
              documentosFiltrados.map((doc) => (
                <div key={doc.id} className="proyecto-detalle__fila">
                  <div className="proyecto-detalle__col-nombre">
                    <span className="proyecto-detalle__icono-archivo" style={{ background: 'rgba(165,240,234,0.5)', color: '#156965' }}>
                      <IconDocMini />
                    </span>
                    <div className="proyecto-detalle__archivo-info">
                      <span className="proyecto-detalle__archivo-nombre">{doc.nombre}</span>
                    </div>
                  </div>

                  <div className="proyecto-detalle__col-dimensiones">
                    <span>{doc.chunks_indexados}</span>
                  </div>

                  <div>
                    <span className="proyecto-detalle__estado-ocr">
                      <span className="proyecto-detalle__estado-ocr-dot" />
                      INDEXADO
                    </span>
                  </div>

                  <div className="proyecto-detalle__col-autor">
                    <span className="proyecto-detalle__tenue">{formatFecha(doc.fecha_subida)}</span>
                  </div>

                  <div className="proyecto-detalle__col-comandos">
                    <button
                      type="button"
                      className="proyecto-detalle__btn-icono"
                      title="Eliminar"
                      onClick={() => handleEliminarDocumento(doc.id)}
                    >
                      <IconEliminar />
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="proyecto-detalle__tabla-footer">
              <div className="proyecto-detalle__footer-info">
                <span>Mostrando {documentosFiltrados.length} de {documentos.length} documentos</span>
              </div>
            </div>
          </div>
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
    </div>
  )
}
