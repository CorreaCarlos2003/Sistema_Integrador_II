import { useState } from 'react'
import './AdminLayout.css'
import {
  IconInicio,
  IconProyectos,
  IconChat,
  IconUsuarios,
  IconRoles,
  IconReportes,
  IconBuscar,
  IconCampana,
  IconAyuda,
} from '../../components/icons'

const SECCIONES = [
  { clave: 'inicio', etiqueta: 'Inicio', Icono: IconInicio },
  { clave: 'proyectos', etiqueta: 'Proyectos', Icono: IconProyectos },
  { clave: 'chat', etiqueta: 'Chat', Icono: IconChat },
  { clave: 'usuarios', etiqueta: 'Gestión de Usuarios', Icono: IconUsuarios },
  { clave: 'roles', etiqueta: 'Roles y Permisos', Icono: IconRoles },
  { clave: 'reportes', etiqueta: 'Reportes', Icono: IconReportes },
]

export default function AdminLayout({ activo, onNavegar, sesion, onCerrarSesion, children }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="panel">
      <aside className="panel__sidebar">
        <div className="panel__marca">DocAI</div>

        <button className="panel__nuevo" type="button" onClick={() => onNavegar?.('proyectos')}>
          <span className="panel__nuevo-icono">+</span> Nuevo Documento
        </button>

        <nav className="panel__nav">
          {SECCIONES.map(({ clave, etiqueta, Icono }) => (
            <button
              key={clave}
              type="button"
              className={clave === activo ? 'panel__nav-item panel__nav-item--activo' : 'panel__nav-item'}
              onClick={() => onNavegar?.(clave)}
            >
              <Icono />
              <span>{etiqueta}</span>
            </button>
          ))}
        </nav>

        <div className="panel__perfil">
          <div className="panel__avatar">{sesion?.nombre?.[0]?.toUpperCase() ?? 'A'}</div>
          <div className="panel__perfil-info">
            <strong>{sesion?.nombre ?? 'Administrador'}</strong>
            <span>{sesion?.rol ?? 'Administrador del Sistema'}</span>
          </div>
        </div>
      </aside>

      <div className="panel__cuerpo">
        <header className="panel__topbar">
          <div className="panel__buscador">
            <IconBuscar />
            <input type="text" placeholder="Buscar documentos, proyectos..." />
          </div>

          <div className="panel__topbar-acciones">
            <button className="panel__icono-boton" type="button" title="Notificaciones" aria-label="Notificaciones">
              <IconCampana />
              <span className="panel__punto-alerta" />
            </button>
            <button className="panel__icono-boton" type="button" title="Ayuda" aria-label="Ayuda">
              <IconAyuda />
            </button>

            <div className="panel__cuenta">
              <button
                type="button"
                className="panel__cuenta-boton"
                onClick={() => setMenuAbierto((v) => !v)}
              >
                <div className="panel__avatar panel__avatar--sm">{sesion?.nombre?.[0]?.toUpperCase() ?? 'A'}</div>
                <span>Ajustes del perfil</span>
              </button>

              {menuAbierto && (
                <div className="panel__cuenta-menu" onMouseLeave={() => setMenuAbierto(false)}>
                  <div className="panel__cuenta-menu-info">
                    <strong>{sesion?.nombre ?? 'Administrador'}</strong>
                    <span>{sesion?.correo ?? ''}</span>
                  </div>
                  <button type="button" onClick={onCerrarSesion}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="panel__contenido">{children}</main>
      </div>
    </div>
  )
}
