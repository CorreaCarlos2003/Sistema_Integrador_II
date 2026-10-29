import { useEffect, useState } from "react";
import Login from "./pages/Login/Login";
import AdminLayout from "./pages/Admin/AdminLayout";
import { obtenerSeccionesPermitidas } from "./pages/Admin/secciones";
import Dashboard from "./pages/Admin/Dashboard";
import InicioUsuario from "./pages/Usuario/InicioUsuario";
import Usuarios from "./pages/Admin/Usuarios";
import RolesPermisos from "./pages/Admin/RolesPermisos";
import Historial from "./pages/Admin/Historial";
import Reportes from "./pages/Admin/Reportes";
import Proyectos from "./pages/Proyectos/Proyectos";
import "./pages/Login/Login.css";

function Proximamente() {
  return (
    <div
      style={{ textAlign: "center", padding: "80px 20px", color: "#6b7785" }}
    >
      <p style={{ margin: 0 }}>
        Esta sección aún no tiene pantalla diseñada. Próximamente.
      </p>
    </div>
  );
}

const SESION_STORAGE_KEY = "sesion";

function cargarSesionGuardada() {
  try {
    const guardada = localStorage.getItem(SESION_STORAGE_KEY);
    return guardada ? JSON.parse(guardada) : null;
  } catch {
    return null;
  }
}

function App() {
  const [sesion, setSesion] = useState(cargarSesionGuardada);
  const [seccion, setSeccion] = useState("inicio");

  useEffect(() => {
    if (sesion) {
      localStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesion));
    } else {
      localStorage.removeItem(SESION_STORAGE_KEY);
    }
  }, [sesion]);

  useEffect(() => {
    if (!sesion?.id) return undefined;

    const enviarLatido = () => {
      fetch(`/usuarios/${sesion.id}/actividad`, { method: "POST" }).catch(() => {});
    };

    enviarLatido();
    const intervalo = setInterval(enviarLatido, 60000);
    return () => clearInterval(intervalo);
  }, [sesion?.id]);

  const cerrarSesion = () => {
    setSesion(null);
    setSeccion("inicio");
  };

  if (!sesion) {
    return <Login onLoginExitoso={setSesion} />;
  }

  const seccionesPermitidas = obtenerSeccionesPermitidas(sesion.rol);
  const seccionActiva = seccionesPermitidas.includes(seccion) ? seccion : "inicio";

  return (
    <AdminLayout
      activo={seccionActiva}
      onNavegar={setSeccion}
      sesion={sesion}
      onCerrarSesion={cerrarSesion}
      pilotoVisual={seccionActiva === "inicio" || seccionActiva === "proyectos" || seccionActiva === "usuarios" || seccionActiva === "roles" || seccionActiva === "historial" || seccionActiva === "reportes"}
    >
      {seccionActiva === "inicio" ? (
        sesion.rol === "Administrador" ? (
          <Dashboard sesion={sesion} />
        ) : (
          <InicioUsuario sesion={sesion} />
        )
      ) : seccionActiva === "proyectos" ? (
        <Proyectos sesion={sesion} />
      ) : seccionActiva === "usuarios" ? (
        <Usuarios sesion={sesion} />
      ) : seccionActiva === "roles" ? (
        <RolesPermisos sesion={sesion} />
      ) : seccionActiva === "historial" ? (
        <Historial sesion={sesion} />
      ) : seccionActiva === "reportes" ? (
        <Reportes sesion={sesion} />
      ) : (
        <Proximamente />
      )}
    </AdminLayout>
  );
}

export default App;
