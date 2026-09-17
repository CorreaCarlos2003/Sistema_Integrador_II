import { useEffect, useMemo, useState } from 'react'
import { getInitials, getAvatarColors } from '../../utils/avatarUtils'
import { IconUsuarios, IconCarpeta, IconBuscar } from '../../components/icons'
import './Usuarios.css'

const VACIO = { nombre: '', correo: '', contrasena: '', rol: 'Analista' }
const POR_PAGINA = 8

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

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [formulario, setFormulario] = useState(null)
  const [eliminarId, setEliminarId] = useState(null)
  const [error, setError] = useState('')
  const [menuAbiertoId, setMenuAbiertoId] = useState(null)

  const [tab, setTab] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [pagina, setPagina] = useState(1)

  const cargar = async () => {
    const lista = await pedir('/usuarios')
    setUsuarios(lista)
  }

  useEffect(() => {
    cargar()
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  const roles = useMemo(() => {
    const unicos = new Set(usuarios.map((u) => u.rol).filter(Boolean))
    return ['Todos', ...unicos]
  }, [usuarios])

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const texto = busqueda.trim().toLowerCase()
      const coincideBusqueda =
        !texto || u.nombre.toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto)
      const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol
      const coincideEstado =
        filtroEstado === 'Todos' || (filtroEstado === 'Activo' ? u.estado : !u.estado)
      return coincideBusqueda && coincideRol && coincideEstado
    })
  }, [usuarios, busqueda, filtroRol, filtroEstado])

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const usuariosPagina = usuariosFiltrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  )

  const totales = useMemo(
    () => ({
      total: usuarios.length,
      activos: usuarios.filter((u) => u.estado).length,
      inactivos: usuarios.filter((u) => !u.estado).length,
    }),
    [usuarios]
  )

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    const datos = formulario.datos

    try {
      if (formulario.modo === 'crear') {
        await pedir('/usuarios', {
          method: 'POST',
          body: JSON.stringify({
            nombre: datos.nombre,
            correo: datos.correo,
            contrasena: datos.contrasena,
            rol: datos.rol,
          }),
        })
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

  const cambiarEstado = async (usuario) => {
    setError('')
    setMenuAbiertoId(null)
    try {
      await pedir(`/usuarios/${usuario.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: usuario.estado ? 0 : 1 }),
      })
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const eliminar = async () => {
    setError('')
    try {
      await pedir(`/usuarios/${eliminarId}`, { method: 'DELETE' })
      setEliminarId(null)
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const renderAvatar = (usuario) => {
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
        <div className="usuarios__vacio">
          La vista de usuarios agrupados por proyecto todavía no está disponible.
        </div>
      ) : (
        <>
          <div className="usuarios__stats">
            <div className="usuarios__stat">
              <span className="usuarios__stat-etiqueta">Usuarios Totales</span>
              <div className="usuarios__stat-fila">
                <span className="usuarios__stat-valor">{totales.total}</span>
                <span className="usuarios__stat-detalle">{totales.activos} activos en plataforma</span>
              </div>
            </div>

            <div className="usuarios__stat">
              <div className="usuarios__stat-titulo-fila">
                <span className="usuarios__stat-etiqueta">Pendientes de Aprobación</span>
              </div>
              <div className="usuarios__stat-fila">
                <span className="usuarios__stat-valor">0</span>
                <span className="usuarios__stat-detalle">Sin solicitudes pendientes</span>
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
                <select defaultValue="reciente">
                  <option value="reciente">Ordenar por: Más reciente</option>
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
                        <span className={`usuarios__estado ${usuario.estado ? 'usuarios__estado--activo' : ''}`}>
                          <span className="usuarios__estado-dot" />
                          {usuario.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="usuarios__tenue">—</td>
                      <td className="usuarios__tenue usuarios__mono">—</td>
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
                              <button type="button" onClick={() => cambiarEstado(usuario)}>
                                {usuario.estado ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                type="button"
                                className="usuarios__menu-peligro"
                                onClick={() => {
                                  setMenuAbiertoId(null)
                                  setEliminarId(usuario.id)
                                }}
                              >
                                Eliminar
                              </button>
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
              <option value="Analista">Analista</option>
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

      {eliminarId !== null && (
        <div className="usuarios__fondo" onClick={() => setEliminarId(null)}>
          <div className="usuarios__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Eliminar usuario</h2>
            <p className="usuarios__modal-texto">Esta cuenta dejará de tener acceso a la plataforma.</p>
            <div className="usuarios__modal-acciones">
              <button type="button" className="usuarios__btn-texto" onClick={() => setEliminarId(null)}>
                Cancelar
              </button>
              <button type="button" className="usuarios__btn-peligro" onClick={eliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
