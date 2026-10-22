import { useEffect, useMemo, useState } from 'react'
import { getInitials, getAvatarColors } from '../../utils/avatarUtils'
import { actorHeaders } from '../../utils/actor'
import { IconUsuarios, IconCarpeta, IconBuscar } from '../../components/icons'
import './Usuarios.css'

const VACIO = { nombre: '', correo: '', contrasena: '', rol: 'Colaborador' }
const POR_PAGINA = 8

function formatFecha(iso) {
  if (!iso) return 'Nunca'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return 'Nunca'
  return fecha.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFechaCorta(iso) {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}

function badgeRolSistema(rol) {
  if (rol === 'Administrador') return { label: rol, className: 'usuarios__rol-badge usuarios__rol-badge--admin' }
  if (rol === 'Jefe de Proyecto') return { label: rol, className: 'usuarios__rol-badge usuarios__rol-badge--jefe' }
  return { label: rol, className: 'usuarios__rol-badge' }
}

function badgeRolProyecto(rolProyecto) {
  if (rolProyecto === 'RESPONSABLE') {
    return {
      label: 'Responsable del Proyecto',
      className: 'usuarios__rol-proyecto-badge usuarios__rol-proyecto-badge--responsable',
    }
  }
  return { label: 'Colaborador del Proyecto', className: 'usuarios__rol-proyecto-badge' }
}

function esInvitacionPendiente(miembro) {
  return miembro.estado_invitacion === 'PENDIENTE'
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

const IconChevronDown = (p) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconPuntos = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="5" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="12" cy="19" r="1.2" />
  </svg>
)

const IconMas = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)

const IconCheck = (p) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconAlerta = (p) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
  </svg>
)

