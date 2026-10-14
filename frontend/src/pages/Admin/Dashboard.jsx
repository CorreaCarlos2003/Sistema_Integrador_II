import { useEffect, useState } from 'react'
import './Dashboard.css'
import {
  IconDiagnosticoIA,
  IconCarpetaMetrica,
  IconDocumentoMetrica,
  IconFlechaSubida,
  IconAdvertenciaTriangulo,
  IconFlechaDerecha,
  IconUsuarioMas,
  IconProyectoMas,
  IconLupaReportes,
  IconEngranajeRoles,
} from '../../components/icons'

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

const METRICAS = [
  {
    id: 'consultas',
    Icono: IconDiagnosticoIA,
    etiqueta: 'Diagnóstico',
    titulo: 'Consultas IA hoy',
    valor: '45',
    valorClase: 'dash__valor--oro',
    badge: 'Alto uso',
    badgeConPunto: true,
    delta: '+32.4%',
  },
  {
    id: 'proyectos',
    Icono: IconCarpetaMetrica,
    etiqueta: 'Entornos',
    titulo: 'Proyectos Activos',
    valor: '8',
    valorClase: 'dash__valor--oro',
    badge: '+2 hoy',
  },
  {
    id: 'documentos',
    Icono: IconDocumentoMetrica,
    etiqueta: 'Base documental',
    titulo: 'Documentos Totales',
    valor: '124',
    valorClase: 'dash__valor--oro',
    badge: '+15 esta semana',
  },
]

const ALERTAS = [
  { id: 1, texto: '2 usuarios pendientes de aprobación', accion: 'Revisar' },
  { id: 2, texto: '5 documentos con error en el procesamiento de IA', accion: 'Diagnosticar' },
  { id: 3, texto: '3 proyectos sin actividad en los últimos 30 días', accion: 'Archivar' },
]

const ACTIVIDAD_RECIENTE = [
  {
    id: 1,
    tiempo: 'hace 2 horas',
    partes: [
      { texto: 'Carlos Ramírez', clase: 'dash__evento-fuerte' },
      { texto: ' subió 3 documentos a ' },
      { texto: "'Proyecto Alpha'", clase: 'dash__evento-destacado' },
    ],
  },
  {
    id: 2,
    tiempo: 'hace 5 horas',
    partes: [
      { texto: 'Se creó el usuario ' },
      { texto: 'Ana Torres', clase: 'dash__evento-fuerte' },
      { texto: ' (Jefe de Proyectos)' },
    ],
  },
  {
    id: 3,
    tiempo: 'hace 1 día',
    partes: [
      { texto: 'Se modificaron los permisos del rol ' },
      { texto: 'Colaborador', clase: 'dash__evento-fuerte' },
    ],
  },
  {
    id: 4,
    tiempo: 'hace 1 día',
    partes: [
      { texto: 'Nuevo proyecto ' },
      { texto: "'Migración Cloud'", clase: 'dash__evento-destacado' },
      { texto: ' creado' },
    ],
  },
  {
    id: 5,
    tiempo: 'hace 2 días',
    partes: [
      { texto: 'Documento ' },
      { texto: "'Contrato_v2.pdf'", clase: 'dash__evento-fuerte' },
      { texto: ' procesado por IA' },
    ],
  },
]

const ACCESOS_RAPIDOS = [
  { id: 'usuario', Icono: IconUsuarioMas, texto: '+ Nuevo Usuario' },
  { id: 'proyecto', Icono: IconProyectoMas, texto: '+ Nuevo Proyecto' },
  { id: 'reportes', Icono: IconLupaReportes, texto: 'Ver Reportes' },
  { id: 'roles', Icono: IconEngranajeRoles, texto: 'Gestionar Roles' },
]

