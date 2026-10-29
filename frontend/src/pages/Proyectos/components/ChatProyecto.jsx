import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pedirChat } from '../../../utils/chatApi'
import { actorHeaders } from '../../../utils/actor'
import DocumentoPendienteModal from './DocumentoPendienteModal'
import DocumentoSubidoModal from './DocumentoSubidoModal'
import SubirDocumentoInfoModal from './SubirDocumentoInfoModal'
import EstadoRag from './EstadoRag'
import Button from '../../../components/ui/Button'
import ChatHistorial from './ChatHistorial'
import ChatMensajes from './ChatMensajes'
import { DOCUMENTO_ACCEPT, validarArchivoDocumento } from '../../../utils/documentoArchivo'
import './ChatProyecto.css'

const API_BASE_URL = 'http://127.0.0.1:8000'

const IconVolver = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
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


const IconClip = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
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
  const [mostrarInfoSubida, setMostrarInfoSubida] = useState(false)
  const [subiendoDocumento, setSubiendoDocumento] = useState(false)
  const [documentoPendienteAviso, setDocumentoPendienteAviso] = useState(null)
  const [documentoSubidoAviso, setDocumentoSubidoAviso] = useState(null)
  const finMensajesRef = useRef(null)
  const inputArchivoRef = useRef(null)
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

  const recargarFuentes = useCallback(async () => {
    const fuentes = await pedirChat(`${base}/documentos/versiones`, token)
    setVersiones(fuentes)
    setDocumentos(fuentes.filter((version) => version.vigente))
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

  const handleAdjuntarClick = () => setMostrarInfoSubida(true)

  const handleContinuarSubida = () => {
    setMostrarInfoSubida(false)
    inputArchivoRef.current?.click()
  }

  const handleArchivoSeleccionado = async (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return

    const errorArchivo = validarArchivoDocumento(archivo)
    if (errorArchivo) {
      setError(errorArchivo)
      return
    }

    setSubiendoDocumento(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)
      const respuesta = await fetch(`${API_BASE_URL}${base}/documentos`, {
        method: 'POST',
        headers: { ...actorHeaders() },
        body: formData,
      })
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null)
        throw new Error(detalle?.detail || 'No se pudo subir el documento')
      }
      const documentoSubido = await respuesta.json()
      if (documentoSubido.estado_aprobacion === 'PENDIENTE') {
        setDocumentoPendienteAviso(documentoSubido.nombre)
      } else {
        await recargarFuentes()
        setDocumentoSubidoAviso(documentoSubido.nombre)
      }
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setSubiendoDocumento(false)
    }
  }

  return (
    <div className="chat-proyecto" data-docai-layout="modern">
      <div className="chat-proyecto__header">
        <nav className="chat-proyecto__breadcrumb" aria-label="Ubicación del chat">
          <Button className="chat-proyecto__volver" onClick={onVolver}><IconVolver />Volver al proyecto</Button>
          <span className="chat-proyecto__separador" aria-hidden="true">/</span><span className="chat-proyecto__proyecto-nombre" title={proyecto.nombre}>{proyecto.nombre}</span>
          <span className="chat-proyecto__separador" aria-hidden="true">/</span><span className="chat-proyecto__crumb-activo" aria-current="page">Chat IA</span>
        </nav>
        <div className="chat-proyecto__titulo-fila"><h1 className="chat-proyecto__titulo">{conversacionActiva?.titulo || 'Chat documental'}</h1>{mostrarArchivadas && conversacionActiva && <span className="chat-proyecto__archivada">Archivada</span>}</div>
      </div>

      <div className="chat-proyecto__layout">
        <ChatHistorial grupos={gruposConversaciones} cargando={cargandoLista} ocupado={ocupado}
          busqueda={busquedaConversacion} onBuscar={setBusquedaConversacion} mostrarArchivadas={mostrarArchivadas}
          onCambiarArchivadas={cambiarArchivadas} conversacionActivaId={conversacionActivaId}
          sinResultados={conversacionesFiltradas.length === 0} hayMas={conversaciones.length < total}
          onSeleccionar={seleccionarConversacion} onNueva={handleNuevaConversacion}
          onCargarMas={() => cargarLista(mostrarArchivadas, pagina + 1).catch((fallo) => setError(fallo.message))} />

        <section className="chat-proyecto__central" aria-label="Conversación actual">
          <EstadoRag estado={estadoRag?.estado} mensaje={estadoRag?.mensaje} onReintentar={estadoRag?.refrescar} />
          <div className="chat-proyecto__banner">
            <IconDocMini />
            <span>{documentoIds.length ? `${documentoIds.length} fuente${documentoIds.length === 1 ? '' : 's'} seleccionada${documentoIds.length === 1 ? '' : 's'}` : `Todas las fuentes vigentes de ${proyecto.nombre}`}</span>
            <div className="chat-proyecto__banner-acciones">
              <Button type="button" className={herramienta === 'fuentes' ? 'activo' : ''} aria-expanded={herramienta === 'fuentes'} onClick={() => setHerramienta(herramienta === 'fuentes' ? null : 'fuentes')}>Fuentes</Button>
              <Button type="button" className={herramienta === 'comparar' ? 'activo' : ''} aria-expanded={herramienta === 'comparar'} disabled={!ragListo} onClick={() => setHerramienta(herramienta === 'comparar' ? null : 'comparar')}>Comparar</Button>
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
              {documentoIds.length > 0 && <Button type="button" className="chat-proyecto__enlace" onClick={() => setDocumentoIds([])}>Usar todas las fuentes</Button>}
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
              <Button type="submit" variant="primary" className="chat-proyecto__boton-primario" disabled={!ragListo || ocupado || !origenId || !destinoId || origenId === destinoId || mostrarArchivadas}>Comparar</Button>
            </form>
          )}

          {conversacionActiva && (
            <div className="chat-proyecto__conversacion-acciones">
              {editandoTitulo ? (
                <form onSubmit={handleRenombrar}>
                  <input value={titulo} onChange={(evento) => setTitulo(evento.target.value)} maxLength={255} autoFocus aria-label="Título de la conversación" />
                  <Button type="submit" disabled={ocupado || !titulo.trim()}>Guardar</Button>
                  <Button type="button" onClick={() => setEditandoTitulo(false)}>Cancelar</Button>
                </form>
              ) : (
                <>
                  <Button type="button" disabled={ocupado} onClick={() => { setTitulo(conversacionActiva.titulo); setEditandoTitulo(true) }}>Renombrar</Button>
                  <Button type="button" disabled={ocupado} onClick={handleArchivar}>{mostrarArchivadas ? 'Restaurar' : 'Archivar'}</Button>
                </>
              )}
            </div>
          )}

          {error && <div className="chat-proyecto__aviso" role="alert">{error}<Button type="button" onClick={() => setError('')} aria-label="Cerrar aviso">×</Button></div>}

          <ChatMensajes detalle={detalle} cargandoDetalle={cargandoDetalle} ocupado={ocupado}
            ragListo={ragListo} onReintentar={handleReintentar} finMensajesRef={finMensajesRef} />

          <form className="chat-proyecto__form" onSubmit={handleEnviar}>
            <Button type="button" className="chat-proyecto__adjuntar" onClick={handleAdjuntarClick}
              disabled={!ragListo || ocupado || mostrarArchivadas || subiendoDocumento} aria-label="Adjuntar documento">
              <IconClip />
            </Button>
            <input type="text" aria-label="Pregunta sobre los documentos" placeholder={!ragListo ? 'Preparando el asistente documental...' : mostrarArchivadas ? 'Restaura la conversación para continuar' : 'Pregunta algo sobre las fuentes del proyecto...'}
              value={pregunta} onChange={(evento) => setPregunta(evento.target.value)} maxLength={2000}
              disabled={!ragListo || ocupado || mostrarArchivadas} />
            <Button type="submit" disabled={!ragListo || ocupado || mostrarArchivadas || !pregunta.trim()} variant="primary" aria-label="Enviar pregunta"><IconEnviar /></Button>
          </form>
          <input
            ref={inputArchivoRef}
            type="file"
            accept={DOCUMENTO_ACCEPT}
            style={{ display: 'none' }}
            onChange={handleArchivoSeleccionado}
          />
        </section>
      </div>

      <SubirDocumentoInfoModal
        visible={mostrarInfoSubida}
        onCerrar={() => setMostrarInfoSubida(false)}
        onContinuar={handleContinuarSubida}
      />
      <DocumentoPendienteModal
        nombreDocumento={documentoPendienteAviso}
        onCerrar={() => setDocumentoPendienteAviso(null)}
      />
      <DocumentoSubidoModal
        nombreDocumento={documentoSubidoAviso}
        onCerrar={() => setDocumentoSubidoAviso(null)}
      />
    </div>
  )
}
