import { useEffect, useState } from 'react'
import '../Admin/Dashboard.css'
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
    <div className="dash">
      <div className="dash__encabezado">
        <h1 className="dash__saludo">¡Hola, {nombre}!</h1>
        <p className="dash__subtitulo">Aquí tienes un resumen de tus proyectos en DocAI.</p>
      </div>

      <InvitacionesProyectos sesion={sesion} />

      <section className="dash__card dash__actividad">
        <div className="dash__card-encabezado">
          <h2>
            <span className="dash__punto-brillante" />
            Tus proyectos
          </h2>
          <span className="dash__eyebrow">Recientes</span>
        </div>

        {error && <p className="login__error">{error}</p>}

        {cargando ? (
          <p className="dash__invitacion-vacio">Cargando...</p>
        ) : proyectos.length ? (
          <ul className="dash__linea-tiempo">
            {proyectos.map((proyecto) => (
              <li key={proyecto.id} className="dash__evento">
                <span className="dash__punto-brillante dash__evento-punto" />
                <p className="dash__evento-texto">
                  <span className="dash__evento-fuerte">{proyecto.nombre}</span>
                  {' · '}
                  {proyecto.estado}
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
      </section>
    </div>
  )
}
