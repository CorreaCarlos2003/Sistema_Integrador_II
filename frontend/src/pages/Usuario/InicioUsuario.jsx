import { useEffect, useState } from 'react'
import '../Admin/Dashboard.css'
import './InicioUsuario.css'
import PageHeader from '../../components/ui/PageHeader'
import SurfaceCard from '../../components/ui/SurfaceCard'
import ProyectoEstadoBadge from '../Proyectos/components/ProyectoEstadoBadge'
import InvitacionesProyectos from '../../components/InvitacionesProyectos'
import { formatoRelativo } from '../../utils/tiempo'

const API_BASE_URL = 'http://127.0.0.1:8000'

export default function InicioUsuario({ sesion }) {
  const nombre = sesion?.nombre?.split(' ')[0] ?? 'Usuario'
  const esJefeDeProyecto = sesion?.rol === 'Jefe de Proyecto'

  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sesion?.id) return
    setCargando(true)
    setError('')

    const params = new URLSearchParams({ page: 1, limit: 5, orden: 'recientes' })
    if (esJefeDeProyecto) {
      params.append('responsable_id', sesion.id)
    } else {
      // Colaborador: solo los proyectos donde fue asignado.
      params.append('miembro_id', sesion.id)
    }

    fetch(`${API_BASE_URL}/proyectos/detalles?${params.toString()}`)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('No se pudieron cargar tus proyectos')
        return respuesta.json()
      })
      .then((datos) => setProyectos(datos.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [sesion?.id, esJefeDeProyecto])

  return (
    <div className="dash inicio-usuario" data-docai-layout="modern">
      <PageHeader title={`¡Hola, ${nombre}!`} description={esJefeDeProyecto
        ? 'Aquí tienes tus proyectos a cargo y las invitaciones pendientes en DocAI.'
        : 'Aquí tienes tus proyectos asignados y las invitaciones pendientes en DocAI.'} />

      <InvitacionesProyectos sesion={sesion} visualModerna />

      <SurfaceCard className="dash__card dash__actividad" aria-label="Tus proyectos" aria-busy={cargando}>
        <div className="dash__card-encabezado">
          <h2>
            <span className="dash__punto-brillante" />
            Tus proyectos
          </h2>
          <span className="dash__eyebrow">Recientes</span>
        </div>

        {error && <p className="inicio-usuario__error" role="alert">{error}</p>}

        {cargando ? (
          <p className="dash__invitacion-vacio">Cargando...</p>
        ) : proyectos.length ? (
          <ul className="dash__linea-tiempo">
            {proyectos.map((proyecto) => (
              <li key={proyecto.id} className="dash__evento">
                <span className="dash__punto-brillante dash__evento-punto" />
                <p className="dash__evento-texto">
                  <span className="dash__evento-fuerte">{proyecto.nombre}</span>
                  <ProyectoEstadoBadge estado={proyecto.estado} />
                </p>
                <span className="dash__evento-tiempo">
                  {proyecto.fecha_ultima_actividad
                    ? formatoRelativo(new Date(proyecto.fecha_ultima_actividad))
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dash__invitacion-vacio">Todavía no formas parte de ningún proyecto.</p>
        )}
      </SurfaceCard>
    </div>
  )
}
