import { useEffect, useMemo, useRef, useState } from 'react'
import './ChatProyecto.css'

const API_BASE_URL = 'http://127.0.0.1:8000'

const IconVolver = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconMas = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconBuscarMini = (p) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-3.5-3.5" />
  </svg>
)

const IconDocMini = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </svg>
)

const IconChevronAbajo = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconEnviar = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const IconChispa = (p) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
  </svg>
)

const IconInfografia = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v9l6 3" />
  </svg>
)

const IconTabla = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
)

const IconAudio = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M12 3v18" />
    <path d="M8 7v10" />
    <path d="M16 7v10" />
    <path d="M4 10v4" />
    <path d="M20 10v4" />
  </svg>
)

const IconMapaMental = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M8.3 11 15.7 7" />
    <path d="M8.3 13 15.7 17" />
  </svg>
)

const IconGuia = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
)

const TARJETAS_ESTUDIO = [
  { titulo: 'Generar Infografía', descripcion: 'Visualiza los datos clave en un formato gráfico', Icono: IconInfografia },
  { titulo: 'Generar Tabla de Datos', descripcion: 'Extrae y organiza datos estructurados de tus documentos', Icono: IconTabla },
  { titulo: 'Generar Resumen en Audio', descripcion: 'Escucha un resumen conversacional de este proyecto', Icono: IconAudio },
  { titulo: 'Generar Mapa Mental', descripcion: 'Explora las conexiones entre los temas del proyecto', Icono: IconMapaMental },
  { titulo: 'Generar Guía de Estudio', descripcion: 'Preguntas y puntos clave para repasar el contenido', Icono: IconGuia },
]

function crearConversacion() {
  return {
    id: crypto.randomUUID(),
    titulo: 'Nueva conversación',
    fecha: new Date(),
    mensajes: [],
  }
}

function grupoDeFecha(fecha) {
  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const inicioAyer = new Date(inicioHoy)
  inicioAyer.setDate(inicioAyer.getDate() - 1)
  const inicioSemana = new Date(inicioHoy)
  inicioSemana.setDate(inicioSemana.getDate() - 7)

  if (fecha >= inicioHoy) return 'Hoy'
  if (fecha >= inicioAyer) return 'Ayer'
  if (fecha >= inicioSemana) return 'Esta semana'
  return 'Anteriores'
}

function formatoRelativo(fecha) {
  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000)
  if (segundos < 60) return 'hace instantes'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `hace ${dias} d`
}

