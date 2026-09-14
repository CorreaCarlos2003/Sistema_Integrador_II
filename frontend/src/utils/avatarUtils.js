/**
 * Obtiene las iniciales de un nombre completo.
 * Ejemplo: "Ana Martínez" -> "AM"
 */
export const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Paleta de colores predefinida para asegurar legibilidad y armonía visual.
 */
const AVATAR_COLORS = [
  '#e2f2e5', // Verde claro
  '#f8e5e5', // Rojo claro
  '#e5eff8', // Azul claro
  '#f5e5f8', // Morado claro
  '#f8f2e5', // Amarillo claro
  '#e5f8f5', // Turquesa claro
  '#e6e5f8', // Indigo claro
  '#f8e5ed', // Rosa claro
]

const TEXT_COLORS = [
  '#2a7337', // Verde oscuro
  '#8a2b2b', // Rojo oscuro
  '#2b5c8a', // Azul oscuro
  '#6e2b8a', // Morado oscuro
  '#8a6e2b', // Amarillo oscuro
  '#2b8a7c', // Turquesa oscuro
  '#3d2b8a', // Indigo oscuro
  '#8a2b5c', // Rosa oscuro
]

/**
 * Genera un color aleatorio basado en el hash del nombre.
 * Retorna un objeto con { background, color }
 */
export const getAvatarColors = (name) => {
  if (!name) return { background: '#eee', color: '#666' }
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return {
    background: AVATAR_COLORS[index],
    color: TEXT_COLORS[index]
  }
}
