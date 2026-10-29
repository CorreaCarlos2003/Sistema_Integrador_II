import { useRef } from 'react'
import ModalShell from '../../../components/ui/ModalShell'
import Button from '../../../components/ui/Button'
import { IconDocumento, IconReloj, IconAlerta } from '../../../components/icons'
import './HistorialVersiones.css'

function fechaCompleta(valor) {
  if (!valor) return 'Sin fecha'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha)
}

export default function HistorialVersiones({ documento, versiones, cargando, error, onCerrar, onReintentar }) {
  const cerrarRef = useRef(null)
  return (
    <ModalShell open={Boolean(documento)} onClose={onCerrar} title="Historial de versiones"
      description="Consulta las versiones registradas de este documento."
      icon={<IconReloj size={20} />} className="historial-versiones-modal" dismissOnBackdrop initialFocusRef={cerrarRef}
      footer={<Button ref={cerrarRef} onClick={onCerrar}>Cerrar</Button>}>
      {documento && <>
        <div className="historial-versiones__documento">
          <span className="historial-versiones__icono" aria-hidden="true"><IconDocumento size={20} /></span>
          <div><span>Documento</span><strong>{documento.nombre}</strong></div>
        </div>
        <div className="historial-versiones" aria-busy={cargando}>
          {cargando ? (
            <div className="historial-versiones__estado" role="status"><IconReloj size={24} aria-hidden="true" /><strong>Cargando versiones...</strong><p>Estamos consultando el historial del documento.</p></div>
          ) : error ? (
            <div className="historial-versiones__estado historial-versiones__estado--error" role="alert">
              <IconAlerta size={24} aria-hidden="true" /><strong>No pudimos cargar el historial</strong><p>{error}</p>
              <Button onClick={onReintentar}>Reintentar</Button>
            </div>
          ) : versiones.length === 0 ? (
            <div className="historial-versiones__estado" role="status"><IconDocumento size={24} aria-hidden="true" /><strong>No hay versiones registradas.</strong><p>Las versiones de este documento aparecerán aquí cuando estén disponibles.</p></div>
          ) : <>
            <p className="historial-versiones__total">{versiones.length} {versiones.length === 1 ? 'versión registrada' : 'versiones registradas'}</p>
            <ul className="historial-versiones__lista" aria-label="Versiones registradas">
              {versiones.map((version) => (
                <li key={version.version_id || version.id} className={`historial-versiones__item ${version.vigente ? 'historial-versiones__item--vigente' : ''}`}>
                  <span className="historial-versiones__numero">v{version.numero}</span>
                  <div className="historial-versiones__datos">
                    <strong>{version.nombre}</strong>
                    <span className="historial-versiones__fecha"><IconReloj size={13} aria-hidden="true" />{fechaCompleta(version.fecha)}</span>
                  </div>
                  <div className="historial-versiones__detalle">
                    {version.vigente && <span className="historial-versiones__vigente"><span aria-hidden="true" />Vigente</span>}
                    <span className="historial-versiones__fragmentos"><strong>{version.chunks_indexados ?? '—'}</strong> fragmentos indexados</span>
                  </div>
                </li>
              ))}
            </ul>
          </>}
        </div>
      </>}
    </ModalShell>
  )
}
