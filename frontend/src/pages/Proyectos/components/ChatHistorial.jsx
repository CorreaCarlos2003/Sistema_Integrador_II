import Button from '../../../components/ui/Button'
import { IconBuscar, IconMas } from '../../../components/icons'
import { formatoRelativo } from '../../../utils/tiempo'

export default function ChatHistorial({ grupos, cargando, ocupado, busqueda, onBuscar, mostrarArchivadas, onCambiarArchivadas, conversacionActivaId, sinResultados, hayMas, onSeleccionar, onNueva, onCargarMas }) {
  return (
    <aside className="chat-proyecto__historial" aria-label="Historial de conversaciones">
      <div className="chat-proyecto__historial-nueva">
        <h2 className="chat-proyecto__historial-titulo">Conversaciones</h2>
        <Button variant="primary" onClick={onNueva} disabled={ocupado}><IconMas size={14} aria-hidden="true" />Nueva conversación</Button>
      </div>
      <div className="chat-proyecto__historial-buscar">
        <IconBuscar size={14} aria-hidden="true" />
        <input type="search" aria-label="Buscar conversación" placeholder="Buscar conversación..." value={busqueda} onChange={(evento) => onBuscar(evento.target.value)} />
      </div>
      <div className="chat-proyecto__historial-filtro">
        <Button className={!mostrarArchivadas ? 'activo' : ''} aria-pressed={!mostrarArchivadas} onClick={() => onCambiarArchivadas(false)} disabled={ocupado}>Activas</Button>
        <Button className={mostrarArchivadas ? 'activo' : ''} aria-pressed={mostrarArchivadas} onClick={() => onCambiarArchivadas(true)} disabled={ocupado}>Archivadas</Button>
      </div>
      <div className="chat-proyecto__historial-lista">
        {cargando && <p className="chat-proyecto__estado-lista" role="status">Cargando conversaciones...</p>}
        {!cargando && sinResultados && <p className="chat-proyecto__estado-lista">{busqueda ? 'No encontramos coincidencias.' : `No hay conversaciones ${mostrarArchivadas ? 'archivadas' : 'activas'}.`}</p>}
        {grupos.map((grupo) => <div key={grupo.nombre} className="chat-proyecto__historial-grupo">
          <h3 className="chat-proyecto__historial-grupo-titulo">{grupo.nombre}</h3>
          {grupo.items.map((conversacion) => <Button key={conversacion.id} disabled={ocupado}
            className={`chat-proyecto__historial-item ${conversacion.id === conversacionActivaId ? 'chat-proyecto__historial-item--activo' : ''}`}
            aria-current={conversacion.id === conversacionActivaId ? 'true' : undefined} title={conversacion.titulo} onClick={() => onSeleccionar(conversacion.id)}>
            <span className="chat-proyecto__historial-item-titulo">{conversacion.titulo}</span>
            <span className="chat-proyecto__historial-item-fecha">{formatoRelativo(new Date(conversacion.fecha_actualizacion || conversacion.fecha))}</span>
          </Button>)}
        </div>)}
        {hayMas && <Button className="chat-proyecto__cargar-mas" disabled={ocupado} onClick={onCargarMas}>Cargar más</Button>}
      </div>
    </aside>
  )
}
