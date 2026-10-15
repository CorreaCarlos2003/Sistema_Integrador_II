export async function pedirChat(ruta, token, opciones = {}) {
  if (!token) throw new Error('Tu sesión no tiene un token. Vuelve a iniciar sesión.')

  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      ...opciones.headers,
    },
  })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const detalle = typeof datos?.detail === 'string' ? datos.detail : 'No se pudo completar la solicitud.'
    throw new Error(respuesta.status === 401 ? 'Tu sesión venció. Vuelve a iniciar sesión.' : detalle)
  }
  return datos
}
