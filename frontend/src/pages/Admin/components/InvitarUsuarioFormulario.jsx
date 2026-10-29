import { useId, useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import FormField from '../../../components/ui/FormField'
import Button from '../../../components/ui/Button'
import { IconUsuarioMas } from '../../../components/icons'
import './InvitacionUsuario.css'

export default function InvitarUsuarioFormulario({ invitacion, enviando, error, onChange, onSubmit, onClose, returnFocusRef }) {
  const id = useId()
  const usuarioRef = useRef(null)
  if (!invitacion) return null
  const disponible = invitacion.opciones.length > 0
  const cambiar = (campo) => (e) => onChange({ ...invitacion, [campo]: e.target.value })
  return (
    <ModalShell open onClose={onClose} title="Agregar usuario al proyecto"
      description="Invita a una cuenta existente y define su participación en el proyecto."
      icon={<IconUsuarioMas size={20} />} className="invitacion-usuario" busy={enviando} dismissOnBackdrop
      initialFocusRef={usuarioRef} returnFocusRef={returnFocusRef}
      footer={<><Button onClick={onClose} disabled={enviando}>Cancelar</Button><Button type="submit" form={id} variant="primary" disabled={enviando || !disponible}>{enviando ? 'Enviando...' : 'Enviar invitación'}</Button></>}>
      <p className="invitacion-usuario__proyecto"><span>Proyecto</span><strong>{invitacion.proyecto.nombre}</strong></p>
      <form id={id} className="invitacion-usuario__campos" onSubmit={onSubmit}>
        <FormField htmlFor={`${id}-usuario`} label="Usuario" required className="invitacion-usuario__completo">
          <select ref={usuarioRef} id={`${id}-usuario`} required value={invitacion.usuarioId} onChange={cambiar('usuarioId')} disabled={enviando || !disponible}>
            {!disponible && <option value="">No hay usuarios disponibles</option>}
            {invitacion.opciones.map((u) => <option key={u.id} value={u.id}>{u.nombre} ({u.correo})</option>)}
          </select>
        </FormField>
        <FormField htmlFor={`${id}-rol`} label="Rol en el proyecto">
          <select id={`${id}-rol`} value={invitacion.rolProyecto} onChange={cambiar('rolProyecto')} disabled={enviando || !disponible}>
            <option value="MIEMBRO">Miembro</option><option value="RESPONSABLE">Responsable</option>
          </select>
        </FormField>
        <FormField htmlFor={`${id}-cargo`} label="Cargo" optional>
          <input id={`${id}-cargo`} placeholder="Ej. Analista de datos" value={invitacion.cargo} onChange={cambiar('cargo')} disabled={enviando || !disponible} />
        </FormField>
        {!disponible && <p className="invitacion-usuario__nota" role="status">No hay usuarios disponibles para agregar a este proyecto.</p>}
        {enviando && <p className="invitacion-usuario__nota" role="status">Registrando la invitación...</p>}
        {error && <p className="invitacion-usuario__error" role="alert">{error}</p>}
      </form>
    </ModalShell>
  )
}
