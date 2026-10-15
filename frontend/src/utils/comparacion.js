export function obtenerCambiosComparacion(contenido) {
  if (!contenido?.startsWith('Cambios encontrados:')) return null

  const patron = /(?:^|\n)\s*(\d+)\.\s+(Agregado|Eliminado|Modificado)\s*\n([\s\S]*?)(?=\n\s*\d+\.\s+(?:Agregado|Eliminado|Modificado)\s*\n|$)/g
  const bloques = [...contenido.matchAll(patron)]
  if (!bloques.length) return null

  const cambios = bloques.map(([, numero, tipo, cuerpo]) => {
    const partes = /^\s*Antes:\s*([\s\S]*?)^\s*Después:\s*([\s\S]*)$/m.exec(cuerpo)
    if (!partes) return null
    return { numero: Number(numero), tipo, antes: partes[1].trim(), despues: partes[2].trim() }
  })
  return cambios.every(Boolean) ? cambios : null
}
