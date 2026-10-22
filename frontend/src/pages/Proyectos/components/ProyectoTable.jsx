import { getInitials, getAvatarColors } from '../../../utils/avatarUtils'
import ProyectoAccionesMenu from './ProyectoAccionesMenu'

export default function ProyectoTable({ proyectos, sesion, onSeleccionarProyecto, onArchivarProyecto, onEliminarProyecto }) {
  if (!proyectos || proyectos.length === 0) {
    return (
      <div className="proyectos-vacio">
        <p>No se encontraron proyectos con los filtros seleccionados.</p>
      </div>
    )
  }

  const renderAvatar = (miembro, index) => {
    const { background, color } = getAvatarColors(miembro.nombre)
    return (
      <div 
        key={miembro.id || index}
        className="proyecto-card__avatar"
        style={{ backgroundColor: background, color: color, width: '24px', height: '24px', fontSize: '10px' }}
        title={`${miembro.nombre} ${miembro.rol ? `- ${miembro.rol}` : ''}`}
      >
        {getInitials(miembro.nombre)}
      </div>
    )
  }

  return (
    <div className="proyectos-tabla-wrap">
      <table className="proyectos-tabla">
        <thead>
          <tr>
            <th>Código</th>
            <th>Proyecto</th>
            <th>Responsable</th>
            <th>Estado</th>
            <th>Miembros</th>
            <th>Documentos</th>
            <th>Fecha Creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proyectos.map((proyecto) => {
            const esActivo = proyecto.estado?.toLowerCase() === 'activo'
            const esPausado = proyecto.estado?.toLowerCase() === 'pausado'
            const esInactivo = proyecto.archivado || proyecto.estado?.toLowerCase() === 'inactivo'
            
            const getBadgeClass = () => {
              if (esActivo) return 'proyecto-card__badge--activo'
              if (esPausado) return 'proyecto-card__badge--pausado'
              if (esInactivo) return 'proyecto-card__badge--inactivo'
              return 'proyecto-card__badge--default'
            }

            const miembroActual = (proyecto.miembros || []).find((m) => m.id === sesion?.id)
            const inhabilitado = miembroActual?.activo === false

            return (
              <tr key={proyecto.id} className={inhabilitado ? 'proyectos-tabla__fila--inhabilitada' : ''}>
                <td className="proyectos-tabla__codigo">{proyecto.codigo || '#PRJ-000'}</td>
                
                <td>
                  <div className="proyectos-tabla__proyecto-info">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="proyectos-tabla__nombre">{proyecto.nombre}</span>
                      {proyecto.descripcion && (
                        <span className="proyectos-tabla__descripcion" style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proyecto.descripcion}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td>
                  {proyecto.responsables?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {proyecto.responsables.map((responsable) => (
                        <div key={responsable.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {renderAvatar(responsable, `resp-${responsable.id}`)}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9em', fontWeight: '500' }}>{responsable.nombre}</span>
                            <span style={{ fontSize: '0.75em', color: '#777' }}>{responsable.rol || 'Jefe'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#aaa', fontSize: '0.9em' }}>Sin asignar</span>
                  )}
                </td>

                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span className={`proyecto-card__badge ${getBadgeClass()}`}>
                      <span className="proyecto-card__badge-dot"></span>
                      {proyecto.archivado ? 'ARCHIVADO' : proyecto.estado?.toUpperCase()}
                    </span>
                    {inhabilitado && (
                      <span className="proyecto-card__aviso-inhabilitado">Acceso inhabilitado</span>
                    )}
                  </div>
                </td>

                <td>
                  <div className="proyecto-card__miembros" style={{ padding: 0 }}>
                    {(proyecto.miembros || []).slice(0, 3).map((m, i) => renderAvatar(m, i))}
                    {(proyecto.miembros || []).length > 3 && (
                      <div className="proyecto-card__avatar proyecto-card__avatar--more" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                        +{(proyecto.miembros || []).length - 3}
                      </div>
                    )}
                  </div>
                </td>

                <td>
                  <div className="proyectos-tabla__meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px', color: '#6b7280'}}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{Number(proyecto.total_documentos || 0).toLocaleString()}</span>
                  </div>
                </td>

                <td>
                  <span style={{ fontSize: '0.9em', color: '#555' }}>
                    {proyecto.fecha_creacion ? new Date(proyecto.fecha_creacion).toLocaleDateString() : '-'}
                  </span>
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      className="proyectos-tabla__btn-accion"
                      onClick={() => onSeleccionarProyecto && onSeleccionarProyecto(proyecto)}
                      title="Ver detalles del proyecto"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <ProyectoAccionesMenu proyecto={proyecto} onArchivar={onArchivarProyecto} onEliminar={onEliminarProyecto} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
