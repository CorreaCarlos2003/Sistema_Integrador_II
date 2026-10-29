import { useEffect, useState } from 'react'
import Button from './ui/Button'

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new Error(typeof datos?.detail === 'string' ? datos.detail : 'No se pudo completar la acción')
  }
  return datos
}

function formatFechaCorta(iso) {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}

export default function InvitacionesProyectos({ sesion, visualModerna = false }) {
  const Control = visualModerna ? Button : 'button'
  const [invitaciones, setInvitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState(null)
  const [error, setError] = useState('')

  const cargarInvitaciones = async () => {
    const lista = await pedir(`/proyectos/invitaciones/${sesion.id}`)
    setInvitaciones(lista)
  }

  useEffect(() => {
    if (!sesion?.id) return
    cargarInvitaciones()
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [sesion?.id])

  const responderInvitacion = async (proyectoId, aceptar) => {
    setError('')
    setProcesandoId(proyectoId)
    try {
      await pedir(`/proyectos/${proyectoId}/usuarios/${sesion.id}/${aceptar ? 'aceptar' : 'rechazar'}`, {
        method: 'POST',
      })
      await cargarInvitaciones()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesandoId(null)
    }
  }

  const mostrar = cargando || invitaciones.length > 0
  if (!mostrar) return null

  return (
    <section className="dash__card dash__invitaciones-card">
      <div className="dash__card-encabezado">
        <h2>
          <span className="dash__punto-brillante" />
          Invitaciones a proyectos
        </h2>
        {invitaciones.length > 0 && (
          <span className="dash__badge dash__badge--alerta">
            {invitaciones.length} pendiente{invitaciones.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {error && <p className="dash__invitacion-error">{error}</p>}

      {cargando ? (
        <p className="dash__invitacion-vacio">Cargando invitaciones...</p>
      ) : (
        <ul className="dash__lista-invitaciones">
          {invitaciones.map((inv) => (
            <li key={inv.proyecto_id} className="dash__fila-invitacion">
              <div className="dash__invitacion-info">
                <strong>{inv.proyecto_nombre}</strong>
                <span>
                  {inv.rol_proyecto === 'RESPONSABLE' ? 'Responsable' : 'Miembro'}
                  {inv.cargo ? ` · ${inv.cargo}` : ''} · Invitado el {formatFechaCorta(inv.fecha_ingreso)}
                </span>
              </div>
              <div className="dash__invitacion-acciones">
                <Control
                  type="button"
                  className={visualModerna ? '' : 'dash__btn-aceptar'}
                  {...(visualModerna ? { variant: 'primary' } : {})}
                  disabled={procesandoId === inv.proyecto_id}
                  onClick={() => responderInvitacion(inv.proyecto_id, true)}
                >
                  Aceptar
                </Control>
                <Control
                  type="button"
                  className={visualModerna ? '' : 'dash__btn-cancelar'}
                  disabled={procesandoId === inv.proyecto_id}
                  onClick={() => responderInvitacion(inv.proyecto_id, false)}
                >
                  Cancelar solicitud
                </Control>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
