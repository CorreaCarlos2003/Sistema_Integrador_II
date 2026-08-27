import './Inicio.css'

export default function Inicio({ sesion, onCerrarSesion }) {
  const nombre = (sesion.nombre || '').split(' ')[0]

  return (
    <div className="portal">
      <aside className="portal__sidebar">
        <div>
          <p className="portal__logo">DocAI</p>
          <button className="portal__cta" type="button">
            + Nuevo documento
          </button>
          <nav className="portal__nav">
            <span className="portal__link portal__link--activo">Inicio</span>
            <span className="portal__link">Proyectos</span>
            <span className="portal__link">Chat</span>
            <span className="portal__link">Reportes</span>
          </nav>
        </div>
        <div className="portal__perfil">
          <div>
            <strong>{sesion.nombre}</strong>
            <span>{sesion.rol}</span>
          </div>
          <button type="button" onClick={onCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="portal__cuerpo">
        <header className="portal__top">
          <input className="portal__buscar" type="search" placeholder="Buscar documentos, proyectos..." />
          <span className="portal__top-nombre">Ajustes del perfil</span>
        </header>

        <main className="portal__main">
          <div className="portal__encabezado">
            <div>
              <h1>¡Hola, {nombre}!</h1>
              <p>Aquí tienes un resumen de tu actividad reciente en DocAI.</p>
            </div>
            <div className="portal__acciones">
              <button className="portal__boton portal__boton--linea" type="button">
                + Nuevo proyecto
              </button>
              <button className="portal__boton" type="button">
                Consultar IA
              </button>
            </div>
          </div>

          <section className="portal__indicadores">
            <article className="portal__card">
              <span>Proyectos activos</span>
            </article>
            <article className="portal__card">
              <span>Mis documentos</span>
            </article>
            <article className="portal__card portal__card--azul">
              <span>Consultas IA hoy</span>
            </article>
          </section>

          <section className="portal__grid">
            <article className="portal__panel">
              <h2>Actividad reciente</h2>
            </article>
            <div className="portal__columna">
              <article className="portal__panel">
                <h2>Notificaciones</h2>
              </article>
              <article className="portal__estado">
                <span>Estado del sistema</span>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
