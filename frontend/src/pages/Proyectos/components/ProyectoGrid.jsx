import ProyectoCard from './ProyectoCard'

export default function ProyectoGrid({ proyectos, onSeleccionarProyecto }) {
  if (!proyectos || proyectos.length === 0) {
    return (
      <div className="proyectos-vacio">
        <p>No se encontraron proyectos con los filtros seleccionados.</p>
      </div>
    )
  }

  return (
    <div className="proyectos-grid">
      {proyectos.map((proyecto) => (
        <ProyectoCard
          key={proyecto.id}
          proyecto={proyecto}
          onSeleccionar={onSeleccionarProyecto}
        />
      ))}
    </div>
  )
}
