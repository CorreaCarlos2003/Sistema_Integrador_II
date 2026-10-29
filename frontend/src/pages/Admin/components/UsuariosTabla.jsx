import { getInitials, getAvatarColors } from '../../../utils/avatarUtils'
import Button from '../../../components/ui/Button'

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


export default function UsuariosTabla({ usuarios, porProyecto = false, cargando = false, error, onReintentar, total = 0, renderAcciones, onLimpiar }) {
  const columnas = porProyecto ? 6 : 7
  return (
    <div className="usuarios-tabla-scroll" role="region" aria-label={porProyecto ? 'Miembros del proyecto' : 'Listado de usuarios'} tabIndex={0} aria-busy={cargando}>
      <table className={`usuarios__tabla ${porProyecto ? 'usuarios__tabla--proyecto' : ''}`} aria-label={porProyecto ? 'Usuarios del proyecto' : 'Usuarios registrados'}>
        <colgroup><col /><col className="usuarios-tabla__correo" /><col className="usuarios-tabla__rol" />
          <col className={porProyecto ? 'usuarios-tabla__rol-proyecto' : 'usuarios-tabla__estado'} />
          <col className="usuarios-tabla__fecha" />{!porProyecto && <col className="usuarios-tabla__fecha" />}<col className="usuarios-tabla__acciones" />
        </colgroup>
        <thead><tr>
          <th scope="col">Usuario</th><th scope="col">Correo</th><th scope="col">{porProyecto ? 'Rol en el sistema' : 'Rol'}</th>
          <th scope="col">{porProyecto ? 'Rol en el proyecto' : 'Estado'}</th><th scope="col">{porProyecto ? 'Ingreso al proyecto' : 'Último acceso'}</th>
          {!porProyecto && <th scope="col">Fecha de registro</th>}<th scope="col" className="usuarios__col-acciones">Acciones</th>
        </tr></thead>
        <tbody>
          {cargando ? <tr><td colSpan={columnas} className="usuarios__tabla-vacio"><p role="status">Cargando usuarios...</p></td></tr>
            : error ? <tr><td colSpan={columnas} className="usuarios__tabla-vacio"><div role="alert"><strong>No pudimos cargar el listado</strong><p>{error}</p><Button onClick={onReintentar}>Reintentar</Button></div></td></tr>
            : usuarios.length === 0 ? <tr><td colSpan={columnas} className="usuarios__tabla-vacio"><strong>{porProyecto ? 'Este proyecto aún no tiene miembros.' : total === 0 ? 'No hay usuarios registrados.' : 'No se encontraron usuarios con los filtros seleccionados.'}</strong>{!porProyecto && total > 0 && <p><Button onClick={onLimpiar}>Limpiar filtros</Button></p>}</td></tr>
            : usuarios.map((usuario) => {
              const pendiente = porProyecto && usuario.estado_invitacion === 'PENDIENTE'
              const inhabilitado = porProyecto && !pendiente && usuario.activo === false
              const rol = badgeRolSistema(usuario.rol)
              const rolProyecto = badgeRolProyecto(usuario.rol_proyecto)
              return <tr key={usuario.id} className={pendiente ? 'usuarios__fila-pendiente' : inhabilitado ? 'usuarios__fila-inhabilitada' : ''}>
                <th scope="row"><div className="usuarios__usuario-celda">{renderAvatar(usuario, inhabilitado)}<span className="usuarios__nombre">{usuario.nombre}</span></div></th>
                <td className="usuarios__correo">{usuario.correo}</td><td><span className={rol.className}>{rol.label}</span></td>
                <td>{porProyecto ? <span className={pendiente ? 'usuarios__rol-proyecto-badge usuarios__rol-proyecto-badge--pendiente' : inhabilitado ? 'usuarios__rol-proyecto-badge usuarios__rol-proyecto-badge--inhabilitado' : rolProyecto.className}>{pendiente ? 'Invitación pendiente' : inhabilitado ? 'Inhabilitado' : rolProyecto.label}</span>
                  : <span className={`usuarios__estado ${usuario.activo ? 'usuarios__estado--activo' : ''}`}><span className="usuarios__estado-dot" aria-hidden="true" />{usuario.activo ? 'Activo' : 'Inactivo'}</span>}</td>
                <td className="usuarios__tenue">{porProyecto ? pendiente ? 'Pendiente de aceptar' : formatFechaCorta(usuario.fecha_ingreso) : formatFecha(usuario.ultimo_acceso)}</td>
                {!porProyecto && <td className="usuarios__tenue">{formatFecha(usuario.fecha_creacion)}</td>}
                <td className="usuarios__col-acciones">{renderAcciones(usuario)}</td>
              </tr>
            })}
        </tbody>
      </table>
    </div>
  )
}
