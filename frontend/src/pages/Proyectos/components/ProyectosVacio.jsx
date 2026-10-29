import SurfaceCard from '../../../components/ui/SurfaceCard'
import { IconCarpeta } from '../../../components/icons'

export default function ProyectosVacio() {
  return (
    <SurfaceCard className="proyectos-vacio" role="status">
      <span className="proyectos-vacio__icono" aria-hidden="true"><IconCarpeta /></span>
      <p>No se encontraron proyectos con los filtros seleccionados.</p>
    </SurfaceCard>
  )
}
