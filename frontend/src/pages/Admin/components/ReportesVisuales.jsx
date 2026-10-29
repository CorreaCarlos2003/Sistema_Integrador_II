import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export function TarjetaStat({ etiqueta, valor, delta }) {
  return (
    <div className="reportes__stat">
      <span className="reportes__stat-etiqueta">{etiqueta}</span>
      <div className="reportes__stat-valor">{valor}</div>
      <span className="reportes__stat-delta">{delta}</span>
    </div>
  )
}

export function Donut({ datos, centroValor, centroEtiqueta }) {
  return (
    <div className="reportes__donut-fila">
      <div className="reportes__donut-wrap">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={datos}
              dataKey="valor"
              nameKey="nombre"
              innerRadius={48}
              outerRadius={65}
              paddingAngle={datos.length > 1 ? 2 : 0}
              stroke="none"
            >
              {datos.map((d) => (
                <Cell key={d.nombre} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="reportes__donut-centro">
          <strong>{centroValor}</strong>
          <span>{centroEtiqueta}</span>
        </div>
      </div>
      <div className="reportes__donut-leyenda">
        {datos.map((d) => (
          <div key={d.nombre} className="reportes__leyenda-item">
            <span className="reportes__leyenda-dot" style={{ background: d.color }} />
            <span className="reportes__leyenda-nombre">{d.nombre}</span>
            <span className="reportes__leyenda-pct">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
