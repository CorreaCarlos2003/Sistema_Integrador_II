import { useState, useEffect, useCallback } from 'react'
import ProyectosHeader from './components/ProyectosHeader'
import ProyectoGrid from './components/ProyectoGrid'
import ProyectoTable from './components/ProyectoTable'
import ProyectoDetalle from './components/ProyectoDetalle'
import ChatProyecto from './components/ChatProyecto'
import ModalNuevoProyecto from './components/ModalNuevoProyecto'
import './Proyectos.css'

export default function Proyectos({ onSeleccionarProyecto }) {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null)
  const [vistaProyecto, setVistaProyecto] = useState('detalle') // 'detalle' o 'chat'

  // Estados para filtros y paginación
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [vista, setVista] = useState('cards') // 'cards' o 'lista'
  const [page, setPage] = useState(1)
  const [limit] = useState(6)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchProyectos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Construir la URL con parámetros
      const params = new URLSearchParams({
        page: page,
        limit: limit
      })
      if (busqueda) params.append('busqueda', busqueda)
      if (filtroEstado && filtroEstado !== 'Todos') params.append('estado', filtroEstado)

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
  }, [busqueda, filtroEstado, page, limit])

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
        <ChatProyecto
          proyecto={proyectoSeleccionado}
          onVolver={() => setVistaProyecto('detalle')}
        />
      )
    }

    return (
      <ProyectoDetalle
        proyecto={proyectoSeleccionado}
        onVolver={() => setProyectoSeleccionado(null)}
        onIniciarChat={() => setVistaProyecto('chat')}
      />
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
        vista={vista}
        onCambioVista={setVista}
        onNuevoProyecto={() => setIsModalOpen(true)}
      />

      {loading && <div className="proyectos-loader">Cargando proyectos...</div>}
      {error && <div className="proyectos-error">Error: {error}</div>}

      {/* Renderizado condicional según el modo de vista seleccionado */}
      <main className="proyectos-contenido">
        {!loading && !error && (
          vista === 'cards' ? (
            <ProyectoGrid
              proyectos={proyectos}
              onSeleccionarProyecto={seleccionarProyecto}
            />
          ) : (
            <ProyectoTable
              proyectos={proyectos}
              onSeleccionarProyecto={seleccionarProyecto}
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
        }}
      />
    </div>
  )
}
