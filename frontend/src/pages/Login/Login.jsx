import { useState } from 'react'
import './Login.css'

const API_URL = ''

export default function Login({ onLoginExitoso }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [olvido, setOlvido] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const manejarSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null)
        throw new Error(detalle?.detail || 'Correo o contraseña incorrectos')
      }

      const datos = await respuesta.json()

      onLoginExitoso?.({
        id: datos.id,
        token: datos.access_token,
        rol: datos.rol,
        nombre: datos.nombre,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const manejarRecuperar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviado(false)
    setCargando(true)

    try {
      const respuesta = await fetch(`${API_URL}/auth/recuperar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo }),
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudo enviar el correo')
      }

      setEnviado(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  if (olvido) {
    return (
      <div className="login">
        <form className="login__formulario" onSubmit={manejarRecuperar}>
          <h1 className="login__titulo">Recuperar contraseña</h1>

          <label className="login__etiqueta" htmlFor="correo">
            Correo
          </label>
          <input
            id="correo"
            className="login__input"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          {error && <p className="login__error">{error}</p>}
          {enviado && (
            <p className="login__ok">
              Si el correo existe, te enviaremos tu contraseña.
            </p>
          )}

          <button className="login__boton" type="submit" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar'}
          </button>
          <button
            className="login__enlace"
            type="button"
            onClick={() => setOlvido(false)}
          >
            Volver al inicio de sesión
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="login">
      <form className="login__formulario" onSubmit={manejarSubmit}>
        <h1 className="login__titulo">Iniciar sesión</h1>

        <label className="login__etiqueta" htmlFor="correo">
          Correo
        </label>
        <input
          id="correo"
          className="login__input"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />

        <label className="login__etiqueta" htmlFor="contrasena">
          Contraseña
        </label>
        <input
          id="contrasena"
          className="login__input"
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
        />

        {error && <p className="login__error">{error}</p>}

        <button
          className="login__enlace"
          type="button"
          onClick={() => {
            setOlvido(true)
            setEnviado(false)
            setError('')
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>

        <button className="login__boton" type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
