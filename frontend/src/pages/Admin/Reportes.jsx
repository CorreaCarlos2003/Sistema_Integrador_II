import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { actorHeaders } from '../../utils/actor'
import './Reportes.css'

const COLOR_TEAL = '#2f6b63'
const COLOR_ORO = '#d9b567'
const COLOR_OSCURO = '#2b2622'
const COLOR_TERRACOTA = '#ab3515'

const COLORES_ROL = { Colaborador: COLOR_TEAL, 'Jefe de Proyecto': COLOR_ORO, Administrador: COLOR_OSCURO }

function formatFechaISO(d) {
  return d.toISOString().slice(0, 10)
}

function rangoPorDefecto() {
  const hasta = new Date()
  const desde = new Date()
  desde.setDate(desde.getDate() - 29)
  return { desde: formatFechaISO(desde), hasta: formatFechaISO(hasta) }
}

function formatFechaCorta(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).replace('.', '')
}

function formatFechaHora(iso) {
  if (!iso) return 'Nunca'
  const fecha = new Date(iso)
  const diffMs = Date.now() - fecha.getTime()
  const horas = diffMs / 3600000
  if (horas < 1) return 'hace minutos'
  if (horas < 24) return `hace ${Math.floor(horas)} hora${Math.floor(horas) === 1 ? '' : 's'}`
  const dias = Math.floor(horas / 24)
  return `hace ${dias} día${dias === 1 ? '' : 's'}`
}

async function pedir(ruta) {
  const respuesta = await fetch(ruta, { headers: { ...actorHeaders() } })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new Error(typeof datos?.detail === 'string' ? datos.detail : 'No se pudo cargar el reporte')
  }
  return datos
}

const IconExportar = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
)

const IconChevronDown = (p) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

function TarjetaStat({ etiqueta, valor, delta }) {
  return (
    <div className="reportes__stat">
      <span className="reportes__stat-etiqueta">{etiqueta}</span>
      <div className="reportes__stat-valor">{valor}</div>
      <span className="reportes__stat-delta">{delta}</span>
    </div>
  )
}

