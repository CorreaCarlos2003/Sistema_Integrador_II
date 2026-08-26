import { useEffect, useState } from 'react'
import './Usuarios.css'

const VACIO = { nombre: '', correo: '', contrasena: '', rol: 'Analista' }

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

export default function Usuarios({ sesion, onCerrarSesion, onVolver }) {
  const [usuarios, setUsuarios] = useState([])
  const [formulario, setFormulario] = useState(null)
  const [eliminarId, setEliminarId] = useState(null)
  const [error, setError] = useState('')

  const cargar = async () => {
    const lista = await pedir('/usuarios')
    setUsuarios(lista)
  }

  useEffect(() => {
    cargar().catch((err) => setError(err.message))
  }, [])

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

  return (
    <div className="admin">
      <header className="admin__barra">
        <div>
          <p className="admin__marca">Panel de administración</p>
          <h1 className="admin__titulo">Usuarios</h1>
        </div>
        <div className="admin__sesion">
          {onVolver && (
            <button className="admin__boton admin__boton--texto" type="button" onClick={onVolver}>
              ← Volver al Dashboard
            </button>
          )}
          <span>
            {sesion.nombre} · {sesion.rol}
          </span>
          <button className="admin__boton" type="button" onClick={onCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="admin__contenido">
        <div className="admin__acciones">
          {error && <p className="admin__error">{error}</p>}
          <button
            className="admin__boton"
            type="button"
            onClick={() => setFormulario({ modo: 'crear', datos: { ...VACIO } })}
          >
            Nuevo usuario
          </button>
        </div>

        <div className="admin__tabla-wrap">
          <table className="admin__tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.correo}</td>
                  <td>{usuario.rol}</td>
                  <td>
                    <span className={usuario.estado ? 'admin__estado admin__estado--activo' : 'admin__estado'}>
                      {usuario.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="admin__fila-acciones">
                    <button
                      type="button"
                      title="Editar"
                      aria-label="Editar"
                      onClick={() =>
                        setFormulario({
                          modo: 'editar',
                          id: usuario.id,
                          datos: { nombre: usuario.nombre, correo: usuario.correo, contrasena: '', rol: usuario.rol },
                        })
                      }
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title={usuario.estado ? 'Desactivar' : 'Activar'}
                      aria-label={usuario.estado ? 'Desactivar' : 'Activar'}
                      onClick={() => cambiarEstado(usuario)}
                    >
                      {usuario.estado ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="m4.9 4.9 14.2 14.2" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      className="admin__peligro"
                      title="Eliminar"
                      aria-label="Eliminar"
                      onClick={() => setEliminarId(usuario.id)}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6v14H5V6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {formulario && (
        <div className="admin__fondo" onClick={() => setFormulario(null)}>
          <form className="admin__modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
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

            <div className="admin__modal-acciones">
              <button className="admin__boton admin__boton--texto" type="button" onClick={() => setFormulario(null)}>
                Cancelar
              </button>
              <button className="admin__boton" type="submit">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {eliminarId !== null && (
        <div className="admin__fondo" onClick={() => setEliminarId(null)}>
          <div className="admin__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Eliminar usuario</h2>
            <p>Esta cuenta dejará de tener acceso a la plataforma.</p>
            <div className="admin__modal-acciones">
              <button className="admin__boton admin__boton--texto" type="button" onClick={() => setEliminarId(null)}>
                Cancelar
              </button>
              <button
                className="admin__boton admin__boton--peligro"
                type="button"
                onClick={eliminar}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
