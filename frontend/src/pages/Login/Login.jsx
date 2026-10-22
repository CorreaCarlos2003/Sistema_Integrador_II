import { useState } from 'react'
import './Login.css'
import documentoIcono from '../../assets/login/documento-icono.svg'
import ojoIcono from '../../assets/login/ojo-icono.svg'
import escudoIcono from '../../assets/login/escudo-icono.svg'

const API_URL = ''

export default function Login({ onLoginExitoso }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [recordarme, setRecordarme] = useState(false)
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

  const volverAIniciarSesion = () => {
    setOlvido(false)
    setEnviado(false)
    setError('')
  }

  return (
    <div className="login">
      <main className="login__main">
        <div className="login__card">
          <div className="login__marca">
            <div className="login__logo">
              <img className="login__logo-icono" src={documentoIcono} alt="" />
              <span className="login__logo-destello" />
            </div>
            <h2 className="login__nombre">Doc/AI</h2>
            <h1 className="login__titulo">
              {olvido ? 'Recuperar contraseña' : 'Iniciar sesión'}
            </h1>
          </div>

          {olvido ? (
            <form className="login__formulario" onSubmit={manejarRecuperar}>
              <div className="login__campo">
                <label className="login__etiqueta" htmlFor="correo">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  className="login__input"
                  type="email"
                  placeholder="admin@docai.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>

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
                className="login__olvido"
                type="button"
                onClick={volverAIniciarSesion}
              >
                Volver al inicio de sesión
              </button>
            </form>
          ) : (
            <form className="login__formulario" onSubmit={manejarSubmit}>
              <div className="login__campo">
                <label className="login__etiqueta" htmlFor="correo">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  className="login__input"
                  type="email"
                  placeholder="admin@docai.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>

              <div className="login__campo">
                <label className="login__etiqueta" htmlFor="contrasena">
                  Contraseña
                </label>
                <div className="login__input-envoltura">
                  <input
                    id="contrasena"
                    className="login__input"
                    type={mostrarContrasena ? 'text' : 'password'}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login__alternar-contrasena"
                    onClick={() => setMostrarContrasena((v) => !v)}
                    aria-label={
                      mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    <img src={ojoIcono} alt="" />
                  </button>
                </div>
              </div>

              <div className="login__utilidades">
                <label className="login__recordar">
                  <input
                    type="checkbox"
                    checked={recordarme}
                    onChange={(e) => setRecordarme(e.target.checked)}
                  />
                  Recordarme
                </label>
                <button
                  className="login__olvido"
                  type="button"
                  onClick={() => setOlvido(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && <p className="login__error">{error}</p>}

              <button className="login__boton" type="submit" disabled={cargando}>
                {cargando ? 'Ingresando...' : 'Ingresar al sistema'}
              </button>

              <div className="login__seguridad">
                <img src={escudoIcono} alt="" />
                <span>Cifrado TLS 1.3 de extremo a extremo •</span>
              </div>
            </form>
          )}

          <nav className="login__enlaces">
            <span>Estatus del Sistema</span>
            <span aria-hidden="true">•</span>
            <span>Política de Custodia</span>
            <span aria-hidden="true">•</span>
            <span>Soporte Técnico</span>
          </nav>
        </div>
      </main>

      <footer className="login__pie">
        <span>DOC/AI</span>
        <span aria-hidden="true">•</span>
        <span>© 2026</span>
      </footer>
    </div>
  )
}
