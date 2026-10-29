import { useEffect, useRef } from 'react'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'

export default function RecuperarAcceso({ correo, onCorreoChange, onSubmit, onVolver, cargando, error, enviado }) {
  const resultadoRef = useRef(null)
  useEffect(() => {
    if (enviado) resultadoRef.current?.focus()
  }, [enviado])

  if (enviado) {
    return (
      <div className="login__formulario">
        <section className="login-recovery__result" ref={resultadoRef} tabIndex={-1} role="status" aria-labelledby="recovery-result-title">
          <span className="login-recovery__icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg></span>
          <h2 id="recovery-result-title">Solicitud recibida</h2>
          <p>Si el correo existe, te enviaremos tu contraseña.</p>
          <strong className="login-recovery__email">{correo}</strong>
          <p className="login-recovery__hint">Revisa también la carpeta de correo no deseado.</p>
        </section>
        <Button variant="primary" className="login__boton" onClick={onVolver}>Volver al inicio de sesión</Button>
      </div>
    )
  }

  return (
    <form className="login__formulario" onSubmit={onSubmit} aria-busy={cargando}>
      <FormField htmlFor="correo" label="Correo electrónico">
        <input id="correo" className="login__input" type="email" placeholder="nombre@empresa.com" value={correo} onChange={(e) => onCorreoChange(e.target.value)} required autoComplete="username" disabled={cargando} autoFocus aria-describedby="recovery-help" />
      </FormField>
      <p className="login-recovery__hint" id="recovery-help">Utiliza el correo asociado a tu cuenta de DocAI.</p>
      {error && <p className="login__error" role="alert">{error}</p>}
      {cargando && <p className="login-recovery__progress" role="status">Procesando tu solicitud…</p>}
      <Button variant="primary" className="login__boton" type="submit" disabled={cargando}>{cargando ? 'Enviando...' : 'Enviar solicitud'}</Button>
      <button className="login__olvido login-recovery__back" type="button" disabled={cargando} onClick={onVolver}><span aria-hidden="true">← </span>Volver al inicio de sesión</button>
    </form>
  )
}
