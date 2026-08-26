import { useState } from 'react'
import Login from './pages/Login/Login'
import AdminLayout from './pages/Admin/AdminLayout'
import Dashboard from './pages/Admin/Dashboard'
import Usuarios from './pages/Admin/Usuarios'
import './pages/Login/Login.css'

const SECCIONES_PENDIENTES = {
  proyectos: 'Proyectos',
  chat: 'Chat',
  roles: 'Roles y Permisos',
  reportes: 'Reportes',
}

function Proximamente({ titulo }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7785' }}>
      <h2 style={{ margin: '0 0 8px', color: '#16324f' }}>{titulo}</h2>
      <p style={{ margin: 0 }}>Esta sección aún no tiene pantalla diseñada. Próximamente.</p>
    </div>
  )
}

function App() {
  const [sesion, setSesion] = useState(null)
  const [seccion, setSeccion] = useState('inicio')

  const cerrarSesion = () => {
    setSesion(null)
    setSeccion('inicio')
  }

  if (!sesion) {
    return <Login onLoginExitoso={setSesion} />
  }

  if (sesion.rol !== 'Administrador') {
    return (
      <div className="login">
        <div className="login__formulario">
          <h1 className="login__titulo">{sesion.nombre}</h1>
          <p style={{ margin: 0, color: '#6b7785', fontSize: 14 }}>{sesion.rol}</p>
          <button className="login__boton" type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  if (seccion === 'usuarios') {
    return <Usuarios sesion={sesion} onCerrarSesion={cerrarSesion} onVolver={() => setSeccion('inicio')} />
  }

  return (
    <AdminLayout activo={seccion} onNavegar={setSeccion} sesion={sesion} onCerrarSesion={cerrarSesion}>
      {seccion === 'inicio' ? (
        <Dashboard sesion={sesion} />
      ) : (
        <Proximamente titulo={SECCIONES_PENDIENTES[seccion] ?? ''} />
      )}
    </AdminLayout>
  )
}

export default App
