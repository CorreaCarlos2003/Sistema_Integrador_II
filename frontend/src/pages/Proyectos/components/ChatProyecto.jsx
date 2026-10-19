import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pedirChat } from '../../../utils/chatApi'
import { obtenerCambiosComparacion } from '../../../utils/comparacion'
import { formatoRelativo } from '../../../utils/tiempo'
import EstadoRag from './EstadoRag'
import './ChatProyecto.css'

const IconVolver = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconMas = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconBuscarMini = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-3.5-3.5" />
  </svg>
)

const IconDocMini = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </svg>
)

const IconEnviar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const IconChispa = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
  </svg>
)

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

function TextoConCitas({ mensaje }) {
  const numeros = new Set((mensaje.citas || []).map((cita) => cita.numero))
  return (
    <p className="chat-proyecto__respuesta">
      {mensaje.contenido.split(/(\[\d+\])/g).map((parte, indice) => {
        const numero = /^\[(\d+)\]$/.exec(parte)?.[1]
        return numero && numeros.has(Number(numero)) ? (
          <a key={indice} href={`#cita-${mensaje.id}-${numero}`}>{parte}</a>
        ) : <span key={indice}>{parte}</span>
      })}
    </p>
  )
}

function ExtractoComparacion({ etiqueta, texto, mensaje }) {
  const numero = Number(/\[(\d+)\]\s*$/.exec(texto)?.[1])
  const cita = mensaje.citas?.find((elemento) => elemento.numero === numero)
  const contenido = texto.replace(/\s*\[\d+\]\s*$/, '').trim()
  const sinContenido = /^no existía contenido\.?$/i.test(contenido)
  const extenso = contenido.length > 240

  return (
    <div className="chat-proyecto__comparacion-bloque">
      <div className="chat-proyecto__comparacion-bloque-cabecera">
        <strong>{etiqueta}</strong>
        {cita && <a href={`#cita-${mensaje.id}-${numero}`}>{cita.documento} · v{cita.version} [{numero}]</a>}
      </div>
      {sinContenido ? <p className="chat-proyecto__comparacion-vacio">No existía contenido.</p> : (
        <>
          <p>{extenso ? `${contenido.slice(0, 240).trimEnd()}…` : contenido}</p>
          {extenso && (
            <details>
              <summary>Ver texto completo</summary>
              <p>{contenido}</p>
            </details>
          )}
        </>
      )}
    </div>
  )
}

