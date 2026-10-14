const SESION_STORAGE_KEY = 'sesion'

/**
 * Header con el ID del usuario de la sesión actual, para que el backend
 * pueda atribuir los eventos del historial de auditoría a quien los originó.
 * El backend no valida sesiones todavía, así que esto es honor-system.
 */
export function actorHeaders() {
  try {
    const sesion = JSON.parse(localStorage.getItem(SESION_STORAGE_KEY) || 'null')
    return sesion?.id ? { 'X-Usuario-Id': String(sesion.id) } : {}
  } catch {
    return {}
  }
}
