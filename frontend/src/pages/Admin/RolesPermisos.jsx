import { useEffect, useMemo, useState } from 'react'
import { getInitials, getAvatarColors } from '../../utils/avatarUtils'
import { actorHeaders } from '../../utils/actor'
import {
  IconNavInicio,
  IconNavProyectos,
  IconNavUsuarios,
  IconNavRoles,
  IconNavHistorial,
  IconNavReportes,
  IconUsuarios,
  IconCarpeta,
} from '../../components/icons'
import PageHeader from '../../components/ui/PageHeader'
import SurfaceCard from '../../components/ui/SurfaceCard'
import Button from '../../components/ui/Button'
import './RolesPermisos.css'

const ROLES_GLOBALES = [
  { clave: 'Administrador', etiqueta: 'Administrador' },
  { clave: 'Jefe de Proyecto', etiqueta: 'Jefe de Proyectos' },
  { clave: 'Colaborador', etiqueta: 'Colaborador' },
]

const ICONOS_MODULO = {
  inicio: IconNavInicio,
  proyectos: IconNavProyectos,
  usuarios: IconNavUsuarios,
  roles: IconNavRoles,
  historial: IconNavHistorial,
  reportes: IconNavReportes,
}

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    headers: { 'Content-Type': 'application/json', ...actorHeaders() },
    ...opciones,
  })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new Error(typeof datos?.detail === 'string' ? datos.detail : 'No se pudo completar la acción')
  }
  return datos
}

function calcularEstadoModulo(modulo) {
  if (!modulo.ver) return 'Módulo no asignado a este rol'
  if (modulo.crear && modulo.editar && modulo.eliminar) return 'Acceso total al módulo'
  if (modulo.crear || modulo.editar || modulo.eliminar) return 'Edición y gestión habilitada'
  return modulo.clave === 'inicio' ? 'Solo lectura' : 'Solo consulta'
}

function formatSincronizacion(fecha) {
  if (!fecha) return '—'
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mes = fecha.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '').toUpperCase()
  const hh = String(fecha.getHours()).padStart(2, '0')
  const mi = String(fecha.getMinutes()).padStart(2, '0')
  const ss = String(fecha.getSeconds()).padStart(2, '0')
  return `${dd} ${mes} ${fecha.getFullYear()} • ${hh}:${mi}:${ss}`
}

const IconEscudo = (p) => (
  <svg width={16} height={18} viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" {...p}>
    <path d="M8 1 1.5 3.5v5c0 4.2 2.8 7.4 6.5 8.5 3.7-1.1 6.5-4.3 6.5-8.5v-5L8 1Z" />
  </svg>
)

const IconCarpetaCheck = (p) => (
  <svg width={18} height={14} viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" {...p}>
    <path d="M1 3a1 1 0 0 1 1-1h4.5l1.5 1.5H16a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3Z" />
    <path d="m6.5 8.2 1.6 1.6L12 6" />
  </svg>
)

const IconCandado = (p) => (
  <svg width={13} height={16} viewBox="0 0 13 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" {...p}>
    <rect x="1" y="7" width="11" height="8" rx="1.3" />
    <path d="M3.3 7V4.5a3.2 3.2 0 0 1 6.4 0V7" />
  </svg>
)

const IconGrid = (p) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor" {...p}>
    <rect x="0" y="0" width="7" height="7" rx="1" />
    <rect x="9" y="0" width="7" height="7" rx="1" />
    <rect x="0" y="9" width="7" height="7" rx="1" />
    <rect x="9" y="9" width="7" height="7" rx="1" />
  </svg>
)

const IconGuardar = (p) => (
  <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" {...p}>
    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h7L13 4.5v8A1.5 1.5 0 0 1 11.5 14h-9A1.5 1.5 0 0 1 1 12.5v-10Z" />
    <path d="M4 1v3.5h5V1" />
    <path d="M3.5 8.5h7V14h-7z" />
  </svg>
)

