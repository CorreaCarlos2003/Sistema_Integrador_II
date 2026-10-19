import { useCallback, useEffect, useRef, useState } from 'react'
import { actorHeaders } from '../../../utils/actor'

const estadosActivos = new Set(['preparando', 'subiendo', 'procesando'])

export default function useCargaDocumento() {
  const [carga, setCarga] = useState(null)
  const solicitudRef = useRef(null)

  const ejecutar = useCallback(({ proyectoId, documento, archivo }) => new Promise((resolve, reject) => {
    if (solicitudRef.current) {
      reject(new Error('Ya existe una carga en curso.'))
      return
    }

    const esVersion = Boolean(documento)
    const ruta = esVersion
      ? `/proyectos/${proyectoId}/documentos/${documento.id}/versiones`
      : `/proyectos/${proyectoId}/documentos`
    const xhr = new XMLHttpRequest()
    const base = {
      visible: true,
      operacion: esVersion ? 'nueva-version' : 'nuevo-documento',
      archivo: archivo.name,
      documentoId: documento?.id ?? null,
      documentoNombre: documento?.nombre ?? null,
      estado: 'preparando',
      porcentaje: 0,
      versionCreada: null,
      error: null,
    }
    setCarga(base)
    solicitudRef.current = xhr

    xhr.open('POST', ruta)
    Object.entries(actorHeaders()).forEach(([nombre, valor]) => xhr.setRequestHeader(nombre, valor))
    xhr.upload.onloadstart = () => setCarga((actual) => ({ ...actual, estado: 'subiendo' }))
    xhr.upload.onprogress = (evento) => {
      if (!evento.lengthComputable) return
      const porcentaje = Math.min(100, Math.round((evento.loaded / evento.total) * 100))
      setCarga((actual) => ({ ...actual, estado: 'subiendo', porcentaje }))
    }
    xhr.upload.onload = () => setCarga((actual) => ({ ...actual, estado: 'procesando', porcentaje: 100 }))
    xhr.onload = () => {
      solicitudRef.current = null
      const datos = (() => {
        try { return JSON.parse(xhr.responseText) } catch { return null }
      })()
      if (xhr.status >= 200 && xhr.status < 300) {
        const numero = esVersion ? datos?.numero : datos?.numero_version
        setCarga((actual) => ({
          ...actual,
          estado: 'completado',
          porcentaje: 100,
          versionCreada: numero || '1',
        }))
        resolve(datos)
        return
      }
      const mensaje = typeof datos?.detail === 'string' ? datos.detail : 'No se pudo completar la carga.'
      setCarga((actual) => ({ ...actual, estado: 'error', error: mensaje }))
      reject(new Error(mensaje))
    }
    xhr.onerror = () => {
      solicitudRef.current = null
      const mensaje = 'No se pudo conectar con el backend.'
      setCarga((actual) => ({ ...actual, estado: 'error', error: mensaje }))
      reject(new Error(mensaje))
    }
    xhr.onabort = () => {
      solicitudRef.current = null
      setCarga((actual) => ({ ...actual, estado: 'cancelado', error: null }))
      reject(new Error('Carga cancelada'))
    }

    const formData = new FormData()
    formData.append('archivo', archivo)
    xhr.send(formData)
  }), [])

  const cancelar = useCallback(() => solicitudRef.current?.abort(), [])
  const cerrar = useCallback(() => {
    setCarga((actual) => actual && estadosActivos.has(actual.estado) ? actual : null)
  }, [])

  useEffect(() => () => solicitudRef.current?.abort(), [])

  return {
    carga,
    activa: Boolean(carga && estadosActivos.has(carga.estado)),
    subirDocumento: ({ proyectoId, archivo }) => ejecutar({ proyectoId, archivo }),
    subirVersion: ({ proyectoId, documento, archivo }) => ejecutar({ proyectoId, documento, archivo }),
    cancelar,
    cerrar,
  }
}
