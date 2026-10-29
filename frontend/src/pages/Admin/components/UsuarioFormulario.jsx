import { useId, useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import FormField from '../../../components/ui/FormField'
import Button from '../../../components/ui/Button'
import { IconUsuarios } from '../../../components/icons'
import './UsuarioFormulario.css'

export default function UsuarioFormulario({ formulario, guardando, error, onChange, onSubmit, onClose, returnFocusRef }) {
  const id = useId()
  const nombreRef = useRef(null)
  if (!formulario) return null
  const crear = formulario.modo === 'crear'
  const { datos } = formulario
  const cambiar = (campo) => (e) => onChange({ ...datos, [campo]: e.target.value })
  return (
    <ModalShell open onClose={onClose} title={crear ? 'Nuevo usuario' : 'Editar usuario'}
      description={crear ? 'Crea una cuenta de acceso a DocAI.' : 'Actualiza los datos y el rol de esta cuenta.'}
      icon={<IconUsuarios size={20} />} className="usuario-formulario" busy={guardando} dismissOnBackdrop
      initialFocusRef={nombreRef} returnFocusRef={returnFocusRef}
      footer={<><Button onClick={onClose} disabled={guardando}>Cancelar</Button><Button type="submit" form={id} variant="primary" disabled={guardando}>{guardando ? 'Guardando...' : crear ? 'Crear usuario' : 'Guardar cambios'}</Button></>}>
      <form id={id} className="usuario-formulario__campos" onSubmit={onSubmit}>
        <FormField htmlFor={`${id}-nombre`} label="Nombre" required className="usuario-formulario__completo">
          <input ref={nombreRef} id={`${id}-nombre`} value={datos.nombre} onChange={cambiar('nombre')} required disabled={guardando} autoComplete="name" placeholder="Nombre completo" />
        </FormField>
        <FormField htmlFor={`${id}-correo`} label="Correo" required className="usuario-formulario__completo">
          <input id={`${id}-correo`} type="email" value={datos.correo} onChange={cambiar('correo')} required disabled={guardando} autoComplete="email" placeholder="nombre@organizacion.com" />
        </FormField>
        <FormField htmlFor={`${id}-rol`} label="Rol" className={crear ? '' : 'usuario-formulario__completo'}>
          <select id={`${id}-rol`} value={datos.rol} onChange={cambiar('rol')} disabled={guardando}>
            <option value="Administrador">Administrador</option><option value="Jefe de Proyecto">Jefe de Proyecto</option><option value="Colaborador">Colaborador</option>
          </select>
        </FormField>
        {crear && <FormField htmlFor={`${id}-contrasena`} label="Contraseña" required>
          <input id={`${id}-contrasena`} type="password" value={datos.contrasena} onChange={cambiar('contrasena')} required disabled={guardando} autoComplete="new-password" />
        </FormField>}
        {guardando && <p className="usuario-formulario__estado" role="status">Guardando los datos del usuario...</p>}
        {error && <p className="usuario-formulario__error" role="alert">{error}</p>}
      </form>
    </ModalShell>
  )
}
