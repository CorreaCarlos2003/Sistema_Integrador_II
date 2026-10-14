import { useState } from 'react'
import './ProyectoAccionesMenu.css'

const IconPuntos = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
)

// Solo se muestra cuando se recibe alguna acción (únicamente el Administrador del sistema).
export default function ProyectoAccionesMenu({ proyecto, onArchivar, onEliminar, align = 'right' }) {
  const [abierto, setAbierto] = useState(false)

  if (!onArchivar && !onEliminar) return null

  return (
    <div className="proyecto-acciones-menu" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="proyecto-acciones-menu__btn"
        aria-label="Opciones del proyecto"
        onClick={() => setAbierto((v) => !v)}
      >
        <IconPuntos />
      </button>

      {abierto && (
        <div
          className={`proyecto-acciones-menu__dropdown proyecto-acciones-menu__dropdown--${align}`}
          onMouseLeave={() => setAbierto(false)}
        >
          {onArchivar && (
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                onArchivar(proyecto)
              }}
            >
              {proyecto.archivado ? 'Reactivar proyecto' : 'Archivar proyecto'}
            </button>
          )}
          {onEliminar && (
            <button
              type="button"
              className="proyecto-acciones-menu__peligro"
              onClick={() => {
                setAbierto(false)
                onEliminar(proyecto)
              }}
            >
              Eliminar proyecto
            </button>
          )}
        </div>
      )}
    </div>
  )
}
