import { useState, useEffect } from 'react'
import './ModalNuevoProyecto.css' // We can just add it to Proyectos.css or a new file. Let's create ModalNuevoProyecto.css

export default function ModalNuevoProyecto({ isOpen, onClose, onProjectCreated }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('Por iniciar')
  const [responsableId, setResponsableId] = useState('')
  const [cargoResponsable, setCargoResponsable] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [usuarios, setUsuarios] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      const fetchUsuarios = async () => {
        try {
          const res = await fetch('http://127.0.0.1:8000/usuarios')
          if (res.ok) {
            const data = await res.json()
            setUsuarios(data)
          }
        } catch (err) {
          console.error("Error al cargar usuarios", err)
        }
      }
      fetchUsuarios()
    }
  }, [isOpen])

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
          descripcion: descripcion,
          estado,
          responsable_id: parseInt(responsableId, 10),
          cargo_responsable: cargoResponsable,
          fecha_fin: fechaFin
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear el proyecto')
      }

      const data = await response.json()
      onProjectCreated(data)
      
      // Limpiar formulario
      setNombre('')
      setDescripcion('')
      setEstado('Por iniciar')
      setResponsableId('')
      setCargoResponsable('')
      setFechaFin('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-contenido">
        <div className="modal-header">
          <h2>Nuevo Proyecto</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="modal-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group form-group-full">
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
          
          <div className="form-group form-group-full">
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
            <label htmlFor="responsable">Responsable</label>
            <select
              id="responsable"
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              required
            >
              <option value="">Seleccione un responsable...</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cargo_responsable">Cargo del Responsable en el Proyecto (Opcional)</label>
            <input 
              type="text" 
              id="cargo_responsable" 
              value={cargoResponsable} 
              onChange={(e) => setCargoResponsable(e.target.value)} 
              placeholder="Ej: Gerente, Líder Técnico..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha_fin">Fecha de Fin (Estimada)</label>
            <input 
              type="date" 
              id="fecha_fin" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)} 
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="estado">Estado Inicial</label>
            <select 
              id="estado" 
              value={estado} 
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="Por iniciar">Por iniciar</option>
              <option value="En proceso">En proceso</option>
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
  )
}
