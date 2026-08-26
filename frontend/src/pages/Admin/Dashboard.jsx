import './Dashboard.css'
import {
  IconMas,
  IconChispa,
  IconCarpeta,
  IconDocumento,
  IconPdf,
  IconHoja,
  IconCampana,
  IconCheckCirculo,
} from '../../components/icons'

const ACTIVIDAD_RECIENTE = [
  {
    id: 1,
    nombre: 'Reporte_Financiero_Q3.pdf',
    proyecto: 'Finanzas Corp',
    actualizado: 'Actualizado hace 2h',
    estado: 'Análisis IA',
    tipo: 'pdf',
  },
  {
    id: 2,
    nombre: 'Contrato_Servicios_TechNova.docx',
    proyecto: 'Legal',
    actualizado: 'Actualizado ayer',
    estado: 'Borrador',
    tipo: 'doc',
  },
  {
    id: 3,
    nombre: 'Inventario_DataCenter_2024.xlsx',
    proyecto: 'IT Infra',
    actualizado: 'Actualizado hace 3 días',
    estado: 'Aprobado',
    tipo: 'hoja',
  },
]

const NOTIFICACIONES = [
  {
    id: 1,
    tipo: 'alerta',
    titulo: 'Permiso denegado',
    detalle: "Usuario 'Marta G.' intentó acceder a Carpeta Confidencial.",
    tiempo: 'Hace 10 min',
  },
  {
    id: 2,
    tipo: 'info',
    titulo: 'Extracción IA completada',
    detalle: 'Se extrajeron 15 entidades del Contrato TechNova.',
    tiempo: 'Hace 1 hora',
  },
]

const ICONO_TIPO = { pdf: IconPdf, doc: IconDocumento, hoja: IconHoja }
const CLASE_ESTADO = {
  'Análisis IA': 'dash__badge dash__badge--gris',
  Borrador: 'dash__badge dash__badge--azul',
  Aprobado: 'dash__badge dash__badge--verde',
}

export default function Dashboard({ sesion }) {
  const nombre = sesion?.nombre?.split(' ')[0] ?? 'Admin'

  return (
    <div className="dash">
      <div className="dash__encabezado">
        <div>
          <h1 className="dash__saludo">¡Hola, {nombre}!</h1>
          <p className="dash__subtitulo">Aquí tienes un resumen de la actividad reciente en DocuIntel.</p>
        </div>
        <div className="dash__acciones">
          <button className="dash__boton dash__boton--contorno" type="button">
            <IconMas size={16} /> Nuevo Proyecto
          </button>
          <button className="dash__boton dash__boton--oscuro" type="button">
            <IconChispa size={16} /> Consultar IA
          </button>
        </div>
      </div>

      <div className="dash__stats">
        <div className="dash__card dash__stat">
          <div className="dash__stat-fila">
            <span className="dash__stat-icono">
              <IconCarpeta />
            </span>
            <span className="dash__pastilla">+2 hoy</span>
          </div>
          <p className="dash__stat-etiqueta">Proyectos Activos</p>
          <p className="dash__stat-numero">8</p>
        </div>

        <div className="dash__card dash__stat">
          <div className="dash__stat-fila">
            <span className="dash__stat-icono">
              <IconDocumento />
            </span>
            <span className="dash__pastilla">+15 esta semana</span>
          </div>
          <p className="dash__stat-etiqueta">Documentos Totales</p>
          <p className="dash__stat-numero">124</p>
        </div>

        <div className="dash__card dash__stat dash__stat--oscuro">
          <div className="dash__stat-fila">
            <span className="dash__stat-icono dash__stat-icono--claro">
              <IconChispa />
            </span>
            <span className="dash__pastilla dash__pastilla--oscura">Alto uso</span>
          </div>
          <p className="dash__stat-etiqueta">Consultas IA hoy</p>
          <p className="dash__stat-numero">45</p>
        </div>
      </div>

      <div className="dash__grid">
        <section className="dash__card dash__actividad">
          <div className="dash__card-encabezado">
            <h2>Actividad Reciente</h2>
            <button type="button" className="dash__enlace">
              Ver todo
            </button>
          </div>

          <ul className="dash__lista">
            {ACTIVIDAD_RECIENTE.map((item) => {
              const Icono = ICONO_TIPO[item.tipo]
              return (
                <li key={item.id} className="dash__item">
                  <span className="dash__item-icono">
                    <Icono />
                  </span>
                  <div className="dash__item-info">
                    <strong>{item.nombre}</strong>
                    <span>
                      Proyecto: {item.proyecto} • {item.actualizado}
                    </span>
                  </div>
                  <span className={CLASE_ESTADO[item.estado]}>{item.estado}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="dash__columna">
          <section className="dash__card dash__notificaciones">
            <div className="dash__card-encabezado">
              <h2>
                <IconCampana size={18} /> Notificaciones
              </h2>
            </div>
            <ul className="dash__lista dash__lista--notif">
              {NOTIFICACIONES.map((n) => (
                <li key={n.id} className="dash__notif">
                  <span className={n.tipo === 'alerta' ? 'dash__punto dash__punto--rojo' : 'dash__punto dash__punto--azul'} />
                  <div>
                    <strong>{n.titulo}</strong>
                    <p>{n.detalle}</p>
                    <span className="dash__notif-tiempo">{n.tiempo}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="dash__card dash__estado">
            <span className="dash__estado-icono">
              <IconCheckCirculo />
            </span>
            <div>
              <strong>Estado del Sistema</strong>
              <p>Todos los servicios IA operativos</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
