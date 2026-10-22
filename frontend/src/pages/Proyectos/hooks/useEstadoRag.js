import { useCallback, useEffect, useRef, useState } from 'react'

export default function useEstadoRag() {
  const [estado, setEstado] = useState({
    estado: 'comprobando',
    mensaje: 'Comprobando el asistente documental...',
    segundos_carga: null,
  })
  const temporizadorRef = useRef(null)

  const consultar = useCallback(async () => {
    try {
      const respuesta = await fetch('/salud/rag', { cache: 'no-store' })
      if (!respuesta.ok) throw new Error('El backend no esta disponible')
      const datos = await respuesta.json()
      setEstado(datos)
      return datos
    } catch {
      const datos = {
        estado: 'no_disponible',
        mensaje: 'Esperando conexión con el backend...',
        segundos_carga: null,
      }
      setEstado(datos)
      return datos
    }
  }, [])

  useEffect(() => {
    let cancelado = false

    const comprobarHastaTerminar = async () => {
      const datos = await consultar()
      if (!cancelado && ['comprobando', 'pendiente', 'cargando', 'no_disponible'].includes(datos.estado)) {
        temporizadorRef.current = window.setTimeout(comprobarHastaTerminar, 2000)
      }
    }

    comprobarHastaTerminar()
    const alRecuperarFoco = () => consultar()
    window.addEventListener('focus', alRecuperarFoco)
    return () => {
      cancelado = true
      window.clearTimeout(temporizadorRef.current)
      window.removeEventListener('focus', alRecuperarFoco)
    }
  }, [consultar])

  return { ...estado, refrescar: consultar }
}
