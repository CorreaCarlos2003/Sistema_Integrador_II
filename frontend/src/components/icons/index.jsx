const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconInicio = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
)

export const IconProyectos = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
  </svg>
)

export const IconChat = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <rect x="4" y="5" width="16" height="12" rx="3" />
    <path d="M9 21l3-4h0" />
    <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
  </svg>
)

export const IconUsuarios = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3 3 0 0 1 0 6" />
    <path d="M17.5 14.2a6.5 6.5 0 0 1 4 5.8" />
  </svg>
)

export const IconRoles = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15" r="1.5" />
  </svg>
)

export const IconReportes = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <path d="M4 20V10" />
    <path d="M12 20V4" />
    <path d="M20 20v-7" />
    <path d="M3 20h18" />
  </svg>
)

export const IconBuscar = (p) => (
  <svg {...base} width={p.size ?? 18} height={p.size ?? 18} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-3.5-3.5" />
  </svg>
)

export const IconCampana = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
)

export const IconAyuda = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.2a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 1.8" />
    <path d="M12 17h.01" />
  </svg>
)

export const IconMas = (p) => (
  <svg {...base} width={p.size ?? 18} height={p.size ?? 18} {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)

export const IconChispa = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} fill="currentColor" stroke="none" {...p}>
    <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z" />
    <path d="M19 15l.9 2.6L22 18.5l-2.1.9L19 22l-.9-2.6-2.1-.9 2.1-.9L19 15z" />
  </svg>
)

export const IconCarpeta = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    <circle cx="17" cy="16" r="3" fill="var(--card-bg,#fff)" />
    <path d="M17 14.7v2.6M15.8 16h2.4" />
  </svg>
)

export const IconDocumento = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </svg>
)

export const IconPdf = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
    <path d="M8.2 17v-3.2M8.2 13.8h1a1 1 0 0 1 0 2h-1M12 17v-3.2h1.1a1 1 0 0 1 0 3.2H12" />
  </svg>
)

export const IconHoja = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
    <path d="M8 13h8M8 16.5h8" />
  </svg>
)

export const IconCheckCirculo = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.3 2.3 2.3 4.7-5" />
  </svg>
)

export const IconAlerta = (p) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </svg>
)
