import { useState, useEffect, useId, useRef } from 'react'
import { actorHeaders } from '../../../utils/actor'
import ModalShell from '../../../components/ui/ModalShell'
import FormField from '../../../components/ui/FormField'
import Button from '../../../components/ui/Button'
import './ModalNuevoProyecto.css'
import './NuevoProyectoForm.css'

export default function ModalNuevoProyecto({ isOpen, onClose, onProjectCreated }) {
  const formId = useId()
  const nameInputRef = useRef(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
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
          'Content-Type': 'application/json',
          ...actorHeaders(),
        },
        body: JSON.stringify({
          nombre,
          descripcion: descripcion,
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
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title="Nuevo Proyecto"
      description="Define el proyecto, su responsable y la fecha estimada de finalización."
      busy={loading}
      initialFocusRef={nameInputRef}
      footer={
        <>
          {loading && <span className="proyecto-form__procesando" role="status">Creando proyecto...</span>}
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" type="submit" form={formId} disabled={loading}>
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="proyecto-form" aria-busy={loading}>
        <p className="proyecto-form__nota">Los campos marcados con * son obligatorios.</p>
        {error && <div className="proyecto-form__error" role="alert">{error}</div>}
        <fieldset className="proyecto-form__campos" aria-label="Datos del proyecto" disabled={loading}>
          <FormField htmlFor="nombre" label="Nombre del Proyecto" required className="proyecto-form__full">
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej: Modernización de infraestructura"
              ref={nameInputRef}
            />
          </FormField>

          <FormField htmlFor="descripcion" label="Descripción" required className="proyecto-form__full">
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              placeholder="Describe el objetivo y alcance del proyecto..."
              rows={4}
            />
          </FormField>

          <p className="proyecto-form__seccion">Asignación y planificación</p>

          <FormField htmlFor="responsable" label="Responsable" required>
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
          </FormField>

          <FormField htmlFor="cargo_responsable" label="Cargo del responsable en el proyecto" optional>
            <input
              type="text"
              id="cargo_responsable"
              value={cargoResponsable}
              onChange={(e) => setCargoResponsable(e.target.value)}
              placeholder="Ej: Gerente, Líder Técnico..."
            />
          </FormField>

          <FormField htmlFor="fecha_fin" label="Fecha de Fin (Estimada)" required>
            <input
              type="date"
              id="fecha_fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              required
            />
          </FormField>
        </fieldset>
      </form>
    </ModalShell>
  )
}
