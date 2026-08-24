import { useState } from 'react'
import Login from './pages/Login/Login'
import Usuarios from './pages/Admin/Usuarios'
import './pages/Login/Login.css'

function App() {
  const [sesion, setSesion] = useState(null)

  if (!sesion) {
    return <Login onLoginExitoso={setSesion} />
  }

  if (sesion.rol === 'Administrador') {
    return <Usuarios sesion={sesion} onCerrarSesion={() => setSesion(null)} />
  }

  return (
    <div className="login">
      <div className="login__formulario">
        <h1 className="login__titulo">{sesion.nombre}</h1>
        <p style={{ margin: 0, color: '#6b7785', fontSize: 14 }}>{sesion.rol}</p>
        <button className="login__boton" type="button" onClick={() => setSesion(null)}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default App