function ComparacionVista({ mensaje }) {
  const cambios = obtenerCambiosComparacion(mensaje.contenido)
  if (!cambios) return <TextoConCitas mensaje={mensaje} />

  return (
    <div className="chat-proyecto__comparacion-resultado">
      <p className="chat-proyecto__comparacion-resumen">
        {cambios.length} cambio{cambios.length === 1 ? '' : 's'} textual{cambios.length === 1 ? '' : 'es'} encontrado{cambios.length === 1 ? '' : 's'}
      </p>
      <div className="chat-proyecto__comparacion-tarjetas">
        {cambios.map((cambio) => (
          <article className="chat-proyecto__comparacion-tarjeta" key={cambio.numero}>
            <div className="chat-proyecto__comparacion-tarjeta-cabecera">
              <span className={`chat-proyecto__comparacion-tipo chat-proyecto__comparacion-tipo--${cambio.tipo.toLowerCase()}`}>{cambio.tipo}</span>
              <span>Cambio {cambio.numero}</span>
            </div>
            <div className="chat-proyecto__comparacion-columnas">
              <ExtractoComparacion etiqueta="Antes" texto={cambio.antes} mensaje={mensaje} />
              <ExtractoComparacion etiqueta="Después" texto={cambio.despues} mensaje={mensaje} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function etiquetaUbicacion(cita) {
  if (cita.pagina) return `Pág. ${cita.pagina}`
  return cita.seccion || 'Ubicación no disponible'
}

export default function ChatProyecto({ proyecto, sesion, onVolver, estadoRag }) {
  const token = sesion?.token
  const base = `/proyectos/${proyecto.id}`
  const [conversaciones, setConversaciones] = useState([])
  const [conversacionActivaId, setConversacionActivaId] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [documentos, setDocumentos] = useState([])
  const [versiones, setVersiones] = useState([])
  const [documentoIds, setDocumentoIds] = useState([])
  const [herramienta, setHerramienta] = useState(null)
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [seccion, setSeccion] = useState('')
  const [busquedaConversacion, setBusquedaConversacion] = useState('')
  const [pregunta, setPregunta] = useState('')
  const [editandoTitulo, setEditandoTitulo] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [cargandoLista, setCargandoLista] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const finMensajesRef = useRef(null)
  const ragListo = estadoRag?.estado === 'listo'

  const cargarLista = useCallback(async (archivadas, numeroPagina = 1) => {
    const datos = await pedirChat(
      `${base}/conversaciones?page=${numeroPagina}&limit=20&archivadas=${archivadas}`,
      token,
    )
    setConversaciones((previas) => numeroPagina === 1 ? datos.items : [...previas, ...datos.items])
    setTotal(datos.total)
    setPagina(numeroPagina)
    if (numeroPagina === 1) {
      setConversacionActivaId((actual) => datos.items.some((item) => item.id === actual)
        ? actual : datos.items[0]?.id ?? null)
    }
  }, [base, token])

  const cargarDetalle = useCallback(async (id) => {
    const datos = await pedirChat(`${base}/conversaciones/${id}`, token)
    setDetalle(datos)
    return datos
  }, [base, token])

  useEffect(() => {
    let cancelado = false
    Promise.allSettled([
      pedirChat(`${base}/conversaciones?page=1&limit=20&archivadas=${mostrarArchivadas}`, token),
      pedirChat(`${base}/documentos/versiones`, token),
    ]).then(([lista, fuentes]) => {
      if (cancelado) return
      if (lista.status === 'fulfilled') {
        setConversaciones(lista.value.items)
        setTotal(lista.value.total)
        setPagina(1)
        setCargandoDetalle(Boolean(lista.value.items.length))
        setConversacionActivaId(lista.value.items[0]?.id ?? null)
      } else {
        setError(lista.reason.message)
      }
      if (fuentes.status === 'fulfilled') {
        setVersiones(fuentes.value)
        const vigentes = fuentes.value.filter((version) => version.vigente)
        setDocumentos(vigentes)
      } else {
        setError((previo) => previo || fuentes.reason.message)
      }
      setCargandoLista(false)
    })
    return () => { cancelado = true }
  }, [base, token, mostrarArchivadas])

  useEffect(() => {
    if (conversacionActivaId === null) return
    let cancelado = false
    pedirChat(`${base}/conversaciones/${conversacionActivaId}`, token)
      .then((datos) => { if (!cancelado) setDetalle(datos) })
      .catch((fallo) => { if (!cancelado) setError(fallo.message) })
      .finally(() => { if (!cancelado) setCargandoDetalle(false) })
    return () => { cancelado = true }
  }, [base, token, conversacionActivaId])

  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [detalle?.mensajes?.length, ocupado])

  const conversacionActiva = conversaciones.find((conversacion) => conversacion.id === conversacionActivaId)
  const conversacionesFiltradas = useMemo(() => conversaciones.filter((conversacion) =>
    conversacion.titulo.toLowerCase().includes(busquedaConversacion.toLowerCase())),
  [conversaciones, busquedaConversacion])
  const gruposConversaciones = useMemo(() => {
    const orden = ['Hoy', 'Ayer', 'Esta semana', 'Anteriores']
    const grupos = {}
    for (const conversacion of conversacionesFiltradas) {
      const grupo = grupoDeFecha(new Date(conversacion.fecha_actualizacion || conversacion.fecha))
      if (!grupos[grupo]) grupos[grupo] = []
      grupos[grupo].push(conversacion)
    }
    return orden.filter((grupo) => grupos[grupo]?.length).map((grupo) => ({ nombre: grupo, items: grupos[grupo] }))
  }, [conversacionesFiltradas])

  const seleccionarConversacion = (id) => {
    if (id === conversacionActivaId) return
    setError('')
    setDetalle(null)
    setCargandoDetalle(true)
    setConversacionActivaId(id)
    setEditandoTitulo(false)
  }

  const cambiarArchivadas = (valor) => {
    if (valor === mostrarArchivadas) return
    setError('')
    setMostrarArchivadas(valor)
    setConversaciones([])
    setDetalle(null)
    setConversacionActivaId(null)
    setCargandoLista(true)
    setCargandoDetalle(false)
  }

  const crearConversacion = async () => {
    const creada = await pedirChat(`${base}/conversaciones`, token, {
      method: 'POST', body: JSON.stringify({}),
    })
    setMostrarArchivadas(false)
    setConversaciones((previas) => mostrarArchivadas ? [creada] : [creada, ...previas])
    setTotal((previo) => mostrarArchivadas ? 1 : previo + 1)
    seleccionarConversacion(creada.id)
    setDetalle({ ...creada, mensajes: [] })
    return creada.id
  }

  const handleNuevaConversacion = async () => {
    setOcupado(true)
    setError('')
    try {
      await crearConversacion()
      setPregunta('')
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setOcupado(false)
    }
  }

  const refrescarTrasOperacion = async (id) => {
    await Promise.all([cargarDetalle(id), cargarLista(false)])
  }

  const handleEnviar = async (evento) => {
    evento.preventDefault()
    const texto = pregunta.trim()
    if (!texto || ocupado || mostrarArchivadas || !ragListo) return
    setOcupado(true)
    setError('')
    let id = conversacionActivaId
    try {
      if (id === null) id = await crearConversacion()
      setDetalle((previo) => previo?.id === id ? {
        ...previo,
        mensajes: [...previo.mensajes, { id: `pendiente-${Date.now()}`, rol: 'usuario', contenido: texto, estado: 'pendiente', citas: [] }],
      } : previo)
      setPregunta('')
      await pedirChat(`${base}/conversaciones/${id}/mensajes`, token, {
        method: 'POST',
        body: JSON.stringify({ pregunta: texto, ...(documentoIds.length ? { documento_ids: documentoIds } : {}) }),
      })
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      if (id !== null) {
        try { await refrescarTrasOperacion(id) } catch (fallo) { setError(fallo.message) }
      }
      setOcupado(false)
    }
  }

  const handleReintentar = async (mensajeId) => {
    if (!conversacionActivaId || ocupado || !ragListo) return
    setOcupado(true)
    setError('')
    try {
      await pedirChat(`${base}/conversaciones/${conversacionActivaId}/mensajes/${mensajeId}/reintentar`, token, { method: 'POST' })
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      try { await refrescarTrasOperacion(conversacionActivaId) } catch (fallo) { setError(fallo.message) }
      setOcupado(false)
    }
  }

  const handleComparar = async (evento) => {
    evento.preventDefault()
    if (!origenId || !destinoId || origenId === destinoId || ocupado || mostrarArchivadas || !ragListo) return
    const origen = versiones.find((version) => version.version_id === Number(origenId))
    const destino = versiones.find((version) => version.version_id === Number(destinoId))
    if (!origen || !destino) return
    setOcupado(true)
    setError('')
    let id = conversacionActivaId
    try {
      if (id === null) id = await crearConversacion()
      await pedirChat(`${base}/conversaciones/${id}/comparaciones`, token, {
        method: 'POST',
        body: JSON.stringify({
          origen: { documento_id: origen.documento_id, version_id: origen.version_id },
          destino: { documento_id: destino.documento_id, version_id: destino.version_id },
          ...(seccion.trim() ? { seccion: seccion.trim() } : {}),
        }),
      })
      setHerramienta(null)
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      if (id !== null) {
        try { await refrescarTrasOperacion(id) } catch (fallo) { setError(fallo.message) }
      }
      setOcupado(false)
    }
  }

  const handleRenombrar = async (evento) => {
    evento.preventDefault()
    if (!conversacionActivaId || !titulo.trim() || ocupado) return
    setOcupado(true)
    setError('')
    try {
      await pedirChat(`${base}/conversaciones/${conversacionActivaId}`, token, {
        method: 'PATCH', body: JSON.stringify({ titulo: titulo.trim() }),
      })
      await cargarLista(mostrarArchivadas)
      setEditandoTitulo(false)
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setOcupado(false)
    }
  }

  const handleArchivar = async () => {
    if (!conversacionActivaId || ocupado) return
    setOcupado(true)
    setError('')
    try {
      await pedirChat(`${base}/conversaciones/${conversacionActivaId}/${mostrarArchivadas ? 'restaurar' : 'archivar'}`, token, { method: 'POST' })
      setDetalle(null)
      setConversacionActivaId(null)
      await cargarLista(mostrarArchivadas)
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setOcupado(false)
    }
  }

  const cambiarSeleccionDocumento = (id) => {
    if (!documentoIds.includes(id) && documentoIds.length >= 20) {
      setError('Puedes seleccionar hasta 20 fuentes por pregunta.')
      return
    }
    setError('')
    setDocumentoIds((actuales) => actuales.includes(id)
      ? actuales.filter((seleccionado) => seleccionado !== id)
      : [...actuales, id])
  }

  return (
    <div className="chat-proyecto">
      <div className="chat-proyecto__header">
        <div className="chat-proyecto__breadcrumb">
          <button type="button" className="chat-proyecto__volver" onClick={onVolver}><IconVolver />Volver a {proyecto.nombre}</button>
          <span className="chat-proyecto__separador">/</span><span>Proyectos</span>
          <span className="chat-proyecto__separador">/</span><span>{proyecto.nombre}</span>
          <span className="chat-proyecto__separador">/</span><span className="chat-proyecto__crumb-activo">Chat IA</span>
        </div>
        <div className="chat-proyecto__titulo">{conversacionActiva?.titulo || 'Chat documental'}</div>
      </div>

      <div className="chat-proyecto__layout">
        <aside className="chat-proyecto__historial">
          <div className="chat-proyecto__historial-nueva">
            <button type="button" onClick={handleNuevaConversacion} disabled={ocupado}><IconMas />Nueva conversación</button>
          </div>
          <div className="chat-proyecto__historial-buscar">
            <IconBuscarMini />
            <input type="search" placeholder="Buscar conversación..." value={busquedaConversacion}
              onChange={(evento) => setBusquedaConversacion(evento.target.value)} />
          </div>
          <div className="chat-proyecto__historial-filtro">
            <button type="button" className={!mostrarArchivadas ? 'activo' : ''} onClick={() => cambiarArchivadas(false)} disabled={ocupado}>Activas</button>
            <button type="button" className={mostrarArchivadas ? 'activo' : ''} onClick={() => cambiarArchivadas(true)} disabled={ocupado}>Archivadas</button>
          </div>
          <div className="chat-proyecto__historial-lista">
            {cargandoLista && <p className="chat-proyecto__estado-lista">Cargando conversaciones...</p>}
            {!cargandoLista && conversacionesFiltradas.length === 0 && <p className="chat-proyecto__estado-lista">No hay conversaciones {mostrarArchivadas ? 'archivadas' : 'activas'}.</p>}
            {gruposConversaciones.map((grupo) => (
              <div key={grupo.nombre} className="chat-proyecto__historial-grupo">
                <span className="chat-proyecto__historial-grupo-titulo">{grupo.nombre}</span>
                {grupo.items.map((conversacion) => (
                  <button type="button" key={conversacion.id} disabled={ocupado}
                    className={`chat-proyecto__historial-item ${conversacion.id === conversacionActivaId ? 'chat-proyecto__historial-item--activo' : ''}`}
                    onClick={() => seleccionarConversacion(conversacion.id)}>
                    <span className="chat-proyecto__historial-item-titulo">{conversacion.titulo}</span>
                    <span className="chat-proyecto__historial-item-fecha">{formatoRelativo(new Date(conversacion.fecha_actualizacion || conversacion.fecha))}</span>
                  </button>
                ))}
              </div>
            ))}
            {conversaciones.length < total && (
              <button type="button" className="chat-proyecto__cargar-mas" disabled={ocupado} onClick={() => cargarLista(mostrarArchivadas, pagina + 1).catch((fallo) => setError(fallo.message))}>
                Cargar más
              </button>
            )}
          </div>
        </aside>

        <main className="chat-proyecto__central">
          <EstadoRag estado={estadoRag?.estado} mensaje={estadoRag?.mensaje} onReintentar={estadoRag?.refrescar} />
          <div className="chat-proyecto__banner">
            <IconDocMini />
            <span>{documentoIds.length ? `${documentoIds.length} fuente${documentoIds.length === 1 ? '' : 's'} seleccionada${documentoIds.length === 1 ? '' : 's'}` : `Todas las fuentes vigentes de ${proyecto.nombre}`}</span>
            <div className="chat-proyecto__banner-acciones">
              <button type="button" className={herramienta === 'fuentes' ? 'activo' : ''} onClick={() => setHerramienta(herramienta === 'fuentes' ? null : 'fuentes')}>Fuentes</button>
              <button type="button" className={herramienta === 'comparar' ? 'activo' : ''} disabled={!ragListo} onClick={() => setHerramienta(herramienta === 'comparar' ? null : 'comparar')}>Comparar</button>
            </div>
          </div>

          {herramienta === 'fuentes' && (
            <div className="chat-proyecto__herramienta">
              <strong>Fuentes para las próximas preguntas</strong>
              <p>Sin selección se consultan todas las versiones vigentes. Puedes elegir una o varias fuentes.</p>
              <div className="chat-proyecto__fuentes-lista">
                {documentos.map((documento) => (
                  <label key={documento.documento_id}>
                    <input type="checkbox" checked={documentoIds.includes(documento.documento_id)} onChange={() => cambiarSeleccionDocumento(documento.documento_id)} />
                    {documento.nombre} <small>v{documento.numero}</small>
                  </label>
                ))}
                {documentos.length === 0 && <span>No hay fuentes vigentes disponibles.</span>}
              </div>
              {documentoIds.length > 0 && <button type="button" className="chat-proyecto__enlace" onClick={() => setDocumentoIds([])}>Usar todas las fuentes</button>}
            </div>
          )}

          {herramienta === 'comparar' && (
            <form className="chat-proyecto__herramienta chat-proyecto__comparar" onSubmit={handleComparar}>
              <strong>Comparar documentos o versiones</strong>
              <p>Selecciona manualmente dos fuentes. La comparación muestra cambios textuales, sin generar conclusiones.</p>
              <div className="chat-proyecto__comparar-campos">
                <label>Origen
                  <select value={origenId} onChange={(evento) => setOrigenId(evento.target.value)} required>
                    <option value="">Selecciona un documento y versión</option>
                    {versiones.map((version) => <option key={version.version_id} value={version.version_id}>{version.nombre} · v{version.numero}{version.vigente ? ' · vigente' : ''}</option>)}
                  </select>
                </label>
                <label>Destino
                  <select value={destinoId} onChange={(evento) => setDestinoId(evento.target.value)} required>
                    <option value="">Selecciona un documento y versión</option>
                    {versiones.map((version) => <option key={version.version_id} value={version.version_id}>{version.nombre} · v{version.numero}{version.vigente ? ' · vigente' : ''}</option>)}
                  </select>
                </label>
                <label>Sección (opcional)
                  <input value={seccion} onChange={(evento) => setSeccion(evento.target.value)} maxLength={255} placeholder="Ej.: Ingresos" />
                </label>
              </div>
              <button type="submit" className="chat-proyecto__boton-primario" disabled={!ragListo || ocupado || !origenId || !destinoId || origenId === destinoId || mostrarArchivadas}>Comparar</button>
            </form>
          )}

          {conversacionActiva && (
            <div className="chat-proyecto__conversacion-acciones">
              {editandoTitulo ? (
                <form onSubmit={handleRenombrar}>
                  <input value={titulo} onChange={(evento) => setTitulo(evento.target.value)} maxLength={255} autoFocus aria-label="Título de la conversación" />
                  <button type="submit" disabled={ocupado || !titulo.trim()}>Guardar</button>
                  <button type="button" onClick={() => setEditandoTitulo(false)}>Cancelar</button>
                </form>
              ) : (
                <>
                  <button type="button" disabled={ocupado} onClick={() => { setTitulo(conversacionActiva.titulo); setEditandoTitulo(true) }}>Renombrar</button>
                  <button type="button" disabled={ocupado} onClick={handleArchivar}>{mostrarArchivadas ? 'Restaurar' : 'Archivar'}</button>
                </>
              )}
            </div>
          )}

          {error && <div className="chat-proyecto__aviso" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Cerrar aviso">×</button></div>}

          <div className="chat-proyecto__mensajes">
            {cargandoDetalle && <div className="chat-proyecto__vacio">Cargando mensajes...</div>}
            {!cargandoDetalle && !detalle?.mensajes?.length && (
              <div className="chat-proyecto__vacio">Pregunta sobre los documentos del proyecto o selecciona dos versiones para compararlas.</div>
            )}
            {!cargandoDetalle && detalle?.mensajes?.map((mensaje) => mensaje.rol === 'usuario' ? (
              <div key={mensaje.id} className="chat-proyecto__mensaje-usuario">
                <div className="chat-proyecto__usuario-contenido">
                  <div className="chat-proyecto__burbuja-usuario">{mensaje.contenido}</div>
                  {mensaje.estado === 'fallido' && (
                    <div className="chat-proyecto__mensaje-fallido">
                      No se pudo completar esta {mensaje.tipo === 'comparacion' ? 'comparación' : 'respuesta'}.
                      {mensaje.tipo === 'chat' && <button type="button" disabled={ocupado || !ragListo} onClick={() => handleReintentar(mensaje.id)}>Reintentar</button>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={mensaje.id} className={`chat-proyecto__mensaje-asistente ${mensaje.tipo === 'comparacion' ? 'chat-proyecto__mensaje-asistente--comparacion' : ''}`}>
                <div className="chat-proyecto__remitente"><IconChispa />DocAI</div>
                {mensaje.tipo === 'comparacion' ? <ComparacionVista mensaje={mensaje} /> : <TextoConCitas mensaje={mensaje} />}
                {mensaje.citas?.length > 0 && (
                  <div className={`chat-proyecto__fragmentos ${mensaje.tipo === 'comparacion' ? 'chat-proyecto__fragmentos--comparacion' : ''}`}>
                    {mensaje.citas.map((cita) => (
                      <div key={cita.numero} id={`cita-${mensaje.id}-${cita.numero}`} className="chat-proyecto__fragmento">
                        <div className="chat-proyecto__fragmento-fuente">
                          <span className="chat-proyecto__cita">{cita.numero}</span>
                          <span className="chat-proyecto__fragmento-doc">{cita.documento}</span>
                          <span className="chat-proyecto__cita-ubicacion">v{cita.version} · {etiquetaUbicacion(cita)}</span>
                        </div>
                        {mensaje.tipo === 'comparacion' ? (
                          <details><summary>Ver evidencia completa</summary><p>{cita.extracto}</p></details>
                        ) : <p>{cita.extracto}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {ocupado && <div className="chat-proyecto__escribiendo">DocAI está procesando la solicitud...</div>}
            <div ref={finMensajesRef} />
          </div>

          <form className="chat-proyecto__form" onSubmit={handleEnviar}>
            <input type="text" placeholder={!ragListo ? 'Preparando el asistente documental...' : mostrarArchivadas ? 'Restaura la conversación para continuar' : 'Pregunta algo sobre las fuentes del proyecto...'}
              value={pregunta} onChange={(evento) => setPregunta(evento.target.value)} maxLength={2000}
              disabled={!ragListo || ocupado || mostrarArchivadas} />
            <button type="submit" disabled={!ragListo || ocupado || mostrarArchivadas || !pregunta.trim()} aria-label="Enviar pregunta"><IconEnviar /></button>
          </form>
        </main>
      </div>
    </div>
  )
}
