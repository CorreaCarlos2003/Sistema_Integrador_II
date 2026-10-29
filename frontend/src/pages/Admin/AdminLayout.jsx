import { useState } from 'react'
import './AdminLayout.css'
import DocAILogo from '../../components/ui/DocAILogo'
import '../../styles/modern-tokens.css'
import {
  IconNavInicio,
  IconNavProyectos,
  IconNavUsuarios,
  IconNavRoles,
  IconNavHistorial,
  IconNavReportes,
  IconUsuarioSilueta,
  IconPerfilFooter,
} from '../../components/icons'
import { obtenerSeccionesPermitidas } from './secciones'

const SECCIONES = [
  { clave: 'inicio', etiqueta: 'Inicio', Icono: IconNavInicio },
  { clave: 'proyectos', etiqueta: 'Proyectos', Icono: IconNavProyectos },
  { clave: 'usuarios', etiqueta: 'Gestión de Usuarios', Icono: IconNavUsuarios },
  { clave: 'roles', etiqueta: 'Roles y Permisos', Icono: IconNavRoles },
  { clave: 'historial', etiqueta: 'Historial', Icono: IconNavHistorial },
  { clave: 'reportes', etiqueta: 'Reportes', Icono: IconNavReportes },
]

export default function AdminLayout({ activo, onNavegar, sesion, onCerrarSesion, children, pilotoVisual = false }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const seccionesPermitidas = obtenerSeccionesPermitidas(sesion?.rol)
  const secciones = SECCIONES.filter(({ clave }) => seccionesPermitidas.includes(clave))

  return (
    <div className={pilotoVisual ? 'panel panel--visual-pilot' : 'panel'}>
      <aside className="panel__sidebar">
        <div className="panel__marca">
          <DocAILogo size={38} />
        </div>

        <p className="panel__nav-etiqueta">Navegación</p>

        <nav className="panel__nav">
          {secciones.map(({ clave, etiqueta, Icono }) => (
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
          {pilotoVisual && <span className="panel__titulo-piloto">{SECCIONES.find(({ clave }) => clave === activo)?.etiqueta}</span>}
          <div className="panel__topbar-acciones">
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
