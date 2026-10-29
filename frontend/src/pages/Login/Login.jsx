import { useRef, useState } from 'react'
import './Login.css'
import DocAILogo from '../../components/ui/DocAILogo'
import ojoIcono from '../../assets/login/ojo-icono.svg'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import LoginVisual from './LoginVisual'
import RecuperarAcceso from './RecuperarAcceso'

const API_URL = ''

export default function Login({ onLoginExitoso }) {
  const recoveryOriginRef = useRef(null)
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

  const abrirRecuperacion = (event) => {
    recoveryOriginRef.current = event.currentTarget
    setError('')
    setEnviado(false)
    setOlvido(true)
  }

  const volverAIniciarSesion = () => {
    setOlvido(false)
    setEnviado(false)
    setError('')
    requestAnimationFrame(() => {
      const origin = recoveryOriginRef.current
      if (origin?.isConnected) origin.focus()
      else document.querySelector(origin?.classList.contains('login__forgot-inline') ? '.login__forgot-inline' : '.login__ayuda button')?.focus()
    })
  }

  return (
    <div className="login login--modern">
      <main className="login__main">
        <section className="login__card" aria-label="Acceso a DocAI">
          <div className="login__brand"><DocAILogo size={32} /></div>
          <div className="login__marca">
            <p className="login__eyebrow"><span />Tu espacio de trabajo inteligente</p>
            <h1 className={`login__titulo ${olvido ? 'login__titulo--recovery' : ''}`}>
              {olvido ? 'Recuperar contraseña' : <>Bienvenido<br />de nuevo<span className="login__title-dot">.</span></>}
            </h1>
            <p className="login__descripcion">{olvido ? 'Solicita ayuda para volver a tu espacio de trabajo.' : 'Donde tus proyectos, documentos e ideas trabajan juntos.'}</p>
          </div>

          {olvido ? (
            <RecuperarAcceso correo={correo} onCorreoChange={setCorreo} onSubmit={manejarRecuperar} onVolver={volverAIniciarSesion} cargando={cargando} error={error} enviado={enviado} />
          ) : (
            <form className="login__formulario" onSubmit={manejarSubmit}>
              <FormField htmlFor="correo" label="Correo electrónico">
                <input
                  id="correo"
                  className="login__input"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  autoComplete="username"
                  disabled={cargando}
                />
              </FormField>

              <div className="login__password-field">
              <FormField htmlFor="contrasena" label="Contraseña">
                <div className="login__input-envoltura">
                  <input
                    id="contrasena"
                    className="login__input"
                    type={mostrarContrasena ? 'text' : 'password'}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    disabled={cargando}
                  />
                  <button
                    type="button"
                    className="login__alternar-contrasena"
                    disabled={cargando}
                    aria-pressed={mostrarContrasena}
                    onClick={() => setMostrarContrasena((v) => !v)}
                    aria-label={
                      mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    <img src={ojoIcono} alt="" />
                  </button>
                </div>
              </FormField>
                <button className="login__olvido login__forgot-inline" type="button" disabled={cargando} onClick={abrirRecuperacion}>¿La olvidaste?</button>
              </div>

              <div className="login__utilidades">
                <label className="login__recordar">
                  <input
                    type="checkbox"
                    disabled={cargando}
                    checked={recordarme}
                    onChange={(e) => setRecordarme(e.target.checked)}
                  />
                  Recordarme
                </label>

              </div>

              {error && <p className="login__error" role="alert">{error}</p>}

              <Button variant="primary" className="login__boton" type="submit" disabled={cargando}>
                {cargando ? 'Ingresando...' : <>Iniciar sesión <span aria-hidden="true">→</span></>}
              </Button>


            </form>
          )}

          {!olvido && <p className="login__ayuda">¿Problemas para ingresar? <button type="button" className="login__olvido" disabled={cargando} onClick={abrirRecuperacion}>Recupera tu acceso</button></p>}
          <footer className="login__pie"><span>© DocAI · Tu conocimiento, conectado.</span></footer>
        </section>
        <LoginVisual />
      </main>
    </div>
  )
}
