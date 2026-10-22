import { useEffect, useState } from 'react'
import './Dashboard.css'
import InvitacionesProyectos from '../../components/InvitacionesProyectos'
import { formatoRelativo } from '../../utils/tiempo'
import {
  IconDiagnosticoIA,
  IconCarpetaMetrica,
  IconDocumentoMetrica,
  IconAdvertenciaTriangulo,
  IconFlechaDerecha,
} from '../../components/icons'

async function pedirJSON(ruta) {
  const respuesta = await fetch(ruta)
  if (!respuesta.ok) throw new Error('No se pudo cargar la información')
  return respuesta.json()
}

const METRICAS_BASE = [
  { id: 'consultas', Icono: IconDiagnosticoIA, etiqueta: 'Diagnóstico', titulo: 'Consultas IA hoy', campo: 'consultas_ia_hoy' },
  { id: 'proyectos', Icono: IconCarpetaMetrica, etiqueta: 'Entornos', titulo: 'Proyectos Activos', campo: 'proyectos_activos' },
  { id: 'documentos', Icono: IconDocumentoMetrica, etiqueta: 'Base documental', titulo: 'Documentos Totales', campo: 'documentos_totales' },
]

export default function Dashboard({ sesion }) {
  const nombre = sesion?.nombre?.split(' ')[0] ?? 'Admin'

  const [resumen, setResumen] = useState(null)
  const [actividad, setActividad] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setCargando(true)
    setError('')
    Promise.all([
      pedirJSON('/inicio/resumen'),
      pedirJSON('/historial?limit=5&page=1'),
    ])
      .then(([resumenData, historialData]) => {
        setResumen(resumenData)
        setActividad(historialData.items || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="dash">
      <div className="dash__encabezado">
        <h1 className="dash__saludo">¡Hola, {nombre}!</h1>
        <p className="dash__subtitulo">Aquí tienes un resumen de la actividad reciente en DocAI.</p>
      </div>

      <InvitacionesProyectos sesion={sesion} />

      {error && <p className="login__error">{error}</p>}

      <div className="dash__metricas">
        {METRICAS_BASE.map(({ id, Icono, etiqueta, titulo, campo }) => (
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
            </div>
            <div className="dash__metrica-valor-fila">
              <span className="dash__metrica-valor dash__valor--oro">
                {cargando ? '—' : resumen?.[campo] ?? 0}
              </span>
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
              {resumen?.alertas?.length > 0 && (
                <span className="dash__badge dash__badge--alerta">{resumen.alertas.length} alertas</span>
              )}
            </div>
            <p className="dash__atencion-subtitulo">Incidentes operativos y tareas pendientes</p>
          </div>
        </div>

        {cargando ? (
          <p className="dash__invitacion-vacio">Cargando...</p>
        ) : resumen?.alertas?.length ? (
          <ul className="dash__lista-alertas">
            {resumen.alertas.map((alerta) => (
              <li key={alerta.tipo} className="dash__fila-alerta">
                <div className="dash__fila-alerta-info">
                  <span className="dash__punto dash__punto--terracota" />
                  <span>{alerta.texto}</span>
                </div>
                <span className="dash__enlace-accion">
                  {alerta.accion} <IconFlechaDerecha />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dash__invitacion-vacio">Sin incidentes pendientes. Todo en orden.</p>
        )}
      </section>

      <section className="dash__card dash__actividad">
        <div className="dash__card-encabezado">
          <h2>
            <span className="dash__punto-brillante" />
            Actividad reciente
          </h2>
          <span className="dash__eyebrow">Historial</span>
        </div>

        {cargando ? (
          <p className="dash__invitacion-vacio">Cargando...</p>
        ) : actividad.length ? (
          <ul className="dash__linea-tiempo">
            {actividad.map((evento) => (
              <li key={evento.id} className="dash__evento">
                <span className="dash__punto-brillante dash__evento-punto" />
                <p className="dash__evento-texto">{evento.descripcion}</p>
                <span className="dash__evento-tiempo">{formatoRelativo(new Date(evento.fecha))}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dash__invitacion-vacio">Todavía no hay actividad registrada.</p>
        )}
      </section>
    </div>
  )
}
