import { useState } from 'react'
import './AdminLayout.css'
import {
  IconLogoDocAI,
  IconNavInicio,
  IconNavProyectos,
  IconNavUsuarios,
  IconNavRoles,
  IconNavHistorial,
  IconNavReportes,
  IconCalendario,
  IconNotificacionLlena,
  IconUsuarioSilueta,
  IconPerfilFooter,
} from '../../components/icons'

const SECCIONES = [
  { clave: 'inicio', etiqueta: 'Inicio', Icono: IconNavInicio },
  { clave: 'proyectos', etiqueta: 'Proyectos', Icono: IconNavProyectos },
  { clave: 'usuarios', etiqueta: 'Gestión de Usuarios', Icono: IconNavUsuarios },
  { clave: 'roles', etiqueta: 'Roles y Permisos', Icono: IconNavRoles },
  { clave: 'historial', etiqueta: 'Historial', Icono: IconNavHistorial },
  { clave: 'reportes', etiqueta: 'Reportes', Icono: IconNavReportes },
]

export default function AdminLayout({ activo, onNavegar, sesion, onCerrarSesion, children }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="panel">
      <aside className="panel__sidebar">
        <div className="panel__marca">
          <div className="panel__marca-caja">
            <span className="panel__marca-esquina" />
            <IconLogoDocAI className="panel__marca-icono" />
          </div>
          <span className="panel__marca-texto">doc/ai</span>
        </div>

        <p className="panel__nav-etiqueta">Navegación</p>

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
          <span className="panel__avatar">
            <IconPerfilFooter />
          </span>
          <div className="panel__perfil-info">
            <strong>{sesion?.nombre ?? 'Administrador'}</strong>
            <span>{sesion?.rol ?? 'Administrador del Sistema'}</span>
          </div>
        </div>
      </aside>

      <div className="panel__cuerpo">
        <header className="panel__topbar">
          <button className="panel__filtro" type="button">
            <IconCalendario />
            <span className="panel__filtro-texto">
              <small>Últimos 30</small>
              <small>días</small>
            </span>
          </button>

          <div className="panel__topbar-acciones">
            <button className="panel__icono-boton" type="button" title="Notificaciones" aria-label="Notificaciones">
              <IconNotificacionLlena />
              <span className="panel__punto-alerta" />
            </button>

            <div className="panel__cuenta">
              <button
                type="button"
                className="panel__cuenta-boton"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-label="Ajustes del perfil"
              >
                <span className="panel__avatar panel__avatar--sm">
                  <IconUsuarioSilueta />
                </span>
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