const IconChevronDown = (p) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      className={`roles__toggle ${checked ? 'roles__toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="roles__toggle-dot" />
    </button>
  )
}

export default function RolesPermisos() {
  const [tab, setTab] = useState('globales')
  const [error, setError] = useState('')

  // --- Permisos globales ---
  const [rolGlobal, setRolGlobal] = useState('Jefe de Proyecto')
  const [modulosOriginal, setModulosOriginal] = useState([])
  const [modulos, setModulos] = useState([])
  const [bloqueadoGlobal, setBloqueadoGlobal] = useState(false)
  const [cargandoGlobal, setCargandoGlobal] = useState(true)
  const [guardandoGlobal, setGuardandoGlobal] = useState(false)
  const [syncGlobal, setSyncGlobal] = useState(null)

  useEffect(() => {
    let cancelado = false
    setCargandoGlobal(true)
    pedir(`/permisos/globales/${encodeURIComponent(rolGlobal)}`)
      .then((datos) => {
        if (cancelado) return
        setModulosOriginal(datos.modulos)
        setModulos(datos.modulos)
        setBloqueadoGlobal(datos.bloqueado)
        setSyncGlobal(new Date())
      })
      .catch((err) => setError(err.message))
      .finally(() => !cancelado && setCargandoGlobal(false))
    return () => {
      cancelado = true
    }
  }, [rolGlobal])

  const huboCambiosGlobal = useMemo(
    () => JSON.stringify(modulos) !== JSON.stringify(modulosOriginal),
    [modulos, modulosOriginal]
  )

  const actualizarModulo = (clave, campo, valor) => {
    setModulos((prev) =>
      prev.map((m) => {
        if (m.clave !== clave) return m
        const siguiente = { ...m, [campo]: valor }
        if (campo === 'ver' && !valor) {
          siguiente.crear = false
          siguiente.editar = false
          siguiente.eliminar = false
        }
        siguiente.asignado = siguiente.ver
        siguiente.nota = calcularEstadoModulo(siguiente)
        return siguiente
      })
    )
  }

  const guardarGlobal = async () => {
    setGuardandoGlobal(true)
    setError('')
    try {
      const datos = await pedir(`/permisos/globales/${encodeURIComponent(rolGlobal)}`, {
        method: 'PUT',
        body: JSON.stringify({
          modulos: modulos.map((m) => ({
            clave: m.clave,
            asignado: m.asignado,
            ver: m.ver,
            crear: m.crear,
            editar: m.editar,
            eliminar: m.eliminar,
            nota: m.nota,
          })),
        }),
      })
      setModulosOriginal(datos.modulos)
      setModulos(datos.modulos)
      setSyncGlobal(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardandoGlobal(false)
    }
  }

  const descartarGlobal = () => setModulos(modulosOriginal)

  // --- Permisos por proyecto ---
  const [proyectos, setProyectos] = useState([])
  const [cargandoProyectos, setCargandoProyectos] = useState(true)
  const [proyectoId, setProyectoId] = useState(null)
  const [subTab, setSubTab] = useState('responsable')
  const [miembrosOriginal, setMiembrosOriginal] = useState([])
  const [miembros, setMiembros] = useState([])
  const [cargandoMiembros, setCargandoMiembros] = useState(true)
  const [guardandoProyecto, setGuardandoProyecto] = useState(false)
  const [syncProyecto, setSyncProyecto] = useState(null)

  useEffect(() => {
    pedir('/proyectos/detalles?limit=50')
      .then((respuesta) => setProyectos(respuesta.items))
      .catch((err) => setError(err.message))
      .finally(() => setCargandoProyectos(false))
  }, [])

  useEffect(() => {
    if (proyectoId === null && proyectos.length > 0) {
      setProyectoId(proyectos[0].id)
    }
  }, [proyectos, proyectoId])

  useEffect(() => {
    if (!proyectoId) return undefined
    let cancelado = false
    setCargandoMiembros(true)
    pedir(`/permisos/proyecto/${proyectoId}`)
      .then((datos) => {
        if (cancelado) return
        setMiembrosOriginal(datos.miembros)
        setMiembros(datos.miembros)
        setSyncProyecto(new Date())
        setSubTab('responsable')
      })
      .catch((err) => setError(err.message))
      .finally(() => !cancelado && setCargandoMiembros(false))
    return () => {
      cancelado = true
    }
  }, [proyectoId])

  const proyectoActivo = proyectos.find((p) => p.id === Number(proyectoId)) || null

  const huboCambiosProyecto = useMemo(
    () => JSON.stringify(miembros) !== JSON.stringify(miembrosOriginal),
    [miembros, miembrosOriginal]
  )

  const actualizarMiembro = (usuarioId, campo, valor) => {
    setMiembros((prev) =>
      prev.map((m) => (m.usuario_id === usuarioId ? { ...m, [campo]: valor } : m))
    )
  }

  const guardarProyecto = async () => {
    setGuardandoProyecto(true)
    setError('')
    try {
      const datos = await pedir(`/permisos/proyecto/${proyectoId}`, {
        method: 'PUT',
        body: JSON.stringify({
          miembros: miembros.map((m) => ({
            usuario_id: m.usuario_id,
            ver: m.ver,
            subir_crear: m.subir_crear,
            editar_anotar: m.editar_anotar,
            descargar: m.descargar,
            consulta_ia: m.consulta_ia,
            nota: m.nota,
          })),
        }),
      })
      setMiembrosOriginal(datos.miembros)
      setMiembros(datos.miembros)
      setSyncProyecto(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardandoProyecto(false)
    }
  }

  const descartarProyecto = () => setMiembros(miembrosOriginal)

  const responsable = miembros.find((m) => m.rol_proyecto === 'RESPONSABLE') || null
  const colaboradores = miembros.filter((m) => m.rol_proyecto !== 'RESPONSABLE')
  const filaVisible = subTab === 'responsable' ? (responsable ? [responsable] : []) : colaboradores

  const renderAvatar = (miembro) => {
    const { background, color } = getAvatarColors(miembro.nombre)
    return (
      <span className="roles__avatar" style={{ backgroundColor: background, color }}>
        {getInitials(miembro.nombre)}
      </span>
    )
  }

  return (
    <div className="roles roles--modern" data-docai-layout="modern">
      <PageHeader title="Roles y permisos" description={tab === 'globales'
        ? 'Configura qué puede ver y hacer cada rol, tanto a nivel global como dentro de cada proyecto.'
        : 'Gestiona las políticas de acceso delegadas y permisos específicos por proyecto activo.'} />

      <nav className="roles__tabs" aria-label="Ámbito de permisos">
        <button
          type="button"
          className={`roles__tab ${tab === 'globales' ? 'roles__tab--activo' : ''}`}
          aria-pressed={tab === 'globales'} onClick={() => setTab('globales')}
        >
          <IconEscudo />
          Permisos Globales
        </button>
        <button
          type="button"
          className={`roles__tab ${tab === 'proyecto' ? 'roles__tab--activo' : ''}`}
          aria-pressed={tab === 'proyecto'} onClick={() => setTab('proyecto')}
        >
          <IconCarpetaCheck />
          Permisos por Proyecto
          {proyectoActivo && <span className="roles__tab-chip">{proyectoActivo.nombre}</span>}
        </button>
      </nav>

      {error && <div className="roles__error">{error}</div>}

      {tab === 'globales' ? (
        <>
          <div className="roles__rol-tabs">
            {ROLES_GLOBALES.map((r) => (
              <button
                key={r.clave}
                type="button"
                className={`roles__rol-tab ${rolGlobal === r.clave ? 'roles__rol-tab--activo' : ''}`}
                aria-pressed={rolGlobal === r.clave} onClick={() => setRolGlobal(r.clave)}
              >
                <IconNavRoles size={14} />
                {r.etiqueta}
                {r.clave === 'Administrador' && (
                  <span className="roles__badge-total">
                    <IconCandado />
                    ACCESO TOTAL
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="roles__aviso">
            <IconEscudo />
            <div>
              <strong>DIRECTIVA DE SEGURIDAD EN TIEMPO REAL</strong>
              <p>
                Los cambios en los permisos afectan de inmediato a todos los usuarios asignados a este rol en
                toda la organización. Toda modificación generará un evento inmutable firmado en el expediente
                central de auditoría.
              </p>
            </div>
          </div>

          <SurfaceCard className="roles__matriz">
            <div className="roles__matriz-header">
              <IconGrid />
              <h2>Matriz de Acceso por Módulo</h2>
            </div>

            <div className="roles__tabla-wrap">
              <table className="roles__tabla">
                <thead>
                  <tr>
                    <th>Módulo del sistema</th>
                    <th>Ver</th>
                    <th>Crear</th>
                    <th>Editar</th>
                    <th>Eliminar</th>
                    <th>Estado / Reglas aplicadas</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoGlobal ? (
                    <tr>
                      <td colSpan={6} className="roles__tabla-vacio">
                        Cargando matriz de permisos...
                      </td>
                    </tr>
                  ) : (
                    modulos.map((m) => {
                      const Icono = ICONOS_MODULO[m.clave]
                      const inactivo = !m.ver
                      return (
                        <tr key={m.clave} className={inactivo ? 'roles__fila-inactiva' : ''}>
                          <td>
                            <div className="roles__modulo-celda">
                              <span className="roles__modulo-icono">{Icono && <Icono size={16} />}</span>
                              <div>
                                <span className="roles__modulo-nombre">{m.nombre}</span>
                                <span className="roles__modulo-desc">{m.descripcion}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Toggle
                              label={`Ver · ${m.nombre}`} checked={m.ver}
                              disabled={bloqueadoGlobal}
                              onChange={(v) => actualizarModulo(m.clave, 'ver', v)}
                            />
                          </td>
                          <td>
                            <Toggle
                              label={`Crear · ${m.nombre}`} checked={m.crear}
                              disabled={bloqueadoGlobal || !m.ver}
                              onChange={(v) => actualizarModulo(m.clave, 'crear', v)}
                            />
                          </td>
                          <td>
                            <Toggle
                              label={`Editar · ${m.nombre}`} checked={m.editar}
                              disabled={bloqueadoGlobal || !m.ver}
                              onChange={(v) => actualizarModulo(m.clave, 'editar', v)}
                            />
                          </td>
                          <td>
                            <Toggle
                              label={`Eliminar · ${m.nombre}`} checked={m.eliminar}
                              disabled={bloqueadoGlobal || !m.ver}
                              onChange={(v) => actualizarModulo(m.clave, 'eliminar', v)}
                            />
                          </td>
                          <td>
                            <span className={`roles__pill ${!inactivo ? 'roles__pill--ok' : ''}`}>{m.nota}</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="roles__pie">
              <span className="roles__pie-info">
                ÚLTIMA SINCRONIZACIÓN: {formatSincronizacion(syncGlobal)}
              </span>
              <div className="roles__pie-acciones">
                <Button type="button" disabled={!huboCambiosGlobal} onClick={descartarGlobal}>
                  Descartar cambios
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={bloqueadoGlobal || !huboCambiosGlobal || guardandoGlobal}
                  onClick={guardarGlobal}
                >
                  <IconGuardar />
                  {guardandoGlobal ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </SurfaceCard>
        </>
      ) : cargandoProyectos ? (
        <div className="roles__vacio">Cargando proyectos...</div>
      ) : proyectos.length === 0 ? (
        <div className="roles__vacio">Todavía no hay proyectos creados.</div>
      ) : (
        <>
          <div className="roles__proyecto-card">
            <span className="roles__label">PROYECTO SELECCIONADO:</span>
            <div className="roles__proyecto-selector">
              <div className="roles__select-wrap">
                <select aria-label="Proyecto seleccionado" value={proyectoId ?? ''} onChange={(e) => setProyectoId(Number(e.target.value))}>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (#{p.codigo}) — {p.descripcion || 'Sin descripción'}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="roles__select-icono" />
              </div>
              {proyectoActivo && (
                <span className="roles__estado-activo">
                  <span className="roles__estado-dot" />
                  {proyectoActivo.estado}
                </span>
              )}
            </div>

            {proyectoActivo && (
              <div className="roles__proyecto-meta">
                <span>
                  <IconUsuarios size={13} /> Jefe de Proyecto: <strong>{proyectoActivo.responsable?.nombre ?? '—'}</strong>
                </span>
                <span>
                  <IconUsuarios size={13} /> {miembros.length} miembro{miembros.length === 1 ? '' : 's'} asignado
                  {miembros.length === 1 ? '' : 's'}
                </span>
                <span>
                  <IconCarpeta size={13} /> {proyectoActivo.total_documentos} expediente
                  {proyectoActivo.total_documentos === 1 ? '' : 's'} en bóveda
                </span>
              </div>
            )}
          </div>

          <div className="roles__aviso roles__aviso--local">
            <IconCandado />
            <div>
              <strong>
                DIRECTIVA DE PERMISOS LOCALES // POL_PRJ_{String(proyectoId).padStart(3, '0')}{' '}
                <span className="roles__pill-nivel">NIVEL PROYECTO</span>
              </strong>
              <p>
                Los permisos configurados en esta vista anulan las restricciones globales únicamente para los
                documentos y expedientes pertenecientes a {proyectoActivo?.nombre}.
              </p>
            </div>
          </div>

          <SurfaceCard className="roles__matriz">
            <div className="roles__matriz-header roles__matriz-header--proyecto">
              <div className="roles__subtabs">
                <button
                  type="button"
                  className={`roles__subtab ${subTab === 'responsable' ? 'roles__subtab--activo' : ''}`}
                  onClick={() => setSubTab('responsable')}
                >
                  <IconCandado />
                  Jefe de Proyecto {responsable ? `(${responsable.nombre})` : ''}
                </button>
                <button
                  type="button"
                  className={`roles__subtab ${subTab === 'colaboradores' ? 'roles__subtab--activo' : ''}`}
                  onClick={() => setSubTab('colaboradores')}
                >
                  <IconUsuarios size={15} />
                  Colaboradores del Proyecto
                  <span className="roles__badge-conteo">{colaboradores.length} ASIGNADOS</span>
                </button>
              </div>
            </div>

            <div className="roles__tabla-wrap">
              <table className="roles__tabla">
                <thead>
                  <tr>
                    <th>Colaborador / Jefe de Proyecto</th>
                    <th>Ver</th>
                    <th>Subir / Crear</th>
                    <th>Editar / Anotar</th>
                    <th>Descargar</th>
                    <th>Consulta IA</th>
                    <th>Estado / Reglas locales</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoMiembros ? (
                    <tr>
                      <td colSpan={7} className="roles__tabla-vacio">
                        Cargando permisos del proyecto...
                      </td>
                    </tr>
                  ) : filaVisible.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="roles__tabla-vacio">
                        {subTab === 'responsable'
                          ? 'Este proyecto no tiene un jefe de proyecto asignado.'
                          : 'Este proyecto no tiene colaboradores asignados.'}
                      </td>
                    </tr>
                  ) : (
                    filaVisible.map((m) => (
                      <tr key={m.usuario_id}>
                        <td>
                          <div className="roles__miembro-celda">
                            {renderAvatar(m)}
                            <div>
                              <div className="roles__miembro-nombre-fila">
                                <span className="roles__miembro-nombre">{m.nombre}</span>
                                <span
                                  className={`roles__badge-rol ${
                                    m.rol_proyecto === 'RESPONSABLE' ? 'roles__badge-rol--jefe' : ''
                                  }`}
                                >
                                  {m.rol_proyecto === 'RESPONSABLE' ? 'Jefe de Proyecto' : 'Colaborador'}
                                </span>
                              </div>
                              <span className="roles__miembro-correo">{m.correo}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Toggle label={`Ver · ${m.nombre}`} checked={m.ver} onChange={(v) => actualizarMiembro(m.usuario_id, 'ver', v)} />
                        </td>
                        <td>
                          <Toggle
                            label={`Subir / Crear · ${m.nombre}`} checked={m.subir_crear}
                            onChange={(v) => actualizarMiembro(m.usuario_id, 'subir_crear', v)}
                          />
                        </td>
                        <td>
                          <Toggle
                            label={`Editar / Anotar · ${m.nombre}`} checked={m.editar_anotar}
                            onChange={(v) => actualizarMiembro(m.usuario_id, 'editar_anotar', v)}
                          />
                        </td>
                        <td>
                          <Toggle
                            label={`Descargar · ${m.nombre}`} checked={m.descargar}
                            onChange={(v) => actualizarMiembro(m.usuario_id, 'descargar', v)}
                          />
                        </td>
                        <td>
                          <Toggle
                            label={`Consulta IA · ${m.nombre}`} checked={m.consulta_ia}
                            onChange={(v) => actualizarMiembro(m.usuario_id, 'consulta_ia', v)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="roles__nota-input"
                            aria-label={`Nota · ${m.nombre}`}
                            placeholder="Agregar regla o nota..."
                            value={m.nota ?? ''}
                            onChange={(e) => actualizarMiembro(m.usuario_id, 'nota', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="roles__pie">
              <span className="roles__pie-info">
                ÚLTIMA SINCRONIZACIÓN LOCAL: {formatSincronizacion(syncProyecto)}
              </span>
              <div className="roles__pie-acciones">
                <Button
                  type="button"
                  disabled={!huboCambiosProyecto}
                  onClick={descartarProyecto}
                >
                  Descartar cambios
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!huboCambiosProyecto || guardandoProyecto}
                  onClick={guardarProyecto}
                >
                  <IconGuardar />
                  {guardandoProyecto ? 'Guardando...' : `Guardar cambios en ${proyectoActivo?.nombre ?? ''}`}
                </Button>
              </div>
            </div>
          </SurfaceCard>
        </>
      )}
    </div>
  )
}