export default function Dashboard({ sesion }) {
  const nombre = sesion?.nombre?.split(' ')[0] ?? 'Admin'

  const [invitaciones, setInvitaciones] = useState([])
  const [cargandoInvitaciones, setCargandoInvitaciones] = useState(true)
  const [procesandoId, setProcesandoId] = useState(null)
  const [errorInvitaciones, setErrorInvitaciones] = useState('')

  const cargarInvitaciones = async () => {
    const lista = await pedir(`/proyectos/invitaciones/${sesion.id}`)
    setInvitaciones(lista)
  }

  useEffect(() => {
    if (!sesion?.id) return
    cargarInvitaciones()
      .catch((err) => setErrorInvitaciones(err.message))
      .finally(() => setCargandoInvitaciones(false))
  }, [sesion?.id])

  const responderInvitacion = async (proyectoId, aceptar) => {
    setErrorInvitaciones('')
    setProcesandoId(proyectoId)
    try {
      await pedir(`/proyectos/${proyectoId}/usuarios/${sesion.id}/${aceptar ? 'aceptar' : 'rechazar'}`, {
        method: 'POST',
      })
      await cargarInvitaciones()
    } catch (err) {
      setErrorInvitaciones(err.message)
    } finally {
      setProcesandoId(null)
    }
  }

  const mostrarInvitaciones = cargandoInvitaciones || invitaciones.length > 0

  return (
    <div className="dash">
      <div className="dash__encabezado">
        <h1 className="dash__saludo">¡Hola, {nombre}!</h1>
        <p className="dash__subtitulo">Aquí tienes un resumen de la actividad reciente en DocAI.</p>
      </div>

      {mostrarInvitaciones && (
        <section className="dash__card dash__invitaciones-card">
          <div className="dash__card-encabezado">
            <h2>
              <span className="dash__punto-brillante" />
              Invitaciones a proyectos
            </h2>
            {invitaciones.length > 0 && (
              <span className="dash__badge dash__badge--alerta">{invitaciones.length} pendiente{invitaciones.length === 1 ? '' : 's'}</span>
            )}
          </div>

          {errorInvitaciones && <p className="dash__invitacion-error">{errorInvitaciones}</p>}

          {cargandoInvitaciones ? (
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
                    <button
                      type="button"
                      className="dash__btn-aceptar"
                      disabled={procesandoId === inv.proyecto_id}
                      onClick={() => responderInvitacion(inv.proyecto_id, true)}
                    >
                      Aceptar
                    </button>
                    <button
                      type="button"
                      className="dash__btn-cancelar"
                      disabled={procesandoId === inv.proyecto_id}
                      onClick={() => responderInvitacion(inv.proyecto_id, false)}
                    >
                      Cancelar solicitud
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="dash__metricas">
        {METRICAS.map(({ id, Icono, etiqueta, titulo, valor, valorClase, badge, badgeConPunto, delta }) => (
          <div key={id} className="dash__card dash__metrica">
            <div className="dash__metrica-fila">
              <div className="dash__metrica-info">
                <span className="dash__metrica-icono">
                  <Icono />
                </span>
                <div>
                  <p className="dash__metrica-etiqueta">{etiqueta}</p>
                  <h3 className="dash__metrica-titulo">{titulo}</h3>
                </div>
              </div>
              <span className="dash__pastilla">
                {badgeConPunto && <span className="dash__pastilla-punto" />}
                {badge}
              </span>
            </div>
            <div className="dash__metrica-valor-fila">
              <span className={`dash__metrica-valor ${valorClase}`}>{valor}</span>
              {delta && (
                <span className="dash__metrica-delta">
                  <IconFlechaSubida /> {delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="dash__card dash__atencion">
        <div className="dash__atencion-encabezado">
          <span className="dash__atencion-icono">
            <IconAdvertenciaTriangulo />
          </span>
          <div>
            <div className="dash__atencion-titulo-fila">
              <h2>Requiere tu atención</h2>
              <span className="dash__badge dash__badge--alerta">{ALERTAS.length} alertas</span>
            </div>
            <p className="dash__atencion-subtitulo">Incidentes operativos y tareas pendientes</p>
          </div>
        </div>

        <ul className="dash__lista-alertas">
          {ALERTAS.map((alerta) => (
            <li key={alerta.id} className="dash__fila-alerta">
              <div className="dash__fila-alerta-info">
                <span className="dash__punto dash__punto--terracota" />
                <span>{alerta.texto}</span>
              </div>
              <button type="button" className="dash__enlace-accion">
                {alerta.accion} <IconFlechaDerecha />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="dash__grid">
        <section className="dash__card dash__actividad">
          <div className="dash__card-encabezado">
            <h2>
              <span className="dash__punto-brillante" />
              Actividad reciente
            </h2>
            <span className="dash__eyebrow">Historial</span>
          </div>

          <ul className="dash__linea-tiempo">
            {ACTIVIDAD_RECIENTE.map((evento) => (
              <li key={evento.id} className="dash__evento">
                <span className="dash__punto-brillante dash__evento-punto" />
                <p className="dash__evento-texto">
                  {evento.partes.map((parte, i) => (
                    <span key={i} className={parte.clase}>
                      {parte.texto}
                    </span>
                  ))}
                </p>
                <span className="dash__evento-tiempo">{evento.tiempo}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash__card dash__accesos">
          <div className="dash__card-encabezado">
            <h2>
              <span className="dash__punto-brillante" />
              Accesos rápidos
            </h2>
            <span className="dash__eyebrow">Operaciones</span>
          </div>

          <div className="dash__accesos-grid">
            {ACCESOS_RAPIDOS.map(({ id, Icono, texto }) => (
              <button key={id} type="button" className="dash__acceso">
                <Icono />
                <span>{texto}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
