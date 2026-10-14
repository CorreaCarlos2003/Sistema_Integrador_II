import { useEffect, useMemo, useState } from 'react'
import { getInitials, getAvatarColors } from '../../utils/avatarUtils'
import { actorHeaders } from '../../utils/actor'
import {
  IconNavProyectos,
  IconNavUsuarios,
  IconNavRoles,
  IconChispa,
  IconBuscar,
} from '../../components/icons'
import './Historial.css'

const POR_PAGINA = 10

const MODULOS = [
  { clave: 'Todos', etiqueta: 'Todos los módulos' },
  { clave: 'proyectos', etiqueta: 'Proyectos' },
  { clave: 'usuarios', etiqueta: 'Gestión de Usuarios' },
  { clave: 'roles', etiqueta: 'Roles y Permisos' },
  { clave: 'acceso', etiqueta: 'Acceso' },
  { clave: 'consulta_ia', etiqueta: 'Consulta IA' },
]

const TIPOS = [
  { clave: 'Todos', etiqueta: 'Todas las acciones' },
  { clave: 'creacion', etiqueta: 'Creación' },
  { clave: 'edicion', etiqueta: 'Edición' },
  { clave: 'eliminacion', etiqueta: 'Eliminación' },
  { clave: 'acceso', etiqueta: 'Acceso' },
  { clave: 'proceso', etiqueta: 'Proceso IA' },
  { clave: 'consulta_ia', etiqueta: 'Consulta IA' },
  { clave: 'alerta', etiqueta: 'Alerta' },
]

const ETIQUETA_MODULO = Object.fromEntries(MODULOS.map((m) => [m.clave, m.etiqueta]))

function formatFechaISO(d) {
  return d.toISOString().slice(0, 10)
}

function rangoPorDefecto() {
  const hasta = new Date()
  const desde = new Date()
  desde.setDate(desde.getDate() - 29)
  return { desde: formatFechaISO(desde), hasta: formatFechaISO(hasta) }
}