export default function ChatProyecto({ proyecto, onVolver }) {
  const [totalDocumentos, setTotalDocumentos] = useState(proyecto.total_documentos ?? 0)
  const [conversaciones, setConversaciones] = useState(() => [crearConversacion()])
  const [conversacionActivaId, setConversacionActivaId] = useState(() => conversaciones[0]?.id)
  const [busquedaConversacion, setBusquedaConversacion] = useState('')
  const [pregunta, setPregunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const finMensajesRef = useRef(null)

  useEffect(() => {
    let cancelado = false
    fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/documentos`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelado) setTotalDocumentos(Array.isArray(data) ? data.length : 0)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [proyecto.id])

  const conversacionActiva = conversaciones.find((c) => c.id === conversacionActivaId) ?? conversaciones[0]

  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversacionActiva?.mensajes.length])

  const conversacionesFiltradas = useMemo(() => {
    return conversaciones.filter((c) => c.titulo.toLowerCase().includes(busquedaConversacion.toLowerCase()))
  }, [conversaciones, busquedaConversacion])

  const gruposConversaciones = useMemo(() => {
    const orden = ['Hoy', 'Ayer', 'Esta semana', 'Anteriores']
    const grupos = {}
    for (const conversacion of conversacionesFiltradas) {
      const grupo = grupoDeFecha(conversacion.fecha)
      if (!grupos[grupo]) grupos[grupo] = []
      grupos[grupo].push(conversacion)
    }
    return orden
      .filter((g) => grupos[g]?.length)
      .map((g) => ({ nombre: g, items: grupos[g].sort((a, b) => b.fecha - a.fecha) }))
  }, [conversacionesFiltradas])

  const handleNuevaConversacion = () => {
    const nueva = crearConversacion()
    setConversaciones((prev) => [nueva, ...prev])
    setConversacionActivaId(nueva.id)
    setPregunta('')
  }

  const actualizarConversacion = (id, actualizador) => {
    setConversaciones((prev) => prev.map((c) => (c.id === id ? actualizador(c) : c)))
  }

  const handleEnviar = async (e) => {
    e.preventDefault()
    const texto = pregunta.trim()
    if (!texto || !conversacionActiva) return

    const idConversacion = conversacionActiva.id
    const esPrimerMensaje = conversacionActiva.mensajes.length === 0

    actualizarConversacion(idConversacion, (c) => ({
      ...c,
      titulo: esPrimerMensaje ? texto.slice(0, 48) : c.titulo,
      mensajes: [...c.mensajes, { rol: 'usuario', texto }],
    }))
    setPregunta('')
    setEnviando(true)

    try {
      const response = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: texto, k: 5 }),
      })
      if (!response.ok) throw new Error('No se pudo consultar el proyecto')
      const data = await response.json()

      actualizarConversacion(idConversacion, (c) => ({
        ...c,
        mensajes: [...c.mensajes, { rol: 'asistente', resultados: data.resultados || [] }],
      }))
    } catch (err) {
      actualizarConversacion(idConversacion, (c) => ({
        ...c,
        mensajes: [...c.mensajes, { rol: 'asistente', error: err.message }],
      }))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="chat-proyecto">
      <div className="chat-proyecto__header">
        <div className="chat-proyecto__breadcrumb">
          <button type="button" className="chat-proyecto__volver" onClick={onVolver}>
            <IconVolver />
            Volver a {proyecto.nombre}
          </button>
          <span className="chat-proyecto__separador">/</span>
          <span>Proyectos</span>
          <span className="chat-proyecto__separador">/</span>
          <span>{proyecto.nombre}</span>
          <span className="chat-proyecto__separador">/</span>
          <span className="chat-proyecto__crumb-activo">Chat IA</span>
        </div>

        <div className="chat-proyecto__titulo">{conversacionActiva?.titulo}</div>

        <div className="chat-proyecto__header-espacio" />
      </div>

      <div className="chat-proyecto__layout">
        <aside className="chat-proyecto__historial">
          <div className="chat-proyecto__historial-nueva">
            <button type="button" onClick={handleNuevaConversacion}>
              <IconMas />
              Nueva conversación
            </button>
          </div>

          <div className="chat-proyecto__historial-buscar">
            <IconBuscarMini className="chat-proyecto__historial-buscar-icono" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={busquedaConversacion}
              onChange={(e) => setBusquedaConversacion(e.target.value)}
            />
          </div>

          <div className="chat-proyecto__historial-lista">
            {gruposConversaciones.map((grupo) => (
              <div key={grupo.nombre} className="chat-proyecto__historial-grupo">
                <span className="chat-proyecto__historial-grupo-titulo">{grupo.nombre}</span>
                {grupo.items.map((conversacion) => (
                  <button
                    type="button"
                    key={conversacion.id}
                    className={`chat-proyecto__historial-item ${
                      conversacion.id === conversacionActivaId ? 'chat-proyecto__historial-item--activo' : ''
                    }`}
                    onClick={() => setConversacionActivaId(conversacion.id)}
                  >
                    <span className="chat-proyecto__historial-item-titulo">{conversacion.titulo}</span>
                    <span className="chat-proyecto__historial-item-fecha">{formatoRelativo(conversacion.fecha)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <main className="chat-proyecto__central">
          <div className="chat-proyecto__banner">
            <IconDocMini />
            <span>
              Conversando sobre {totalDocumentos} documento{totalDocumentos === 1 ? '' : 's'} de {proyecto.nombre}
            </span>
            <IconChevronAbajo className="chat-proyecto__banner-chevron" />
          </div>

          <div className="chat-proyecto__mensajes">
            {conversacionActiva?.mensajes.length === 0 && (
              <div className="chat-proyecto__vacio">
                Escribe una pregunta sobre los documentos indexados de este proyecto para empezar.
              </div>
            )}

            {conversacionActiva?.mensajes.map((mensaje, i) =>
              mensaje.rol === 'usuario' ? (
                <div key={i} className="chat-proyecto__mensaje-usuario">
                  <div className="chat-proyecto__burbuja-usuario">{mensaje.texto}</div>
                </div>
              ) : (
                <div key={i} className="chat-proyecto__mensaje-asistente">
                  <div className="chat-proyecto__remitente">
                    <IconChispa className="chat-proyecto__remitente-icono" />
                    DocAI
                  </div>

                  {mensaje.error ? (
                    <p className="chat-proyecto__error">Error: {mensaje.error}</p>
                  ) : mensaje.resultados.length === 0 ? (
                    <p className="chat-proyecto__sin-resultados">
                      No encontré fragmentos relevantes. Verifica que el proyecto tenga documentos .docx subidos e indexados.
                    </p>
                  ) : (
                    <div className="chat-proyecto__fragmentos">
                      {mensaje.resultados.map((r, j) => (
                        <div key={j} className="chat-proyecto__fragmento">
                          <div className="chat-proyecto__fragmento-fuente">
                            <span className="chat-proyecto__cita">{j + 1}</span>
                            <span className="chat-proyecto__fragmento-doc">{r.documento}</span>
                          </div>
                          <p>{r.contenido}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {enviando && <div className="chat-proyecto__escribiendo">DocAI está buscando en los documentos...</div>}
            <div ref={finMensajesRef} />
          </div>

          <form className="chat-proyecto__form" onSubmit={handleEnviar}>
            <input
              type="text"
              placeholder="Pregunta algo sobre los documentos de este proyecto..."
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
            />
            <button type="submit" disabled={enviando || !pregunta.trim()} aria-label="Enviar pregunta">
              <IconEnviar />
            </button>
          </form>
        </main>

        <aside className="chat-proyecto__estudio">
          <div className="chat-proyecto__estudio-header">
            <h2>Estudio</h2>
            <p>Genera materiales a partir de los documentos de este proyecto</p>
          </div>

          <div className="chat-proyecto__estudio-lista">
            {TARJETAS_ESTUDIO.map(({ titulo, descripcion, Icono }) => (
              <div className="chat-proyecto__estudio-tarjeta" key={titulo} title="Próximamente">
                <span className="chat-proyecto__estudio-icono">
                  <Icono />
                </span>
                <div>
                  <div className="chat-proyecto__estudio-titulo">
                    {titulo}
                    <span className="chat-proyecto__estudio-badge">Próximamente</span>
                  </div>
                  <p>{descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
