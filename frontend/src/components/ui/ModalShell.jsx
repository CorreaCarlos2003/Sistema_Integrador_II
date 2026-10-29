import { useLayoutEffect, useId, useRef } from 'react'
import Button from './Button'
import './ModalShell.css'

export default function ModalShell({ open, onClose, title, description, icon, footer, busy = false, dismissOnBackdrop = false, initialFocusRef, returnFocusRef, children, className = '' }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = `${titleId}-description`
  const bodyId = `${titleId}-body`

  // Sincronizar el diálogo nativo antes de pintar evita un fotograma sin fondo
  // al sustituir una confirmación por su resultado en el mismo render.
  useLayoutEffect(() => {
    if (!open) return undefined
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const preferredReturnTarget = returnFocusRef?.current
    dialog.showModal()
    initialFocusRef?.current?.focus({ preventScroll: true })
    return () => {
      if (dialog.open) dialog.close()
      const returnTarget = preferredReturnTarget || previousFocus
      if (returnTarget instanceof HTMLElement && returnTarget.isConnected) {
        returnTarget.focus({ preventScroll: true })
      }
    }
  }, [open, initialFocusRef, returnFocusRef])

  return (
    <dialog
      ref={dialogRef}
      className={`docai-modal ${className}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : bodyId}
      aria-busy={busy}
      onKeyDown={(event) => {
        if (event.key !== 'Tab' || event.defaultPrevented) return
        const dialog = event.currentTarget
        const controls = Array.from(dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'))
          .filter((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden')
        if (!controls.length) {
          event.preventDefault()
          dialog.focus()
          return
        }
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault()
          first.focus()
        }
      }}
      onClick={(event) => {
        if (!dismissOnBackdrop || busy || event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
          onClose()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <header className="docai-modal__header">
        {icon && <span className="docai-modal__icon" aria-hidden="true">{icon}</span>}
        <div className="docai-modal__heading">
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <Button className="docai-modal__close" aria-label="Cerrar ventana" onClick={onClose} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="m6 6 12 12M6 18 18 6" />
          </svg>
        </Button>
      </header>
      <div id={bodyId} className="docai-modal__body">{children}</div>
      {footer && <footer className="docai-modal__footer">{footer}</footer>}
    </dialog>
  )
}
