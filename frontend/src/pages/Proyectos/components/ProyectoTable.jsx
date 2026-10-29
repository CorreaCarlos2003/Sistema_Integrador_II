import { getInitials, getAvatarColors } from '../../../utils/avatarUtils'
import ProyectoAccionesMenu from './ProyectoAccionesMenu'
import ProyectoEstadoBadge from './ProyectoEstadoBadge'
import ProyectosVacio from './ProyectosVacio'

export default function ProyectoTable({ proyectos, sesion, onSeleccionarProyecto, onArchivarProyecto, onEliminarProyecto }) {
  if (!proyectos || proyectos.length === 0) {
    return <ProyectosVacio />
  }

  const renderAvatar = (miembro, index) => {
    const { background, color } = getAvatarColors(miembro.nombre)
    return (
      <div 
        key={miembro.id || index}
        className="proyecto-card__avatar"
        style={{ backgroundColor: background, color }}
        title={`${miembro.nombre} ${miembro.rol ? `- ${miembro.rol}` : ''}`}
      >
        {getInitials(miembro.nombre)}
      </div>
    )
  }

  return (
    <div className="proyectos-tabla-wrap" role="region" aria-label="Tabla de proyectos" tabIndex={0}>
      <table className="proyectos-tabla" aria-label="Proyectos registrados">
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
            const miembroActual = (proyecto.miembros || []).find((m) => m.id === sesion?.id)
            const inhabilitado = miembroActual?.activo === false

            return (
              <tr key={proyecto.id} className={inhabilitado ? 'proyectos-tabla__fila--inhabilitada' : ''}>
                <td className="proyectos-tabla__codigo">{proyecto.codigo || '#PRJ-000'}</td>
                
                <td>
                  <div className="proyectos-tabla__proyecto-info">
                    <div className="proyectos-tabla__texto">
                      <span className="proyectos-tabla__nombre">{proyecto.nombre}</span>
                      {proyecto.descripcion && (
                        <span className="proyectos-tabla__descripcion" title={proyecto.descripcion}>
                          {proyecto.descripcion}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td>
                  {proyecto.responsables?.length > 0 ? (
                    <div className="proyectos-tabla__responsables">
                      {proyecto.responsables.map((responsable) => (
                        <div key={responsable.id} className="proyectos-tabla__responsable">
                          {renderAvatar(responsable, `resp-${responsable.id}`)}
                          <div className="proyectos-tabla__texto">
                            <span className="proyectos-tabla__responsable-nombre">{responsable.nombre}</span>
                            <span className="proyectos-tabla__responsable-rol">{responsable.rol || 'Jefe'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="proyectos-tabla__sin-asignar">Sin asignar</span>
                  )}
                </td>

                <td>
                  <div className="proyectos-tabla__estado">
                    <ProyectoEstadoBadge estado={proyecto.estado} archivado={proyecto.archivado} />
                    {inhabilitado && (
                      <span className="proyecto-card__aviso-inhabilitado">Acceso inhabilitado</span>
                    )}
                  </div>
                </td>

                <td>
                  <div className="proyecto-card__miembros">
                    {(proyecto.miembros || []).slice(0, 3).map((m, i) => renderAvatar(m, i))}
                    {(proyecto.miembros || []).length > 3 && (
                      <div className="proyecto-card__avatar proyecto-card__avatar--more">
                        +{(proyecto.miembros || []).length - 3}
                      </div>
                    )}
                  </div>
                </td>

                <td>
                  <div className="proyectos-tabla__meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{Number(proyecto.total_documentos || 0).toLocaleString()}</span>
                  </div>
                </td>

                <td>
                  <span className="proyectos-tabla__fecha">
                    {proyecto.fecha_creacion ? new Date(proyecto.fecha_creacion).toLocaleDateString() : '-'}
                  </span>
                </td>

                <td>
                  <div className="proyectos-tabla__acciones">
                    <button
                      type="button"
                      className="proyectos-tabla__btn-accion"
                      onClick={(e) => onSeleccionarProyecto && onSeleccionarProyecto(proyecto, e.currentTarget)}
                      title="Ver detalles del proyecto"
                      aria-label={`Ver detalles de ${proyecto.nombre}`}
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
