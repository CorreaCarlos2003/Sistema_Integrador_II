import { useState, useEffect, useCallback } from 'react'
import { actorHeaders } from '../../utils/actor'
import ProyectosHeader from './components/ProyectosHeader'
import ProyectoGrid from './components/ProyectoGrid'
import ProyectoTable from './components/ProyectoTable'
import ProyectoDetalle from './components/ProyectoDetalle'
import ChatProyecto from './components/ChatProyecto'
import ModalNuevoProyecto from './components/ModalNuevoProyecto'
import ConfirmarEliminarProyecto from './components/ConfirmarEliminarProyecto'
import ProgresoCargaDocumento from './components/ProgresoCargaDocumento'
import useCargaDocumento from './hooks/useCargaDocumento'
import useEstadoRag from './hooks/useEstadoRag'
import './Proyectos.css'

const API_BASE_URL = 'http://127.0.0.1:8000'

export default function Proyectos({ sesion, onSeleccionarProyecto }) {
  const estadoRag = useEstadoRag()
  const cargaDocumentos = useCargaDocumento()
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null)
  const [vistaProyecto, setVistaProyecto] = useState('detalle') // 'detalle' o 'chat'

  // Estados para filtros y paginación
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroResponsable, setFiltroResponsable] = useState('Todos')
  const [orden, setOrden] = useState('recientes')
  const [responsables, setResponsables] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [vista, setVista] = useState('cards') // 'cards' o 'lista'
  const [page, setPage] = useState(1)
  const [limit] = useState(6)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Solo el Administrador del sistema puede archivar/reactivar y eliminar proyectos
  const esAdministrador = sesion?.rol === 'Administrador'
  const [accionError, setAccionError] = useState(null)
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const fetchProyectos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Construir la URL con parámetros
      const params = new URLSearchParams({
        page: page,
        limit: limit,
        orden: orden,
      })
      if (busqueda) params.append('busqueda', busqueda)
      if (filtroEstado && filtroEstado !== 'Todos') params.append('estado', filtroEstado)
      if (filtroResponsable && filtroResponsable !== 'Todos') params.append('responsable_id', filtroResponsable)

      const response = await fetch(`http://127.0.0.1:8000/proyectos/detalles?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error al obtener los proyectos')
      }
      const data = await response.json()
      
      setProyectos(data.items || [])
      setTotalItems(data.total || 0)
      setTotalPages(data.total_pages || 0)
    } catch (err) {
      setError(err.message)
      setProyectos([])
    } finally {
      setLoading(false)
    }
  }, [busqueda, filtroEstado, filtroResponsable, orden, page, limit])

  // Si falla, el filtro de responsables solo muestra "Todos".
  const fetchResponsables = () =>
    fetch(`${API_BASE_URL}/proyectos/responsables`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setResponsables)
      .catch(() => {})

  useEffect(() => {
    fetchResponsables()
  }, [])

  // Disparar la búsqueda al cambiar filtros o página.
  // Podríamos usar debounce para la búsqueda, pero por simplicidad haremos que se dispare cuando el usuario escribe.
  useEffect(() => {
    // Implementamos un debounce manual simple para la búsqueda de texto
    const timer = setTimeout(() => {
      fetchProyectos()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchProyectos])

  const seleccionarProyecto = (proyecto) => {
    setProyectoSeleccionado(proyecto)
    setVistaProyecto('detalle')
    onSeleccionarProyecto?.(proyecto)
  }

  const archivarProyecto = async (proyecto) => {
    setAccionError(null)
    const archivado = !proyecto.archivado
    try {
      const response = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/archivar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...actorHeaders() },
        body: JSON.stringify({ archivado }),
      })
      if (!response.ok) {
        const detalle = await response.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudo archivar el proyecto')
      }

      if (proyectoSeleccionado?.id === proyecto.id) {
        setProyectoSeleccionado({ ...proyectoSeleccionado, archivado })
      }
      fetchProyectos()
    } catch (err) {
      setAccionError(err.message)
    }
  }

  const pedirEliminarProyecto = (proyecto) => {
    setAccionError(null)
    setProyectoAEliminar(proyecto)
  }

  const confirmarEliminarProyecto = async () => {
    if (!proyectoAEliminar) return
    setEliminando(true)
    setAccionError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/proyectos/${proyectoAEliminar.id}`, {
        method: 'DELETE',
        headers: { ...actorHeaders() },
      })
      if (!response.ok) {
        const detalle = await response.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudo eliminar el proyecto')
      }

      if (proyectoSeleccionado?.id === proyectoAEliminar.id) {
        setProyectoSeleccionado(null)
      }
      setProyectoAEliminar(null)
      setPage(1)
      fetchProyectos()
      fetchResponsables()
    } catch (err) {
      setAccionError(err.message)
      setProyectoAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  // Tras subir un documento o consultar a la IA, el backend actualiza el estado
  // y la última actividad del proyecto; se recargan para reflejarlos.
  const refrescarProyectoSeleccionado = async () => {
    if (!proyectoSeleccionado) return
    try {
      const response = await fetch(`${API_BASE_URL}/proyectos/${proyectoSeleccionado.id}`)
      if (!response.ok) return
      const data = await response.json()
      setProyectoSeleccionado((actual) => (actual?.id === data.id ? { ...actual, ...data } : actual))
    } catch {
      // Si falla, se mantiene la información actual del proyecto.
    }
  }

  const volverAProyectos = () => {
    setProyectoSeleccionado(null)
    fetchProyectos()
  }

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  // Generar array de páginas para la paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`proyectos-paginacion__btn ${page === i ? 'proyectos-paginacion__btn--activo' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="proyectos-footer-bar">
        <span className="proyectos-footer-bar__info">
          Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, totalItems)} de {totalItems} proyectos registrados
        </span>
        <div className="proyectos-paginacion">
          <button 
            className="proyectos-paginacion__nav" 
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            &lt;
          </button>
          {pages}
          <button 
            className="proyectos-paginacion__nav" 
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    );
  }

  if (proyectoSeleccionado) {
    if (vistaProyecto === 'chat') {
      return (
        <>
          <ChatProyecto
            key={proyectoSeleccionado.id}
            proyecto={proyectoSeleccionado}
            sesion={sesion}
            estadoRag={estadoRag}
            onVolver={() => {
              setVistaProyecto('detalle')
              refrescarProyectoSeleccionado()
            }}
          />
          <ProgresoCargaDocumento carga={cargaDocumentos.carga} onCancelar={cargaDocumentos.cancelar} onCerrar={cargaDocumentos.cerrar} />
        </>
      )
    }

    return (
      <>
        {accionError && <div className="proyectos-error">Error: {accionError}</div>}
        <ProyectoDetalle
          proyecto={proyectoSeleccionado}
          onVolver={volverAProyectos}
          onIniciarChat={() => setVistaProyecto('chat')}
          onArchivar={esAdministrador ? archivarProyecto : undefined}
          onEliminar={esAdministrador ? pedirEliminarProyecto : undefined}
          onActividad={refrescarProyectoSeleccionado}
          estadoRag={estadoRag}
          cargaDocumentos={cargaDocumentos}
        />
        <ConfirmarEliminarProyecto
          proyecto={proyectoAEliminar}
          onCancelar={() => setProyectoAEliminar(null)}
          onConfirmar={confirmarEliminarProyecto}
          loading={eliminando}
        />
        <ProgresoCargaDocumento carga={cargaDocumentos.carga} onCancelar={cargaDocumentos.cancelar} onCerrar={cargaDocumentos.cerrar} />
      </>
    )
  }

  return (
    <div className="proyectos-contenedor">
      {/* Cabecera con título, filtros y selector de vista */}
      <ProyectosHeader
        busqueda={busqueda}
        onCambioBusqueda={(val) => { setBusqueda(val); setPage(1); }}
        filtroEstado={filtroEstado}
        onCambioFiltroEstado={(val) => { setFiltroEstado(val); setPage(1); }}
        responsables={responsables}
        filtroResponsable={filtroResponsable}
        onCambioFiltroResponsable={(val) => { setFiltroResponsable(val); setPage(1); }}
        orden={orden}
        onCambioOrden={(val) => { setOrden(val); setPage(1); }}
        vista={vista}
        onCambioVista={setVista}
        onNuevoProyecto={() => setIsModalOpen(true)}
      />

      {loading && <div className="proyectos-loader">Cargando proyectos...</div>}
      {error && <div className="proyectos-error">Error: {error}</div>}
      {accionError && <div className="proyectos-error">Error: {accionError}</div>}

      {/* Renderizado condicional según el modo de vista seleccionado */}
      <main className="proyectos-contenido">
        {!loading && !error && (
          vista === 'cards' ? (
            <ProyectoGrid
              proyectos={proyectos}
              onSeleccionarProyecto={seleccionarProyecto}
              onArchivarProyecto={esAdministrador ? archivarProyecto : undefined}
              onEliminarProyecto={esAdministrador ? pedirEliminarProyecto : undefined}
            />
          ) : (
            <ProyectoTable
              proyectos={proyectos}
              onSeleccionarProyecto={seleccionarProyecto}
              onArchivarProyecto={esAdministrador ? archivarProyecto : undefined}
              onEliminarProyecto={esAdministrador ? pedirEliminarProyecto : undefined}
            />
          )
        )}
      </main>

      {/* Footer y Paginación */}
      {!loading && !error && renderPagination()}

      <ModalNuevoProyecto
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={() => {
          setPage(1)
          fetchProyectos()
          fetchResponsables()
        }}
      />

      <ConfirmarEliminarProyecto
        proyecto={proyectoAEliminar}
        onCancelar={() => setProyectoAEliminar(null)}
        onConfirmar={confirmarEliminarProyecto}
        loading={eliminando}
      />
      <ProgresoCargaDocumento carga={cargaDocumentos.carga} onCancelar={cargaDocumentos.cancelar} onCerrar={cargaDocumentos.cerrar} />
    </div>
  )
}
