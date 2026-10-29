import Button from '../../../components/ui/Button'
import { IconChispa } from '../../../components/icons'
import { obtenerCambiosComparacion } from '../../../utils/comparacion'

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

export default function ChatMensajes({ detalle, cargandoDetalle, ocupado, ragListo, onReintentar, finMensajesRef }) {
  return (
          <div className="chat-proyecto__mensajes" role="log" aria-label="Mensajes de la conversación">
            {cargandoDetalle && <div className="chat-proyecto__vacio">Cargando mensajes...</div>}
            {!cargandoDetalle && !detalle?.mensajes?.length && (
              <div className="chat-proyecto__vacio"><span className="chat-proyecto__bienvenida-icono" aria-hidden="true"><IconChispa size={24} /></span><strong>Consulta la documentación del proyecto</strong><p>Haz una pregunta sobre tus documentos o selecciona dos versiones para compararlas.</p></div>
            )}
            {!cargandoDetalle && detalle?.mensajes?.map((mensaje) => mensaje.rol === 'usuario' ? (
              <div key={mensaje.id} className="chat-proyecto__mensaje-usuario">
                <div className="chat-proyecto__usuario-contenido">
                  <div className="chat-proyecto__burbuja-usuario">{mensaje.contenido}</div>
                  {mensaje.estado === 'fallido' && (
                    <div className="chat-proyecto__mensaje-fallido">
                      No se pudo completar esta {mensaje.tipo === 'comparacion' ? 'comparación' : 'respuesta'}.
                      {mensaje.tipo === 'chat' && <Button type="button" disabled={ocupado || !ragListo} onClick={() => onReintentar(mensaje.id)}>Reintentar</Button>}
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
  )
}
