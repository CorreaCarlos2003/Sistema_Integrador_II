import { useState } from 'react'
import Login from './pages/Login/Login'
import Usuarios from './pages/Admin/Usuarios'
import Inicio from './pages/Usuario/Inicio'

function App() {
  const [sesion, setSesion] = useState(null)

  if (!sesion) {
    return <Login onLoginExitoso={setSesion} />
  }

  if (sesion.rol === 'Administrador') {
    return <Usuarios sesion={sesion} onCerrarSesion={() => setSesion(null)} />
  }

  return <Inicio sesion={sesion} onCerrarSesion={() => setSesion(null)} />
}

export default App
