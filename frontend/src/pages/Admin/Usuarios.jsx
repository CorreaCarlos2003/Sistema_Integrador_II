import { useEffect, useMemo, useRef, useState } from 'react'
import { actorHeaders } from '../../utils/actor'
import { IconUsuarios, IconCarpeta, IconBuscar, IconCheckCirculo, IconRoles } from '../../components/icons'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SurfaceCard from '../../components/ui/SurfaceCard'
import UsuariosTabla from './components/UsuariosTabla'
import UsuarioFormulario from './components/UsuarioFormulario'
import InvitarUsuarioFormulario from './components/InvitarUsuarioFormulario'
import InvitacionResultado from './components/InvitacionResultado'
import MiembroAccionModal, { MiembroEliminadoResultado } from './components/MiembroAccionModal'
import EliminarCuentaModal, { CuentaEliminadaResultado } from './components/EliminarCuentaModal'
import UsuariosAccionesMenu from './components/UsuariosAccionesMenu'
import ProyectoEstadoBadge from '../Proyectos/components/ProyectoEstadoBadge'
import './Usuarios.css'

const VACIO = { nombre: '', correo: '', contrasena: '', rol: 'Colaborador' }
const POR_PAGINA = 8

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


const IconMas = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)



export default function Usuarios({ sesion }) {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCargaUsuarios, setErrorCargaUsuarios] = useState('')
  const [errorCargaProyectos, setErrorCargaProyectos] = useState('')
  const [formulario, setFormulario] = useState(null)
  const [guardandoUsuario, setGuardandoUsuario] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')
  const formularioOrigenRef = useRef(null)
  const [invitacion, setInvitacion] = useState(null)

  const [proyectos, setProyectos] = useState([])
  const [cargandoProyectos, setCargandoProyectos] = useState(true)
  const [invitarA, setInvitarA] = useState(null)
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false)
  const [errorInvitacion, setErrorInvitacion] = useState('')
  const invitacionOrigenRef = useRef(null)
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState(null)
  const [accionMiembro, setAccionMiembro] = useState(null)
  const [procesandoMiembro, setProcesandoMiembro] = useState(false)
  const [errorAccionMiembro, setErrorAccionMiembro] = useState('')
  const accionMiembroOrigenRef = useRef(null)
  const selectorProyectoRef = useRef(null)
  const [miembroEliminado, setMiembroEliminado] = useState(null)
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null)
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false)
  const [errorEliminarUsuario, setErrorEliminarUsuario] = useState('')
  const eliminarUsuarioOrigenRef = useRef(null)
  const buscarUsuariosRef = useRef(null)
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
    setErrorCargaUsuarios('')
  }

  const cargarProyectos = async () => {
    const params = new URLSearchParams({ limit: '50' })
    if (esJefeDeProyecto && sesion?.id) params.append('responsable_id', sesion.id)
    const respuesta = await pedir(`/proyectos/detalles?${params.toString()}`)
    setProyectos(respuesta.items)
    setErrorCargaProyectos('')
  }

  const reintentarUsuarios = async () => {
    setCargando(true)
    setErrorCargaUsuarios('')
    try { await cargar() } catch (err) { setErrorCargaUsuarios(err.message) }
    finally { setCargando(false) }
  }
  const reintentarProyectos = async () => {
    setCargandoProyectos(true)
    setErrorCargaProyectos('')
    try { await cargarProyectos() } catch (err) { setErrorCargaProyectos(err.message) }
    finally { setCargandoProyectos(false) }
  }

  useEffect(() => {
    cargar()
      .catch((err) => setErrorCargaUsuarios(err.message))
      .finally(() => setCargando(false))

    cargarProyectos()
      .catch((err) => setErrorCargaProyectos(err.message))
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

  const abrirFormulario = (datosFormulario, origen = document.activeElement) => {
    formularioOrigenRef.current = origen
    setErrorFormulario('')
    setFormulario(datosFormulario)
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!formulario || guardandoUsuario) return
    setGuardandoUsuario(true)
    setErrorFormulario('')
    const datos = formulario.datos
    let guardado = false
    try {
      let invitacionCreada = null
      if (formulario.modo === 'crear') {
        const creado = await pedir('/usuarios', {
          method: 'POST',
          body: JSON.stringify({ nombre: datos.nombre, correo: datos.correo, contrasena: datos.contrasena, rol: datos.rol }),
        })
        invitacionCreada = { tipo: 'usuario', correo: creado.correo, enviada: creado.invitacion_enviada }
      } else {
        await pedir(`/usuarios/${formulario.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nombre: datos.nombre, correo: datos.correo, rol: datos.rol }),
        })
      }
      setFormulario(null)
      if (invitacionCreada) setInvitacion(invitacionCreada)
      guardado = true
    } catch (err) {
      setErrorFormulario(err.message)
    } finally {
      setGuardandoUsuario(false)
    }
    // Una lectura fallida tras guardar no debe provocar una segunda creación.
    if (guardado) {
      try { await cargar() } catch (err) { setErrorCargaUsuarios(err.message) }
    }
  }

  const invitarMiembro = async (e) => {
    e.preventDefault()
    if (!invitarA || enviandoInvitacion || !invitarA.usuarioId) return
    setErrorInvitacion('')
    setEnviandoInvitacion(true)
    let registrada = false
    try {
      const creado = await pedir(`/proyectos/${invitarA.proyecto.id}/usuarios`, {
        method: 'POST',
        body: JSON.stringify({ usuario_id: Number(invitarA.usuarioId), rol_proyecto: invitarA.rolProyecto, cargo: invitarA.cargo || null }),
      })
      setInvitarA(null)
      setInvitacion({ tipo: 'proyecto', correo: creado.correo, enviada: creado.invitacion_enviada })
      registrada = true
    } catch (err) {
      setErrorInvitacion(err.message)
    } finally {
      setEnviandoInvitacion(false)
    }
    if (registrada) {
      try { await cargarProyectos() } catch (err) { setErrorCargaProyectos(err.message) }
    }
  }

  const confirmarEliminarUsuario = async () => {
    if (!usuarioAEliminar || eliminandoUsuario) return
    setErrorEliminarUsuario('')
    setEliminandoUsuario(true)
    let eliminado = false
    try {
      await pedir(`/usuarios/${usuarioAEliminar.id}`, { method: 'DELETE' })
      setUsuarioEliminado(usuarioAEliminar)
      setUsuarioAEliminar(null)
      eliminado = true
    } catch (err) {
      setErrorEliminarUsuario(err.message)
    } finally {
      setEliminandoUsuario(false)
    }
    if (eliminado) {
      await Promise.all([
        cargar().catch((err) => setErrorCargaUsuarios(err.message)),
        cargarProyectos().catch((err) => setErrorCargaProyectos(err.message)),
      ])
    }
  }

  const confirmarAccionMiembro = async () => {
    if (!accionMiembro || procesandoMiembro) return
    setErrorAccionMiembro('')
    setProcesandoMiembro(true)
    let completada = false
    try {
      const { proyectoId, usuario, tipo, proyectoNombre } = accionMiembro
      if (tipo === 'cancelar' || tipo === 'eliminar') {
        await pedir(`/proyectos/${proyectoId}/usuarios/${usuario.id}`, { method: 'DELETE' })
      } else {
        await pedir(`/proyectos/${proyectoId}/usuarios/${usuario.id}/estado`, {
          method: 'PATCH', body: JSON.stringify({ activo: tipo === 'habilitar' }),
        })
      }
      setAccionMiembro(null)
      if (tipo === 'eliminar') setMiembroEliminado({ ...usuario, proyectoNombre })
      completada = true
    } catch (err) {
      setErrorAccionMiembro(err.message)
    } finally {
      setProcesandoMiembro(false)
    }
    if (completada) {
      try { await cargarProyectos() } catch (err) { setErrorCargaProyectos(err.message) }
    }
  }

  const accionesUsuario = (usuario) => <UsuariosAccionesMenu nombre={usuario.nombre} acciones={[
    { label: 'Editar', onClick: (origen) => abrirFormulario({ modo: 'editar', id: usuario.id, datos: { nombre: usuario.nombre, correo: usuario.correo, contrasena: '', rol: usuario.rol } }, origen) },
    ...(puedeEliminar ? [{ label: 'Eliminar', peligro: true, onClick: (origen) => { eliminarUsuarioOrigenRef.current = origen; setErrorEliminarUsuario(''); setUsuarioAEliminar(usuario) } }] : []),
  ]} />

  const accionesMiembro = (miembro) => {
    const pendiente = esInvitacionPendiente(miembro)
    const inhabilitado = !pendiente && miembro.activo === false
    const abrir = (tipo, origen) => {
      accionMiembroOrigenRef.current = origen
      setErrorAccionMiembro('')
      setAccionMiembro({ proyectoId: proyectoActivo.id, proyectoNombre: proyectoActivo.nombre, usuario: miembro, tipo })
    }
    return puedeEliminar && !pendiente ? <UsuariosAccionesMenu nombre={miembro.nombre} acciones={[
      { label: inhabilitado ? 'Habilitar' : 'Inhabilitar', onClick: (origen) => abrir(inhabilitado ? 'habilitar' : 'inhabilitar', origen) },
      { label: 'Eliminar', peligro: true, onClick: (origen) => abrir('eliminar', origen) },
    ]} /> : <Button className="usuarios__btn-texto" onClick={(e) => abrir(pendiente ? 'cancelar' : inhabilitado ? 'habilitar' : 'inhabilitar', e.currentTarget)}>{pendiente ? 'Cancelar invitación' : inhabilitado ? 'Habilitar' : 'Inhabilitar'}</Button>
  }

  return (
    <div className="usuarios usuarios--modern" data-docai-layout="modern">
      <PageHeader title="Gestión de Usuarios" description="Administra las cuentas, roles y accesos de todos los usuarios de DocAI."
        actions={<Button variant="primary" onClick={() => abrirFormulario({ modo: 'crear', datos: { ...VACIO } })}><IconMas />Nuevo Usuario</Button>} />

      <nav className="usuarios__tabs" aria-label="Vistas de usuarios">
        <Button
          type="button"
          aria-pressed={tab === 'todos'} className={`usuarios__tab ${tab === 'todos' ? 'usuarios__tab--activo' : ''}`}
          onClick={() => setTab('todos')}
        >
          <IconUsuarios size={16} />
          Todos los Usuarios
        </Button>
        <Button
          type="button"
          aria-pressed={tab === 'proyecto'} className={`usuarios__tab ${tab === 'proyecto' ? 'usuarios__tab--activo' : ''}`}
          onClick={() => setTab('proyecto')}
        >
          <IconCarpeta size={16} />
          Por Proyecto
        </Button>
      </nav>


      {tab === 'proyecto' ? (
        cargandoProyectos ? (
          <div className="usuarios__vacio">Cargando proyectos...</div>
        ) : errorCargaProyectos ? (
          <div className="usuarios__vacio" role="alert"><p>{errorCargaProyectos}</p><Button onClick={reintentarProyectos}>Reintentar</Button></div>
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
                <Button
                  type="button"
                  variant="primary" className="usuarios__btn-nuevo"
                  disabled={!proyectoActivo}
                  onClick={() => {
                    invitacionOrigenRef.current = document.activeElement
                    setErrorInvitacion('')
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
                </Button>
              </div>

              <div className="usuarios__pp-barra">
                <div className="usuarios__pp-selector">
                  <span className="usuarios__pp-selector-label">SELECCIONAR PROYECTO:</span>
                  <div className="usuarios__select-wrap">
                    <select
                      ref={selectorProyectoRef} aria-label="Seleccionar proyecto" value={proyectoSeleccionadoId ?? ''}
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
                    <ProyectoEstadoBadge estado={proyectoActivo.estado} archivado={proyectoActivo.archivado} />
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
                <UsuariosTabla porProyecto usuarios={proyectoActivo.miembros} renderAcciones={accionesMiembro} />

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
            <SurfaceCard as="div" className="usuarios__stat">
              <div className="usuarios__stat-cabecera"><span className="usuarios__stat-icono" aria-hidden="true"><IconUsuarios size={19} /></span><span className="usuarios__stat-etiqueta">Usuarios Totales</span></div>
              <div className="usuarios__stat-fila">
                <span className="usuarios__stat-valor">{cargando || errorCargaUsuarios ? '—' : totales.total}</span>
                <span className="usuarios__stat-detalle">Usuarios registrados en la plataforma</span>
              </div>
            </SurfaceCard>

            <SurfaceCard as="div" className="usuarios__stat">
              <div className="usuarios__stat-cabecera"><span className="usuarios__stat-icono" aria-hidden="true"><IconCheckCirculo size={19} /></span><span className="usuarios__stat-etiqueta">Usuarios Activos</span></div>
              <div className="usuarios__stat-fila">
                <span className="usuarios__stat-valor">{cargando || errorCargaUsuarios ? '—' : totales.activos}</span>
                <span className="usuarios__stat-detalle">Activos en la plataforma</span>
              </div>
            </SurfaceCard>

            <SurfaceCard as="div" className="usuarios__stat">
              <div className="usuarios__stat-cabecera"><span className="usuarios__stat-icono" aria-hidden="true"><IconRoles size={19} /></span><span className="usuarios__stat-etiqueta">Usuarios Inactivos</span></div>
              <div className="usuarios__stat-fila">
                <span className="usuarios__stat-valor">{cargando || errorCargaUsuarios ? '—' : totales.inactivos}</span>
                <span className="usuarios__stat-detalle">Sin acceso registrado</span>
              </div>
            </SurfaceCard>
          </div>

          <div className="usuarios__controles">
            <div className="usuarios__buscador">
              <IconBuscar size={14} className="usuarios__buscador-icono" />
              <input
                type="text"
                ref={buscarUsuariosRef}
                aria-label="Buscar por nombre o correo"
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
                  aria-label="Filtrar por rol" value={filtroRol}
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
                  aria-label="Filtrar por estado" value={filtroEstado}
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
                  aria-label="Ordenar usuarios" value={orden}
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
            <UsuariosTabla usuarios={usuariosPagina} total={usuarios.length} cargando={cargando}
              error={errorCargaUsuarios} onReintentar={reintentarUsuarios} renderAcciones={accionesUsuario}
              onLimpiar={() => { setBusqueda(''); setFiltroRol('Todos'); setFiltroEstado('Todos'); setPagina(1) }} />

            {!cargando && !errorCargaUsuarios && (
            <div className="usuarios__pie">
              <span className="usuarios__pie-info">
                Mostrando <strong>{usuariosFiltrados.length === 0 ? 0 : (paginaActual - 1) * POR_PAGINA + 1}-
                {Math.min(paginaActual * POR_PAGINA, usuariosFiltrados.length)}</strong> de{' '}
                <strong>{usuariosFiltrados.length}</strong> usuarios registrados
              </span>

              {totalPaginas > 1 && (
                <div className="usuarios__paginacion">
                  <Button
                    type="button"
                    aria-label="Página anterior" disabled={paginaActual === 1}
                    onClick={() => setPagina(paginaActual - 1)}
                  >
                    &lt;
                  </Button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                    <Button
                      key={n}
                      type="button"
                      aria-label={`Página ${n}`} aria-current={n === paginaActual ? 'page' : undefined} className={n === paginaActual ? 'usuarios__pagina-activa' : ''}
                      onClick={() => setPagina(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    aria-label="Página siguiente" disabled={paginaActual === totalPaginas}
                    onClick={() => setPagina(paginaActual + 1)}
                  >
                    &gt;
                  </Button>
                </div>
              )}
            </div>
            )}
          </div>
        </>
      )}

      <UsuarioFormulario formulario={formulario} guardando={guardandoUsuario} error={errorFormulario}
        returnFocusRef={formularioOrigenRef} onSubmit={guardar}
        onClose={() => { if (!guardandoUsuario) setFormulario(null) }}
        onChange={(datos) => setFormulario((actual) => actual ? { ...actual, datos } : actual)} />

      <MiembroAccionModal accion={accionMiembro} procesando={procesandoMiembro} error={errorAccionMiembro}
        returnFocusRef={accionMiembro?.tipo === 'cancelar' ? selectorProyectoRef : accionMiembroOrigenRef}
        onClose={() => { if (!procesandoMiembro) setAccionMiembro(null) }} onConfirm={confirmarAccionMiembro} />
      <MiembroEliminadoResultado miembro={miembroEliminado} onClose={() => setMiembroEliminado(null)} returnFocusRef={selectorProyectoRef} />

      <EliminarCuentaModal usuario={usuarioAEliminar} eliminando={eliminandoUsuario} error={errorEliminarUsuario}
        returnFocusRef={eliminarUsuarioOrigenRef} onConfirm={confirmarEliminarUsuario}
        onClose={() => { if (!eliminandoUsuario) setUsuarioAEliminar(null) }} />
      <CuentaEliminadaResultado usuario={usuarioEliminado} onClose={() => setUsuarioEliminado(null)} returnFocusRef={buscarUsuariosRef} />

      <InvitarUsuarioFormulario invitacion={invitarA} enviando={enviandoInvitacion} error={errorInvitacion}
        returnFocusRef={invitacionOrigenRef} onSubmit={invitarMiembro}
        onClose={() => { if (!enviandoInvitacion) setInvitarA(null) }}
        onChange={(datos) => setInvitarA((actual) => actual ? datos : actual)} />
      <InvitacionResultado invitacion={invitacion} onClose={() => setInvitacion(null)}
        returnFocusRef={invitacion?.tipo === 'proyecto' ? invitacionOrigenRef : formularioOrigenRef} />
    </div>
  )
}
