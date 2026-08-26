import { useState } from 'react'
import { MOCK_PROYECTOS } from './data/mockProyectos'
import ProyectosHeader from './components/ProyectosHeader'
import ProyectoGrid from './components/ProyectoGrid'
import ProyectoTable from './components/ProyectoTable'
import './Proyectos.css'

export default function Proyectos({ onSeleccionarProyecto }) {
  const [proyectos] = useState(MOCK_PROYECTOS)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [vista, setVista] = useState('cards') // 'cards' o 'lista'

  // Filtrado de proyectos según el selector de estado
  const proyectosFiltrados = proyectos.filter((proyecto) => {
    if (filtroEstado === 'Todos') return true
    return proyecto.estado.toLowerCase() === filtroEstado.toLowerCase()
  })

  const handleFiltrar = () => {
    // Espacio preparado para futuros filtros avanzados o modales
    console.log('Filtrando proyectos...')
  }

  return (
    <div className="proyectos-contenedor">
      {/* Cabecera con título, filtros y selector de vista */}
      <ProyectosHeader
        filtroEstado={filtroEstado}
        onCambioFiltroEstado={setFiltroEstado}
        vista={vista}
        onCambioVista={setVista}
        onFiltrar={handleFiltrar}
      />

      {/* Renderizado condicional según el modo de vista seleccionado */}
      <main className="proyectos-contenido">
        {vista === 'cards' ? (
          <ProyectoGrid
            proyectos={proyectosFiltrados}
            onSeleccionarProyecto={onSeleccionarProyecto}
          />
        ) : (
          <ProyectoTable
            proyectos={proyectosFiltrados}
            onSeleccionarProyecto={onSeleccionarProyecto}
          />
        )}
      </main>
    </div>
  )
}