function etiquetaDia(fechaISO) {
  const fecha = new Date(fechaISO)
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(hoy.getDate() - 1)

  const mismoDia = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (mismoDia(fecha, hoy)) return `HOY — ${fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`
  if (mismoDia(fecha, ayer)) return `AYER — ${fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
}

function formatHora(fechaISO) {
  const fecha = new Date(fechaISO)
  return fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function colorPorTipo(tipo) {
  switch (tipo) {
    case 'eliminacion':
      return 'historial__dot--rojo'
    case 'acceso':
      return 'historial__dot--gris'
    case 'proceso':
      return 'historial__dot--negro'
    case 'alerta':
      return 'historial__dot--ambar'
    default:
      return 'historial__dot--teal'
  }
}

const IconAcceso = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

function IconModulo({ modulo, ...props }) {
  if (modulo === 'proyectos') return <IconNavProyectos {...props} />
  if (modulo === 'usuarios') return <IconNavUsuarios {...props} />
  if (modulo === 'roles') return <IconNavRoles {...props} />
  if (modulo === 'consulta_ia') return <IconChispa {...props} />
  if (modulo === 'acceso') return <IconAcceso {...props} />
  return <IconNavProyectos {...props} />
}

const IconExportar = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
)

const IconLimpiar = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
)

const IconChevronDown = (p) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

async function pedir(ruta) {
  const respuesta = await fetch(ruta, { headers: { ...actorHeaders() } })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new Error(typeof datos?.detail === 'string' ? datos.detail : 'No se pudo cargar el historial')
  }
  return datos
}

export default function Historial() {
  const [eventos, setEventos] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [expandidoId, setExpandidoId] = useState(null)
  const [usuarios, setUsuarios] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [modulo, setModulo] = useState('Todos')
  const [tipo, setTipo] = useState('Todos')
  const [usuarioId, setUsuarioId] = useState('Todos')
  const [{ desde, hasta }, setRango] = useState(rangoPorDefecto)

  useEffect(() => {
    pedir('/usuarios')
      .then(setUsuarios)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError('')

    const params = new URLSearchParams({ page: String(pagina), limit: String(POR_PAGINA) })
    if (busqueda.trim()) params.set('busqueda', busqueda.trim())
    if (modulo !== 'Todos') params.set('modulo', modulo)
    if (tipo !== 'Todos') params.set('tipo', tipo)
    if (usuarioId !== 'Todos') params.set('usuario_id', usuarioId)
    if (desde) params.set('desde', `${desde}T00:00:00`)
    if (hasta) params.set('hasta', `${hasta}T23:59:59`)

    pedir(`/historial?${params.toString()}`)
      .then((datos) => {
        if (cancelado) return
        setEventos(datos.items)
        setTotal(datos.total)
        setTotalPaginas(datos.total_pages)
      })
      .catch((err) => !cancelado && setError(err.message))
      .finally(() => !cancelado && setCargando(false))

    return () => {
      cancelado = true
    }
  }, [busqueda, modulo, tipo, usuarioId, desde, hasta, pagina])

  const grupos = useMemo(() => {
    const porDia = new Map()
    for (const evento of eventos) {
      const clave = etiquetaDia(evento.fecha)
      if (!porDia.has(clave)) porDia.set(clave, [])
      porDia.get(clave).push(evento)
    }
    return Array.from(porDia.entries())
  }, [eventos])

  const limpiarFiltros = () => {
    setBusqueda('')
    setModulo('Todos')
    setTipo('Todos')
    setUsuarioId('Todos')
    setRango(rangoPorDefecto())
    setPagina(1)
  }

  const exportar = () => {
    const params = new URLSearchParams()
    if (busqueda.trim()) params.set('busqueda', busqueda.trim())
    if (modulo !== 'Todos') params.set('modulo', modulo)
    if (tipo !== 'Todos') params.set('tipo', tipo)
    if (usuarioId !== 'Todos') params.set('usuario_id', usuarioId)
    if (desde) params.set('desde', `${desde}T00:00:00`)
    if (hasta) params.set('hasta', `${hasta}T23:59:59`)

    const enlace = document.createElement('a')
    enlace.href = `/historial/exportar?${params.toString()}`
    enlace.download = 'historial_docai.csv'
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
  }

  return (
    <div className="historial">
      <div className="historial__header">
        <div>
          <h1 className="historial__titulo">Historial</h1>
          <p className="historial__subtitulo">
            Registro completo y auditable de la actividad del sistema con sello criptográfico.
          </p>
        </div>
        <button type="button" className="historial__btn-exportar" onClick={exportar}>
          <IconExportar />
          Exportar registro
        </button>
      </div>

      <div className="historial__filtros">
        <div className="historial__buscador">
          <IconBuscar size={14} className="historial__buscador-icono" />
          <input
            type="text"
            placeholder="Buscar por usuario, proyecto..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
          />
        </div>

        <div className="historial__select-wrap">
          <select value={modulo} onChange={(e) => { setModulo(e.target.value); setPagina(1) }}>
            {MODULOS.map((m) => (
              <option key={m.clave} value={m.clave}>{m.etiqueta}</option>
            ))}
          </select>
          <IconChevronDown className="historial__select-icono" />
        </div>

        <div className="historial__select-wrap">
          <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1) }}>
            {TIPOS.map((t) => (
              <option key={t.clave} value={t.clave}>{t.etiqueta}</option>
            ))}
          </select>
          <IconChevronDown className="historial__select-icono" />
        </div>

        <div className="historial__select-wrap">
          <select value={usuarioId} onChange={(e) => { setUsuarioId(e.target.value); setPagina(1) }}>
            <option value="Todos">Todos los usuarios</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
          <IconChevronDown className="historial__select-icono" />
        </div>

        <div className="historial__rango">
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => { setRango((r) => ({ ...r, desde: e.target.value })); setPagina(1) }}
          />
          <span>—</span>
          <input
            type="date"
            value={hasta}
            min={desde}
            onChange={(e) => { setRango((r) => ({ ...r, hasta: e.target.value })); setPagina(1) }}
          />
        </div>
      </div>

      <div className="historial__resumen">
        <span className="historial__registros">
          REGISTROS IDENTIFICADOS: <strong>{total}</strong> evento{total === 1 ? '' : 's'} registrado{total === 1 ? '' : 's'}
        </span>
        <button type="button" className="historial__limpiar" onClick={limpiarFiltros}>
          <IconLimpiar />
          Limpiar filtros
        </button>
      </div>

      {error && <div className="historial__error">{error}</div>}

      <div className="historial__lista">
        {cargando ? (
          <div className="historial__vacio">Cargando historial...</div>
        ) : grupos.length === 0 ? (
          <div className="historial__vacio">No se encontraron eventos con los filtros seleccionados.</div>
        ) : (
          grupos.map(([etiqueta, items]) => (
            <div key={etiqueta} className="historial__grupo">
              <div className="historial__grupo-titulo">
                {etiqueta}
              </div>
              {items.map((evento) => {
                const { background, color } = getAvatarColors(evento.actor_nombre)
                const expandido = expandidoId === evento.id
                return (
                  <div key={evento.id} className="historial__fila">
                    <span className={`historial__dot ${colorPorTipo(evento.tipo)}`} />
                    <span className="historial__avatar" style={{ backgroundColor: background, color }}>
                      {getInitials(evento.actor_nombre)}
                    </span>
                    <div className="historial__contenido">
                      <div className="historial__linea1">
                        <span className="historial__descripcion">{evento.descripcion}</span>
                        <span className="historial__modulo-tag">
                          <IconModulo modulo={evento.modulo} size={11} />
                          {ETIQUETA_MODULO[evento.modulo] ?? evento.modulo}
                        </span>
                      </div>
                      <div className="historial__linea2">
                        {evento.referencia && <span>{evento.referencia}</span>}
                        <span>{formatHora(evento.fecha)} hrs</span>
                        {evento.duracion_ms != null && <span>{(evento.duracion_ms / 1000).toFixed(1)}s</span>}
                      </div>
                      {expandido && (
                        <div className="historial__detalle">
                          <span><strong>Actor:</strong> {evento.actor_nombre} {evento.actor_rol ? `(${evento.actor_rol})` : ''}</span>
                          <span><strong>Módulo:</strong> {ETIQUETA_MODULO[evento.modulo] ?? evento.modulo}</span>
                          <span><strong>Tipo:</strong> {evento.tipo}</span>
                          {evento.proyecto_id && <span><strong>Proyecto ID:</strong> {evento.proyecto_id}</span>}
                          <span><strong>Fecha completa:</strong> {new Date(evento.fecha).toLocaleString('es-PE')}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="historial__btn-detalle"
                      onClick={() => setExpandidoId(expandido ? null : evento.id)}
                    >
                      <IconBuscar size={12} />
                      {expandido ? 'Ocultar' : 'Ver detalle'}
                    </button>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="historial__pie">
          <span className="historial__pie-info">
            Mostrando página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
          </span>
          <div className="historial__paginacion">
            <button type="button" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>&lt;</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
              .map((n, idx, arr) => (
                <span key={n} style={{ display: 'contents' }}>
                  {idx > 0 && arr[idx - 1] !== n - 1 && <span className="historial__paginacion-puntos">…</span>}
                  <button
                    type="button"
                    className={n === pagina ? 'historial__pagina-activa' : ''}
                    onClick={() => setPagina(n)}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button type="button" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}>&gt;</button>
          </div>
        </div>
      )}
    </div>
  )
}
