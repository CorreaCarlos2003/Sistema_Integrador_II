import { useEffect, useMemo, useState } from 'react'
import { actorHeaders } from '../../utils/actor'
import { IconBuscar } from '../../components/icons'
import PageHeader from '../../components/ui/PageHeader'
import SurfaceCard from '../../components/ui/SurfaceCard'
import Button from '../../components/ui/Button'
import HistorialListado from './components/HistorialListado'
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
  const [recarga, setRecarga] = useState(0)
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
  }, [busqueda, modulo, tipo, usuarioId, desde, hasta, pagina, recarga])

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
    <div className="historial historial--modern" data-docai-layout="modern">
      <PageHeader title="Historial" description="Consulta la actividad del sistema y sus registros por usuario, módulo y fecha."
        actions={<Button onClick={exportar}><IconExportar />Exportar registro</Button>} />

      <SurfaceCard className="historial__filtros" aria-label="Filtros del historial">
        <div className="historial__buscador"><label htmlFor="historial-busqueda">Buscar actividad</label>
          <IconBuscar size={14} className="historial__buscador-icono" />
          <input
            type="text"
            id="historial-busqueda" aria-label="Buscar en el historial"
            placeholder="Buscar por usuario, proyecto..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
          />
        </div>

        <div className="historial__select-wrap">
          <label htmlFor="historial-modulo">Módulo</label>
          <select id="historial-modulo" aria-label="Módulo" value={modulo} onChange={(e) => { setModulo(e.target.value); setPagina(1) }}>
            {MODULOS.map((m) => (
              <option key={m.clave} value={m.clave}>{m.etiqueta}</option>
            ))}
          </select>
          <IconChevronDown className="historial__select-icono" />
        </div>

        <div className="historial__select-wrap">
          <label htmlFor="historial-tipo">Tipo de acción</label>
          <select id="historial-tipo" aria-label="Tipo de acción" value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1) }}>
            {TIPOS.map((t) => (
              <option key={t.clave} value={t.clave}>{t.etiqueta}</option>
            ))}
          </select>
          <IconChevronDown className="historial__select-icono" />
        </div>

        <div className="historial__select-wrap">
          <label htmlFor="historial-usuario">Usuario</label>
          <select id="historial-usuario" aria-label="Usuario" value={usuarioId} onChange={(e) => { setUsuarioId(e.target.value); setPagina(1) }}>
            <option value="Todos">Todos los usuarios</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
          <IconChevronDown className="historial__select-icono" />
        </div>

        <div className="historial__rango"><label htmlFor="historial-desde">Desde</label>
          <input
            type="date"
            id="historial-desde" aria-label="Desde"
            value={desde}
            max={hasta}
            onChange={(e) => { setRango((r) => ({ ...r, desde: e.target.value })); setPagina(1) }}
          />
          <label htmlFor="historial-hasta">Hasta</label>
          <input
            type="date"
            id="historial-hasta" aria-label="Hasta"
            value={hasta}
            min={desde}
            onChange={(e) => { setRango((r) => ({ ...r, hasta: e.target.value })); setPagina(1) }}
          />
        </div>
      </SurfaceCard>

      <div className="historial__resumen">
        <span className="historial__registros">
          Actividad registrada: <strong>{total}</strong> evento{total === 1 ? '' : 's'} registrado{total === 1 ? '' : 's'}
        </span>
        <Button type="button" className="historial__limpiar" onClick={limpiarFiltros}>
          <IconLimpiar />
          Limpiar filtros
        </Button>
      </div>


      <SurfaceCard className="historial__lista" aria-label="Registro de actividad" aria-busy={cargando}>
        {cargando ? (
          <div className="historial__vacio">Cargando historial...</div>
        ) : error ? (
          <div className="historial__vacio"><p className="historial__error" role="alert">{error}</p><Button onClick={() => setRecarga((n) => n + 1)}>Reintentar</Button></div>
        ) : grupos.length === 0 ? (
          <div className="historial__vacio">No se encontraron eventos con los filtros seleccionados.</div>
        ) : (
          <HistorialListado grupos={grupos} expandidoId={expandidoId} onExpandir={setExpandidoId} />
        )}
      </SurfaceCard>

      {!cargando && !error && totalPaginas > 1 && (
        <div className="historial__pie">
          <span className="historial__pie-info">
            Mostrando página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
          </span>
          <div className="historial__paginacion">
            <Button type="button" aria-label="Página anterior" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>&lt;</Button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
              .map((n, idx, arr) => (
                <span key={n} style={{ display: 'contents' }}>
                  {idx > 0 && arr[idx - 1] !== n - 1 && <span className="historial__paginacion-puntos">…</span>}
                  <Button
                    type="button"
                    aria-label={`Página ${n}`} aria-current={n === pagina ? 'page' : undefined}
                    className={n === pagina ? 'historial__pagina-activa' : ''}
                    onClick={() => setPagina(n)}
                  >
                    {n}
                  </Button>
                </span>
              ))}
            <Button type="button" aria-label="Página siguiente" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}>&gt;</Button>
          </div>
        </div>
      )}
    </div>
  )
}