export default function Usuarios({ sesion }) {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [formulario, setFormulario] = useState(null)
  const [error, setError] = useState('')
  const [menuAbiertoId, setMenuAbiertoId] = useState(null)
  const [invitacion, setInvitacion] = useState(null)

  const [proyectos, setProyectos] = useState([])
  const [cargandoProyectos, setCargandoProyectos] = useState(true)
  const [invitarA, setInvitarA] = useState(null)
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState(null)
  const [accionMiembro, setAccionMiembro] = useState(null)
  const [menuMiembroAbiertoId, setMenuMiembroAbiertoId] = useState(null)
  const [miembroEliminado, setMiembroEliminado] = useState(null)
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null)
  const [usuarioEliminado, setUsuarioEliminado] = useState(null)

  const puedeEliminar = sesion?.rol === 'Administrador' || sesion?.rol === 'Jefe de Proyecto'
  // Un Jefe de Proyecto solo puede gestionar los proyectos donde es Responsable; el Administrador ve todos
  const esJefeDeProyecto = sesion?.rol === 'Jefe de Proyecto'

  const [tab, setTab] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [orden, setOrden] = useState('reciente')
  const [pagina, setPagina] = useState(1)

  const cargar = async () => {
    const lista = await pedir('/usuarios')
    setUsuarios(lista)
  }

  const cargarProyectos = async () => {
    const params = new URLSearchParams({ limit: '50' })
    if (esJefeDeProyecto && sesion?.id) params.append('responsable_id', sesion.id)
    const respuesta = await pedir(`/proyectos/detalles?${params.toString()}`)
    setProyectos(respuesta.items)
  }

  useEffect(() => {
    cargar()
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))

    cargarProyectos()
      .catch((err) => setError(err.message))
      .finally(() => setCargandoProyectos(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const intervalo = setInterval(() => {
      cargar().catch(() => {})
    }, 30000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (proyectoSeleccionadoId === null && proyectos.length > 0) {
      setProyectoSeleccionadoId(proyectos[0].id)
    }
  }, [proyectos, proyectoSeleccionadoId])

  const proyectoActivo = proyectos.find((p) => p.id === Number(proyectoSeleccionadoId)) || null
  const miembrosActivos = proyectoActivo ? proyectoActivo.miembros.filter((m) => !esInvitacionPendiente(m)) : []
  const invitacionesPendientesProyecto = proyectoActivo
    ? proyectoActivo.miembros.filter((m) => esInvitacionPendiente(m))
    : []

  const roles = useMemo(() => {
    const unicos = new Set(usuarios.map((u) => u.rol).filter(Boolean))
    return ['Todos', ...unicos]
  }, [usuarios])

  const usuariosFiltrados = useMemo(() => {
    const filtrados = usuarios.filter((u) => {
      const texto = busqueda.trim().toLowerCase()
      const coincideBusqueda =
        !texto || u.nombre.toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto)
      const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol
      const coincideEstado =
        filtroEstado === 'Todos' || (filtroEstado === 'Activo' ? u.activo : !u.activo)
      return coincideBusqueda && coincideRol && coincideEstado
    })

    if (orden === 'az') {
      return [...filtrados].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    }
    if (orden === 'za') {
      return [...filtrados].sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))
    }
    if (orden === 'antiguo') {
      return [...filtrados].sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion))
    }
    return filtrados
  }, [usuarios, busqueda, filtroRol, filtroEstado, orden])

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const usuariosPagina = usuariosFiltrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  )

  const totales = useMemo(
    () => ({
      total: usuarios.length,
      activos: usuarios.filter((u) => u.activo).length,
      inactivos: usuarios.filter((u) => !u.activo).length,
    }),
    [usuarios]
  )

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    const datos = formulario.datos

    try {
      if (formulario.modo === 'crear') {
        const creado = await pedir('/usuarios', {
          method: 'POST',
          body: JSON.stringify({
            nombre: datos.nombre,
            correo: datos.correo,
            contrasena: datos.contrasena,
            rol: datos.rol,
          }),
        })
        setInvitacion({ tipo: 'usuario', correo: creado.correo, enviada: creado.invitacion_enviada })
      } else {
        await pedir(`/usuarios/${formulario.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre: datos.nombre,
            correo: datos.correo,
            rol: datos.rol,
          }),
        })
      }
      await cargar()
      setFormulario(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const invitarMiembro = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const creado = await pedir(`/proyectos/${invitarA.proyecto.id}/usuarios`, {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: Number(invitarA.usuarioId),
          rol_proyecto: invitarA.rolProyecto,
          cargo: invitarA.cargo || null,
        }),
      })
      setInvitarA(null)
      setInvitacion({ tipo: 'proyecto', correo: creado.correo, enviada: creado.invitacion_enviada })
      await cargarProyectos()
    } catch (err) {
      setError(err.message)
    }
  }

  const confirmarEliminarUsuario = async () => {
    setError('')
    try {
      await pedir(`/usuarios/${usuarioAEliminar.id}`, { method: 'DELETE' })
      setUsuarioAEliminar(null)
      await cargar()
      setUsuarioEliminado(usuarioAEliminar)
    } catch (err) {
      setError(err.message)
    }
  }

  const confirmarAccionMiembro = async () => {
    setError('')
    try {
      const { proyectoId, usuario, tipo } = accionMiembro
      if (tipo === 'cancelar' || tipo === 'eliminar') {
        await pedir(`/proyectos/${proyectoId}/usuarios/${usuario.id}`, { method: 'DELETE' })
      } else {
        await pedir(`/proyectos/${proyectoId}/usuarios/${usuario.id}/estado`, {
          method: 'PATCH',
          body: JSON.stringify({ activo: tipo === 'habilitar' }),
        })
      }
      setAccionMiembro(null)
      await cargarProyectos()
      if (tipo === 'eliminar') {
        setMiembroEliminado(usuario)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const renderAvatar = (usuario, inhabilitado = false) => {
    if (inhabilitado) {
      return (
        <span className="usuarios__avatar usuarios__avatar--inhabilitado">{getInitials(usuario.nombre)}</span>
      )
    }
    if (usuario.rol === 'Administrador') {
      return (
        <span className="usuarios__avatar usuarios__avatar--admin">{getInitials(usuario.nombre)}</span>
      )
    }
    const { background, color } = getAvatarColors(usuario.nombre)
    return (
      <span className="usuarios__avatar" style={{ backgroundColor: background, color }}>
        {getInitials(usuario.nombre)}
      </span>
    )
  }

  return (
    <div className="usuarios">
      <div className="usuarios__header">
        <div>
          <h1 className="usuarios__titulo">Gestión de Usuarios</h1>
          <p className="usuarios__subtitulo">
            Administra las cuentas, roles y accesos de todos los usuarios de DocAI.
          </p>
        </div>
        <button
          type="button"
          className="usuarios__btn-nuevo"
          onClick={() => setFormulario({ modo: 'crear', datos: { ...VACIO } })}
        >
          <IconMas />
          Nuevo Usuario
        </button>
      </div>

      <nav className="usuarios__tabs">
        <button
          type="button"
          className={`usuarios__tab ${tab === 'todos' ? 'usuarios__tab--activo' : ''}`}
          onClick={() => setTab('todos')}
        >
          <IconUsuarios size={16} />
          Todos los Usuarios
        </button>
        <button
          type="button"
          className={`usuarios__tab ${tab === 'proyecto' ? 'usuarios__tab--activo' : ''}`}
          onClick={() => setTab('proyecto')}
        >
          <IconCarpeta size={16} />
          Por Proyecto
        </button>
      </nav>

      {error && <div className="usuarios__error">{error}</div>}

      {tab === 'proyecto' ? (
        cargandoProyectos ? (
          <div className="usuarios__vacio">Cargando proyectos...</div>
        ) : proyectos.length === 0 ? (
          <div className="usuarios__vacio">Todavía no hay proyectos creados.</div>
        ) : (
          <div className="usuarios__pp">
            <div className="usuarios__pp-card">
              <div className="usuarios__pp-header">
                <div>
                  <span className="usuarios__pp-eyebrow">VISTA DE ASIGNACIONES</span>
                  <h2 className="usuarios__pp-titulo">Miembros del proyecto</h2>
                </div>
                <button
                  type="button"
                  className="usuarios__btn-nuevo"
                  disabled={!proyectoActivo}
                  onClick={() => {
                    const idsMiembros = new Set(proyectoActivo.miembros.map((m) => m.id))
                    const disponibles = usuarios.filter((u) => !idsMiembros.has(u.id))
                    setInvitarA({
                      proyecto: proyectoActivo,
                      opciones: disponibles,
                      usuarioId: disponibles[0]?.id ?? '',
                      rolProyecto: 'MIEMBRO',
                      cargo: '',
                    })
                  }}
                >
                  <IconMas />
                  Agregar usuario a este proyecto
                </button>
              </div>

              <div className="usuarios__pp-barra">
                <div className="usuarios__pp-selector">
                  <span className="usuarios__pp-selector-label">SELECCIONAR PROYECTO:</span>
                  <div className="usuarios__select-wrap">
                    <select
                      value={proyectoSeleccionadoId ?? ''}
                      onChange={(e) => setProyectoSeleccionadoId(Number(e.target.value))}
                    >
                      {proyectos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} (#{p.codigo})
                        </option>
                      ))}
                    </select>
                    <IconChevronDown className="usuarios__select-icono" />
                  </div>
                </div>

                {proyectoActivo && (
                  <div className="usuarios__pp-resumen">
                    <span className="usuarios__nombre">{proyectoActivo.nombre}</span>
                    <span className="usuarios__estado usuarios__estado--activo">
                      <span className="usuarios__estado-dot" />
                      {proyectoActivo.estado}
                    </span>
                    <span className="usuarios__tenue">
                      {miembrosActivos.length} miembro{miembrosActivos.length === 1 ? '' : 's'} en
                      este proyecto
                      {invitacionesPendientesProyecto.length > 0 &&
                        ` · ${invitacionesPendientesProyecto.length} invitación${invitacionesPendientesProyecto.length === 1 ? '' : 'es'} pendiente${invitacionesPendientesProyecto.length === 1 ? '' : 's'}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {proyectoActivo && (
              <div className="usuarios__tabla-wrap">
                <table className="usuarios__tabla">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Correo</th>
                      <th>Rol en el Sistema</th>
                      <th>Rol en el Proyecto</th>
                      <th>Fecha de ingreso al proyecto</th>
                      <th className="usuarios__col-acciones">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proyectoActivo.miembros.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="usuarios__tabla-vacio">
                          Este proyecto aún no tiene miembros.
                        </td>
                      </tr>
                    ) : (
                      proyectoActivo.miembros.map((miembro) => {
                        const sistema = badgeRolSistema(miembro.rol)
                        const proyectoRol = badgeRolProyecto(miembro.rol_proyecto)
                        const pendiente = esInvitacionPendiente(miembro)
                        const inhabilitado = !pendiente && miembro.activo === false
                        const filaClase = pendiente
                          ? 'usuarios__fila-pendiente'
                          : inhabilitado
                            ? 'usuarios__fila-inhabilitada'
                            : ''
                        return (
                          <tr key={miembro.id} className={filaClase}>
                            <td>
                              <div className="usuarios__usuario-celda">
                                {renderAvatar(miembro, inhabilitado)}
                                <span className="usuarios__nombre">{miembro.nombre}</span>
                              </div>
                            </td>
                            <td className="usuarios__correo">{miembro.correo}</td>
                            <td>
                              <span className={sistema.className}>{sistema.label}</span>
                            </td>
                            <td>
                              {pendiente ? (
                                <span className="usuarios__rol-proyecto-badge usuarios__rol-proyecto-badge--pendiente">
                                  Invitación pendiente
                                </span>
                              ) : inhabilitado ? (
                                <span className="usuarios__rol-proyecto-badge usuarios__rol-proyecto-badge--inhabilitado">
                                  Inhabilitado
                                </span>
                              ) : (
                                <span className={proyectoRol.className}>{proyectoRol.label}</span>
                              )}
                            </td>
                            <td className="usuarios__tenue usuarios__mono">
                              {pendiente ? 'Pendiente de aceptar' : formatFechaCorta(miembro.fecha_ingreso)}
                            </td>
                            <td className="usuarios__col-acciones">
                              {puedeEliminar && !pendiente ? (
                                <div className="usuarios__menu-wrap">
                                  <button
                                    type="button"
                                    className="usuarios__btn-kebab"
                                    aria-label="Acciones"
                                    onClick={() =>
                                      setMenuMiembroAbiertoId(menuMiembroAbiertoId === miembro.id ? null : miembro.id)
                                    }
                                  >
                                    <IconPuntos />
                                  </button>
                                  {menuMiembroAbiertoId === miembro.id && (
                                    <div className="usuarios__menu" onMouseLeave={() => setMenuMiembroAbiertoId(null)}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuMiembroAbiertoId(null)
                                          setAccionMiembro({
                                            proyectoId: proyectoActivo.id,
                                            usuario: miembro,
                                            tipo: inhabilitado ? 'habilitar' : 'inhabilitar',
                                          })
                                        }}
                                      >
                                        {inhabilitado ? 'Habilitar' : 'Inhabilitar'}
                                      </button>
                                      <button
                                        type="button"
                                        className="usuarios__menu-peligro"
                                        onClick={() => {
                                          setMenuMiembroAbiertoId(null)
                                          setAccionMiembro({
                                            proyectoId: proyectoActivo.id,
                                            usuario: miembro,
                                            tipo: 'eliminar',
                                          })
                                        }}
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="usuarios__btn-texto"
                                  onClick={() =>
                                    setAccionMiembro({
                                      proyectoId: proyectoActivo.id,
                                      usuario: miembro,
                                      tipo: pendiente ? 'cancelar' : inhabilitado ? 'habilitar' : 'inhabilitar',
                                    })
                                  }
                                >
                                  {pendiente ? 'Cancelar invitación' : inhabilitado ? 'Habilitar' : 'Inhabilitar'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>

                <div className="usuarios__pie">
                  <span className="usuarios__pie-info">
                    Mostrando <strong>{miembrosActivos.length}</strong> miembros asignados a este proyecto
                    {invitacionesPendientesProyecto.length > 0 &&
                      ` y ${invitacionesPendientesProyecto.length} invitación${invitacionesPendientesProyecto.length === 1 ? '' : 'es'} pendiente${invitacionesPendientesProyecto.length === 1 ? '' : 's'}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <>
          <div className="usuarios__stats">
            <div className="usuarios__stat">
              <span className="usuarios__stat-etiqueta">Usuarios Totales</span>
              <div className="usuarios__stat-fila">
                <span className="usuarios__stat-valor">{totales.total}</span>
                <span className="usuarios__stat-detalle">Usuarios registrados en la plataforma</span>
              </div>
            </div>

            <div className="usuarios__stat">
              <span className="usuarios__stat-etiqueta">Usuarios Activos</span>
              <div className="usuarios__stat-fila">
                <span className="usuarios__stat-valor">{totales.activos}</span>
                <span className="usuarios__stat-detalle">Activos en la plataforma</span>
              </div>
            </div>

            <div className="usuarios__stat">
              <span className="usuarios__stat-etiqueta">Usuarios Inactivos</span>
              <div className="usuarios__stat-fila">
                <span className="usuarios__stat-valor">{totales.inactivos}</span>
                <span className="usuarios__stat-detalle">Sin acceso registrado</span>
              </div>
            </div>
          </div>

          <div className="usuarios__controles">
            <div className="usuarios__buscador">
              <IconBuscar size={14} className="usuarios__buscador-icono" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
              />
            </div>

            <div className="usuarios__filtros">
              <div className="usuarios__select-wrap">
                <select
                  value={filtroRol}
                  onChange={(e) => {
                    setFiltroRol(e.target.value)
                    setPagina(1)
                  }}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      Rol: {r}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="usuarios__select-icono" />
              </div>

              <div className="usuarios__select-wrap">
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="Todos">Estado: Todos</option>
                  <option value="Activo">Estado: Activo</option>
                  <option value="Inactivo">Estado: Inactivo</option>
                </select>
                <IconChevronDown className="usuarios__select-icono" />
              </div>

              <div className="usuarios__select-wrap">
                <select
                  value={orden}
                  onChange={(e) => {
                    setOrden(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="reciente">Ordenar por: Más reciente</option>
                  <option value="az">Ordenar por A-Z</option>
                  <option value="za">Ordenar por Z-A</option>
                  <option value="antiguo">Ordenar por Más antiguo</option>
                </select>
                <IconChevronDown className="usuarios__select-icono" />
              </div>
            </div>
          </div>

          <div className="usuarios__tabla-wrap">
            <table className="usuarios__tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último acceso</th>
                  <th>Fecha de registro</th>
                  <th className="usuarios__col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="usuarios__tabla-vacio">Cargando usuarios...</td>
                  </tr>
                ) : usuariosPagina.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="usuarios__tabla-vacio">
                      No se encontraron usuarios con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  usuariosPagina.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        <div className="usuarios__usuario-celda">
                          {renderAvatar(usuario)}
                          <span className="usuarios__nombre">{usuario.nombre}</span>
                        </div>
                      </td>
                      <td className="usuarios__correo">{usuario.correo}</td>
                      <td>
                        <span
                          className={`usuarios__rol-badge ${
                            usuario.rol === 'Administrador' ? 'usuarios__rol-badge--admin' : ''
                          }`}
                        >
                          {usuario.rol}
                        </span>
                      </td>
                      <td>
                        <span className={`usuarios__estado ${usuario.activo ? 'usuarios__estado--activo' : ''}`}>
                          <span className="usuarios__estado-dot" />
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="usuarios__tenue usuarios__mono">{formatFecha(usuario.ultimo_acceso)}</td>
                      <td className="usuarios__tenue usuarios__mono">{formatFecha(usuario.fecha_creacion)}</td>
                      <td className="usuarios__col-acciones">
                        <div className="usuarios__menu-wrap">
                          <button
                            type="button"
                            className="usuarios__btn-kebab"
                            aria-label="Acciones"
                            onClick={() => setMenuAbiertoId(menuAbiertoId === usuario.id ? null : usuario.id)}
                          >
                            <IconPuntos />
                          </button>
                          {menuAbiertoId === usuario.id && (
                            <div className="usuarios__menu" onMouseLeave={() => setMenuAbiertoId(null)}>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAbiertoId(null)
                                  setFormulario({
                                    modo: 'editar',
                                    id: usuario.id,
                                    datos: { nombre: usuario.nombre, correo: usuario.correo, contrasena: '', rol: usuario.rol },
                                  })
                                }}
                              >
                                Editar
                              </button>
                              {puedeEliminar && (
                                <button
                                  type="button"
                                  className="usuarios__menu-peligro"
                                  onClick={() => {
                                    setMenuAbiertoId(null)
                                    setUsuarioAEliminar(usuario)
                                  }}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="usuarios__pie">
              <span className="usuarios__pie-info">
                Mostrando <strong>{usuariosFiltrados.length === 0 ? 0 : (paginaActual - 1) * POR_PAGINA + 1}-
                {Math.min(paginaActual * POR_PAGINA, usuariosFiltrados.length)}</strong> de{' '}
                <strong>{usuariosFiltrados.length}</strong> usuarios registrados
              </span>

              {totalPaginas > 1 && (
                <div className="usuarios__paginacion">
                  <button
                    type="button"
                    disabled={paginaActual === 1}
                    onClick={() => setPagina(paginaActual - 1)}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n === paginaActual ? 'usuarios__pagina-activa' : ''}
                      onClick={() => setPagina(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPagina(paginaActual + 1)}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {formulario && (
        <div className="usuarios__fondo" onClick={() => setFormulario(null)}>
          <form className="usuarios__modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h2>{formulario.modo === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}</h2>

            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              required
              value={formulario.datos.nombre}
              onChange={(e) =>
                setFormulario({ ...formulario, datos: { ...formulario.datos, nombre: e.target.value } })
              }
            />

            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              required
              value={formulario.datos.correo}
              onChange={(e) =>
                setFormulario({ ...formulario, datos: { ...formulario.datos, correo: e.target.value } })
              }
            />

            {formulario.modo === 'crear' && (
              <>
                <label htmlFor="contrasena">Contraseña</label>
                <input
                  id="contrasena"
                  type="password"
                  required
                  value={formulario.datos.contrasena}
                  onChange={(e) =>
                    setFormulario({ ...formulario, datos: { ...formulario.datos, contrasena: e.target.value } })
                  }
                />
              </>
            )}

            <label htmlFor="rol">Rol</label>
            <select
              id="rol"
              value={formulario.datos.rol}
              onChange={(e) => setFormulario({ ...formulario, datos: { ...formulario.datos, rol: e.target.value } })}
            >
              <option value="Administrador">Administrador</option>
              <option value="Jefe de Proyecto">Jefe de Proyecto</option>
              <option value="Colaborador">Colaborador</option>
            </select>

            <div className="usuarios__modal-acciones">
              <button type="button" className="usuarios__btn-texto" onClick={() => setFormulario(null)}>
                Cancelar
              </button>
              <button type="submit" className="usuarios__btn-nuevo">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {accionMiembro && (
        <div className="usuarios__fondo" onClick={() => setAccionMiembro(null)}>
          <div className="usuarios__modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {accionMiembro.tipo === 'cancelar'
                ? 'Cancelar invitación'
                : accionMiembro.tipo === 'habilitar'
                  ? 'Habilitar en el proyecto'
                  : accionMiembro.tipo === 'eliminar'
                    ? 'Eliminar del proyecto'
                    : 'Inhabilitar en el proyecto'}
            </h2>
            <p className="usuarios__modal-texto">
              {accionMiembro.tipo === 'cancelar' ? (
                <>
                  Se cancelará la invitación pendiente de <strong>{accionMiembro.usuario.nombre}</strong> a este
                  proyecto.
                </>
              ) : accionMiembro.tipo === 'habilitar' ? (
                <>
                  <strong>{accionMiembro.usuario.nombre}</strong> podrá volver a interactuar con este proyecto.
                </>
              ) : accionMiembro.tipo === 'eliminar' ? (
                <>
                  <strong>{accionMiembro.usuario.nombre}</strong> será eliminado de este proyecto y ya no tendrá
                  acceso a él. Esta acción no se puede deshacer.
                </>
              ) : (
                <>
                  <strong>{accionMiembro.usuario.nombre}</strong> seguirá apareciendo en este proyecto, pero ya no
                  podrá manipularlo.
                </>
              )}
            </p>
            <div className="usuarios__modal-acciones">
              <button type="button" className="usuarios__btn-texto" onClick={() => setAccionMiembro(null)}>
                Volver
              </button>
              <button
                type="button"
                className={accionMiembro.tipo === 'habilitar' ? 'usuarios__btn-nuevo' : 'usuarios__btn-peligro'}
                onClick={confirmarAccionMiembro}
              >
                {accionMiembro.tipo === 'cancelar'
                  ? 'Cancelar invitación'
                  : accionMiembro.tipo === 'habilitar'
                    ? 'Habilitar'
                    : accionMiembro.tipo === 'eliminar'
                      ? 'Eliminar'
                      : 'Inhabilitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {miembroEliminado && (
        <div className="usuarios__fondo" onClick={() => setMiembroEliminado(null)}>
          <div className="usuarios__modal" onClick={(e) => e.stopPropagation()}>
            <div className="usuarios__confirmacion-icono usuarios__confirmacion-icono--ok">
              <IconCheck />
            </div>
            <h2>Usuario eliminado con éxito</h2>
            <p className="usuarios__modal-texto">
              <strong>{miembroEliminado.nombre}</strong> fue eliminado del proyecto correctamente.
            </p>
            <div className="usuarios__modal-acciones">
              <button type="button" className="usuarios__btn-nuevo" onClick={() => setMiembroEliminado(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {usuarioAEliminar && (
        <div className="usuarios__fondo" onClick={() => setUsuarioAEliminar(null)}>
          <div className="usuarios__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Eliminar usuario</h2>
            <p className="usuarios__modal-texto">
              <strong>{usuarioAEliminar.nombre}</strong> será eliminado del sistema y ya no tendrá acceso a la
              plataforma ni a ninguno de sus proyectos. Esta acción no se puede deshacer.
            </p>
            <div className="usuarios__modal-acciones">
              <button type="button" className="usuarios__btn-texto" onClick={() => setUsuarioAEliminar(null)}>
                Volver
              </button>
              <button type="button" className="usuarios__btn-peligro" onClick={confirmarEliminarUsuario}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {usuarioEliminado && (
        <div className="usuarios__fondo" onClick={() => setUsuarioEliminado(null)}>
          <div className="usuarios__modal" onClick={(e) => e.stopPropagation()}>
            <div className="usuarios__confirmacion-icono usuarios__confirmacion-icono--ok">
              <IconCheck />
            </div>
            <h2>Usuario eliminado con éxito</h2>
            <p className="usuarios__modal-texto">
              <strong>{usuarioEliminado.nombre}</strong> fue eliminado del sistema correctamente.
            </p>
            <div className="usuarios__modal-acciones">
              <button type="button" className="usuarios__btn-nuevo" onClick={() => setUsuarioEliminado(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {invitarA && (
        <div className="usuarios__fondo" onClick={() => setInvitarA(null)}>
          <form className="usuarios__modal" onClick={(e) => e.stopPropagation()} onSubmit={invitarMiembro}>
            <h2>Invitar a {invitarA.proyecto.nombre}</h2>

            <label htmlFor="miembro">Usuario</label>
            <select
              id="miembro"
              required
              value={invitarA.usuarioId}
              onChange={(e) => setInvitarA({ ...invitarA, usuarioId: e.target.value })}
            >
              {invitarA.opciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.correo})
                </option>
              ))}
            </select>

            <label htmlFor="rolProyecto">Rol en el proyecto</label>
            <select
              id="rolProyecto"
              value={invitarA.rolProyecto}
              onChange={(e) => setInvitarA({ ...invitarA, rolProyecto: e.target.value })}
            >
              <option value="MIEMBRO">Miembro</option>
              <option value="RESPONSABLE">Responsable</option>
            </select>

            <label htmlFor="cargo">Cargo (opcional)</label>
            <input
              id="cargo"
              placeholder="Ej. Analista de datos"
              value={invitarA.cargo}
              onChange={(e) => setInvitarA({ ...invitarA, cargo: e.target.value })}
            />

            <div className="usuarios__modal-acciones">
              <button type="button" className="usuarios__btn-texto" onClick={() => setInvitarA(null)}>
                Cancelar
              </button>
              <button type="submit" className="usuarios__btn-nuevo">
                Enviar invitación
              </button>
            </div>
          </form>
        </div>
      )}

      {invitacion && (
        <div className="usuarios__fondo" onClick={() => setInvitacion(null)}>
          <div className="usuarios__modal" onClick={(e) => e.stopPropagation()}>
            {invitacion.enviada ? (
              <>
                <div className="usuarios__confirmacion-icono usuarios__confirmacion-icono--ok">
                  <IconCheck />
                </div>
                <h2>Invitación enviada con éxito</h2>
                <p className="usuarios__modal-texto">
                  {invitacion.tipo === 'proyecto'
                    ? <>Se envió un correo a <strong>{invitacion.correo}</strong> con la invitación al proyecto. Quedará como <strong>pendiente</strong> hasta que la acepte.</>
                    : <>Se envió un correo a <strong>{invitacion.correo}</strong> con sus datos de acceso.</>}
                </p>
              </>
            ) : (
              <>
                <div className="usuarios__confirmacion-icono usuarios__confirmacion-icono--error">
                  <IconAlerta />
                </div>
                <h2>{invitacion.tipo === 'proyecto' ? 'Invitación creada, pero el correo no se pudo enviar' : 'Usuario creado, pero el correo no se pudo enviar'}</h2>
                <p className="usuarios__modal-texto">
                  No se pudo enviar la invitación a <strong>{invitacion.correo}</strong>. Avísale
                  manualmente.
                </p>
              </>
            )}
            <div className="usuarios__modal-acciones">
              <button type="button" className="usuarios__btn-nuevo" onClick={() => setInvitacion(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
