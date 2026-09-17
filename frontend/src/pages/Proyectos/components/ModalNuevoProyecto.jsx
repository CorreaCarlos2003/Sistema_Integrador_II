import { useState } from 'react'
import './ModalNuevoProyecto.css' // We can just add it to Proyectos.css or a new file. Let's create ModalNuevoProyecto.css
import ModalExito from './ModalExito'

export default function ModalNuevoProyecto({ isOpen, onClose, onProjectCreated }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('Activo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Estado para el modal de éxito
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdData, setCreatedData] = useState(null)

  if (!isOpen && !showSuccess) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/proyectos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          descripción: descripcion,
          estado
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear el proyecto')
      }

      const data = await response.json()
      setCreatedData(data)
      setShowSuccess(true)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessClose = () => {
    // Cuando el usuario acepta el mensaje de éxito, limpiamos, actualizamos la lista y cerramos
    onProjectCreated(createdData)
    setNombre('')
    setDescripcion('')
    setEstado('Activo')
    setShowSuccess(false)
    setCreatedData(null)
    onClose()
  }

  return (
    <>
      {/* Mostrar el formulario solo si no estamos mostrando el modal de éxito (o podemos dejar ambos y el de éxito superpuesto) */}
      {!showSuccess && isOpen && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <div className="modal-header">
              <h2>Nuevo Proyecto</h2>
              <button className="modal-close" onClick={onClose}>&times;</button>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre del Proyecto</label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Ej: Migración Cloud 2024"
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  placeholder="Describe el objetivo y alcance del proyecto..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="estado">Estado Inicial</label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="Activo">Activo</option>
                  <option value="Pausado">Pausado</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalExito 
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        mensaje="El proyecto se ha creado correctamente."
      />
    </>
  )
}