function Donut({ datos, centroValor, centroEtiqueta }) {
  return (
    <div className="reportes__donut-fila">
      <div className="reportes__donut-wrap">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={datos}
              dataKey="valor"
              nameKey="nombre"
              innerRadius={48}
              outerRadius={65}
              paddingAngle={datos.length > 1 ? 2 : 0}
              stroke="none"
            >
              {datos.map((d) => (
                <Cell key={d.nombre} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="reportes__donut-centro">
          <strong>{centroValor}</strong>
          <span>{centroEtiqueta}</span>
        </div>
      </div>
      <div className="reportes__donut-leyenda">
        {datos.map((d) => (
          <div key={d.nombre} className="reportes__leyenda-item">
            <span className="reportes__leyenda-dot" style={{ background: d.color }} />
            <span className="reportes__leyenda-nombre">{d.nombre}</span>
            <span className="reportes__leyenda-pct">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Reportes() {
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [{ desde, hasta }, setRango] = useState(rangoPorDefecto)
  const [filtroProyecto, setFiltroProyecto] = useState('Todos')
  const [filtroUsuario, setFiltroUsuario] = useState('Todos')

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError('')
    const params = new URLSearchParams({ desde, hasta })
    pedir(`/reportes/resumen?${params.toString()}`)
      .then((datos) => !cancelado && setResumen(datos))
      .catch((err) => !cancelado && setError(err.message))
      .finally(() => !cancelado && setCargando(false))
    return () => {
      cancelado = true
    }
  }, [desde, hasta])

  const exportar = () => {
    const params = new URLSearchParams({ desde, hasta })
    const enlace = document.createElement('a')
    enlace.href = `/reportes/exportar?${params.toString()}`
    enlace.download = 'reporte_docai.csv'
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
  }

  const proyectosDisponibles = useMemo(() => {
    if (!resumen) return []
    const unicos = new Map()
    resumen.uso_ia.forEach((u) => {
      if (u.proyecto_id) unicos.set(u.proyecto_id, u.proyecto_nombre)
    })
    return Array.from(unicos.entries())
  }, [resumen])

  const usuariosDisponibles = useMemo(() => {
    if (!resumen) return []
    const unicos = new Map()
    resumen.uso_ia.forEach((u) => unicos.set(u.usuario_id, u.nombre))
    return Array.from(unicos.entries())
  }, [resumen])

  const usoFiltrado = useMemo(() => {
    if (!resumen) return []
    return resumen.uso_ia.filter((u) => {
      const okProyecto = filtroProyecto === 'Todos' || String(u.proyecto_id) === filtroProyecto
      const okUsuario = filtroUsuario === 'Todos' || String(u.usuario_id) === filtroUsuario
      return okProyecto && okUsuario
    })
  }, [resumen, filtroProyecto, filtroUsuario])

  const datosRol = useMemo(() => {
    if (!resumen) return []
    return resumen.actividad_por_rol.map((r) => ({
      nombre: r.rol,
      valor: r.total,
      pct: r.porcentaje,
      color: COLORES_ROL[r.rol] || COLOR_TEAL,
    }))
  }, [resumen])

  const datosEstadoDocs = useMemo(() => {
    if (!resumen) return []
    const e = resumen.estado_documentos
    const filas = [
      { nombre: 'Indexados correctamente', valor: e.indexados, color: COLOR_TEAL },
      { nombre: 'En proceso', valor: e.en_proceso, color: COLOR_ORO },
      { nombre: 'Con error', valor: e.con_error, color: COLOR_TERRACOTA },
    ]
    const total = filas.reduce((s, f) => s + f.valor, 0) || 1
    return filas.map((f) => ({ ...f, pct: Math.round((f.valor / total) * 100) }))
  }, [resumen])

  const maxDocsProyecto = useMemo(
    () => Math.max(1, ...(resumen?.documentos_por_proyecto.map((d) => d.total) ?? [1])),
    [resumen]
  )

  const maxTop = useMemo(
    () => Math.max(1, ...(resumen?.top_usuarios_ia.map((u) => u.consultas) ?? [1])),
    [resumen]
  )

  const totalDocumentos = resumen?.documentos_por_proyecto.reduce((s, d) => s + d.total, 0) ?? 0
  const totalSesiones = resumen?.actividad_por_rol.reduce((s, r) => s + r.total, 0) ?? 0

  return (
    <div className="reportes">
      <div className="reportes__header">
        <div>
          <h1 className="reportes__titulo">Reportes</h1>
          <p className="reportes__subtitulo">Analiza el desempeño del sistema y exporta reportes para revisión o auditoría.</p>
        </div>
        <div className="reportes__header-acciones">
          <div className="reportes__rango">
            <input type="date" value={desde} max={hasta} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} />
            <span>—</span>
            <input type="date" value={hasta} min={desde} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} />
          </div>
          <button type="button" className="reportes__btn-exportar" onClick={exportar}>
            <IconExportar />
            Exportar reporte
          </button>
        </div>
      </div>

      {error && <div className="reportes__error">{error}</div>}

      {cargando || !resumen ? (
        <div className="reportes__vacio">Cargando métricas...</div>
      ) : (
        <>
          <div className="reportes__stats">
            <TarjetaStat etiqueta="CONSULTAS IA TOTALES" valor={resumen.consultas_ia_totales.valor_formateado} delta={resumen.consultas_ia_totales.delta_texto} />
            <TarjetaStat etiqueta="DOCUMENTOS PROCESADOS" valor={resumen.documentos_procesados.valor_formateado} delta={resumen.documentos_procesados.delta_texto} />
            <TarjetaStat etiqueta="USUARIOS ACTIVOS" valor={resumen.usuarios_activos.valor_formateado} delta={resumen.usuarios_activos.delta_texto} />
            <TarjetaStat etiqueta="TIEMPO PROM. RESPUESTA IA" valor={resumen.tiempo_prom_respuesta_ia.valor_formateado} delta={resumen.tiempo_prom_respuesta_ia.delta_texto} />
          </div>

          <div className="reportes__fila-dos">
            <div className="reportes__panel">
              <div className="reportes__panel-header">
                <div>
                  <h2>Consultas IA por día</h2>
                  <p>Volumen diario de inferencia documental</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={resumen.serie_consultas_ia} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--borde)" />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={formatFechaCorta}
                    tick={{ fontSize: 10, fill: 'var(--texto-tenue)' }}
                    axisLine={{ stroke: 'var(--borde-fuerte)' }}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(resumen.serie_consultas_ia.length / 7))}
                  />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--texto-tenue)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={formatFechaCorta}
                    contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid var(--borde-fuerte)' }}
                  />
                  <Line type="monotone" dataKey="valor" stroke={COLOR_TEAL} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="reportes__panel">
              <div className="reportes__panel-header">
                <div>
                  <h2>Documentos por proyecto</h2>
                  <p>Distribución de carga activa</p>
                </div>
                <span className="reportes__panel-total">Total: {totalDocumentos} expedientes</span>
              </div>
              <div className="reportes__barras">
                {resumen.documentos_por_proyecto.length === 0 ? (
                  <p className="reportes__sin-datos">Aún no hay documentos cargados.</p>
                ) : (
                  resumen.documentos_por_proyecto.map((d) => (
                    <div key={d.proyecto_id} className="reportes__barra-fila">
                      <div className="reportes__barra-etiqueta">
                        <span>{d.nombre}</span>
                        <span>{d.total} exp. ({d.porcentaje}%)</span>
                      </div>
                      <div className="reportes__barra-pista">
                        <div className="reportes__barra-relleno" style={{ width: `${(d.total / maxDocsProyecto) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="reportes__fila-dos">
            <div className="reportes__panel">
              <div className="reportes__panel-header">
                <div>
                  <h2>Actividad de usuarios por rol</h2>
                  <p>Distribución de interacciones registradas</p>
                </div>
              </div>
              {datosRol.length === 0 ? (
                <p className="reportes__sin-datos">Sin actividad registrada en este periodo.</p>
              ) : (
                <Donut datos={datosRol} centroValor="100%" centroEtiqueta="SESIONES" />
              )}
              <span className="reportes__pie-nota">Total eventos auditados: {totalSesiones.toLocaleString()}</span>
            </div>

            <div className="reportes__panel">
              <div className="reportes__panel-header">
                <div>
                  <h2>Estado de documentos</h2>
                  <p>Integridad de ingesta y procesamiento OCR/IA</p>
                </div>
              </div>
              <Donut
                datos={datosEstadoDocs}
                centroValor={`${resumen.estado_documentos.tasa_exito_pct}%`}
                centroEtiqueta="EXITOSO"
              />
              <span className="reportes__pie-nota">
                Documentos indexados: {resumen.estado_documentos.indexados} · Con error: {resumen.estado_documentos.con_error}
              </span>
            </div>
          </div>

          <div className="reportes__panel">
            <div className="reportes__panel-header">
              <div>
                <h2>Uso de IA por Colaborador y Proyecto</h2>
                <p>Detalle de consultas de IA realizadas por cada usuario dentro de sus proyectos.</p>
              </div>
              <div className="reportes__filtros-tabla">
                <div className="reportes__select-wrap">
                  <select value={filtroProyecto} onChange={(e) => setFiltroProyecto(e.target.value)}>
                    <option value="Todos">Proyecto: Todos</option>
                    {proyectosDisponibles.map(([id, nombre]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                  </select>
                  <IconChevronDown className="reportes__select-icono" />
                </div>
                <div className="reportes__select-wrap">
                  <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}>
                    <option value="Todos">Usuario: Todos</option>
                    {usuariosDisponibles.map(([id, nombre]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                  </select>
                  <IconChevronDown className="reportes__select-icono" />
                </div>
              </div>
            </div>

            <div className="reportes__tabla-wrap">
              <table className="reportes__tabla">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Proyecto</th>
                    <th>Consultas IA</th>
                    <th>Última consulta</th>
                    <th>Promedio diario</th>
                  </tr>
                </thead>
                <tbody>
                  {usoFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="reportes__tabla-vacio">Sin consultas de IA en este periodo.</td>
                    </tr>
                  ) : (
                    usoFiltrado.map((u) => (
                      <tr key={`${u.usuario_id}-${u.proyecto_id}`}>
                        <td>
                          <div className="reportes__usuario-celda">
                            <strong>{u.nombre}</strong>
                            <span>{u.correo}</span>
                          </div>
                        </td>
                        <td><span className="reportes__badge-rol">{u.rol}</span></td>
                        <td>{u.proyecto_nombre ?? '—'}</td>
                        <td className="reportes__valor-fuerte">{u.consultas} consultas</td>
                        <td className="reportes__tenue">{formatFechaHora(u.ultima_consulta)}</td>
                        <td className="reportes__tenue">{u.promedio_diario}/día</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="reportes__panel">
            <div className="reportes__panel-header">
              <div>
                <h2>Top 5 usuarios por consultas IA</h2>
                <p>Distribución comparativa ordenada por volumen de inferencia</p>
              </div>
              <span className="reportes__panel-total">
                Total Top 5: {resumen.top_usuarios_ia.reduce((s, u) => s + u.consultas, 0)}
              </span>
            </div>
            <div className="reportes__barras">
              {resumen.top_usuarios_ia.length === 0 ? (
                <p className="reportes__sin-datos">Aún no hay consultas de IA registradas.</p>
              ) : (
                resumen.top_usuarios_ia.map((u) => (
                  <div key={u.usuario_id} className="reportes__barra-fila">
                    <div className="reportes__barra-etiqueta">
                      <span>{u.nombre}</span>
                      <span>{u.consultas} consultas</span>
                    </div>
                    <div className="reportes__barra-pista">
                      <div className="reportes__barra-relleno reportes__barra-relleno--oro" style={{ width: `${(u.consultas / maxTop) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
