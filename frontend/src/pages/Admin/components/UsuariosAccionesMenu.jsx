import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Button from '../../../components/ui/Button'
import './UsuariosAccionesMenu.css'

export default function UsuariosAccionesMenu({ nombre, acciones }) {
  const [abierto, setAbierto] = useState(false)
  const [posicion, setPosicion] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const anclaRef = useRef(null)
  const menuId = useId()

  useLayoutEffect(() => {
    if (!abierto) return
    const trigger = triggerRef.current.getBoundingClientRect()
    anclaRef.current = trigger
    const menu = menuRef.current.getBoundingClientRect()
    // El menú se monta fuera del contenedor desplazable y se ajusta al viewport.
    setPosicion({ left: Math.max(8, Math.min(innerWidth - menu.width - 8, trigger.right - menu.width)), top: trigger.bottom + menu.height + 8 > innerHeight ? Math.max(8, trigger.top - menu.height - 4) : trigger.bottom + 4 })
  }, [abierto])

  useLayoutEffect(() => {
    if (abierto && posicion) menuRef.current.querySelector('button')?.focus({ preventScroll: true })
  }, [abierto, posicion])

  useEffect(() => {
    if (!abierto) return undefined
    const outside = (e) => {
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setAbierto(false)
    }
    const cerrar = () => setAbierto(false)
    const alDesplazar = () => {
      const actual = triggerRef.current?.getBoundingClientRect()
      const anterior = anclaRef.current
      if (actual && anterior && (Math.abs(actual.top - anterior.top) > 1 || Math.abs(actual.left - anterior.left) > 1)) cerrar()
    }
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', cerrar)
    window.addEventListener('scroll', alDesplazar, true)
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', cerrar)
      window.removeEventListener('scroll', alDesplazar, true)
    }
  }, [abierto])

  return <>
    <Button ref={triggerRef} className="usuarios__btn-kebab" aria-label={`Acciones de ${nombre}`} aria-expanded={abierto} aria-controls={abierto ? menuId : undefined}
      onClick={() => { setPosicion(null); setAbierto((actual) => !actual) }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
    </Button>
    {abierto && createPortal(<div ref={menuRef} id={menuId} role="group" aria-label={`Acciones de ${nombre}`} className="usuarios-acciones-menu"
      style={{ ...posicion, visibility: posicion ? 'visible' : 'hidden' }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setAbierto(false); triggerRef.current?.focus() } }}
      onBlur={(e) => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget) && e.relatedTarget !== triggerRef.current) setAbierto(false) }}>
      {acciones.map((accion) => <Button key={accion.label} className={accion.peligro ? 'usuarios-acciones-menu__peligro' : ''} onClick={() => { setAbierto(false); accion.onClick(triggerRef.current) }}>{accion.label}</Button>)}
    </div>, document.body)}
  </>
}
