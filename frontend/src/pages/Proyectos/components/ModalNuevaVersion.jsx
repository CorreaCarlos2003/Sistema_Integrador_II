import { useEffect, useRef, useState } from 'react'
import './VersionesDocumento.css'

export default function ModalNuevaVersion({ documento, cargando, onCancelar, onConfirmar }) {
  const [archivo, setArchivo] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (documento) window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [documento])

  useEffect(() => {
    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape' && !cargando) onCancelar()
    }
    window.addEventListener('keydown', cerrarConEscape)
    return () => window.removeEventListener('keydown', cerrarConEscape)
  }, [cargando, onCancelar])

  if (!documento) return null

  const confirmar = (evento) => {
    evento.preventDefault()
    if (archivo) onConfirmar(archivo)
  }

  return (
    <div className="versiones-modal__fondo" role="presentation" onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget && !cargando) onCancelar()
    }}>
      <section className="versiones-modal" role="dialog" aria-modal="true" aria-labelledby="modal-version-titulo">
        <header>
          <div>
            <span>Nueva versión</span>
            <h2 id="modal-version-titulo">{documento.nombre}</h2>
          </div>
          <button type="button" onClick={onCancelar} disabled={cargando} aria-label="Cerrar">×</button>
        </header>
        <form onSubmit={confirmar}>
          <div className="versiones-modal__actual">
            <span>Versión vigente</span>
            <strong>v{documento.numero_version || '1'}</strong>
          </div>
          <label className="versiones-modal__archivo">
            Archivo (máx. 30MB)
            <input
              ref={inputRef}
              type="file"
              accept=".docx,.pdf,.xlsx,.pptx,.txt,.md"
              onChange={(evento) => setArchivo(evento.target.files?.[0] || null)}
              disabled={cargando}
              required
            />
          </label>
          <p>El backend asignará automáticamente el siguiente número y conservará las versiones anteriores.</p>
          <footer>
            <button type="button" onClick={onCancelar} disabled={cargando}>Cancelar</button>
            <button type="submit" className="versiones-modal__principal" disabled={!archivo || cargando}>
              {cargando ? 'Procesando...' : 'Subir nueva versión'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
