import ProyectoCard from './ProyectoCard'
import ProyectosVacio from './ProyectosVacio'

export default function ProyectoGrid({ proyectos, sesion, onSeleccionarProyecto, onArchivarProyecto, onEliminarProyecto }) {
  if (!proyectos || proyectos.length === 0) {
    return <ProyectosVacio />
  }

  return (
    <div className="proyectos-grid">
      {proyectos.map((proyecto) => (
        <ProyectoCard
          key={proyecto.id}
          proyecto={proyecto}
          sesion={sesion}
          onSeleccionar={onSeleccionarProyecto}
          onArchivar={onArchivarProyecto}
          onEliminar={onEliminarProyecto}
        />
      ))}
    </div>
  )
}
