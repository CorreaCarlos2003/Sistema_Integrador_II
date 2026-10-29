import { useState } from 'react'

function Sparkle({ className = '' }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2ZM20 2v4M18 4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export default function LoginVisual() {
  const [paused, setPaused] = useState(false)
  return (
    <aside className={`login-visual ${paused ? 'login-visual--paused' : ''}`} aria-label="DocAI, conocimiento conectado">
      <span className="login-visual__eyebrow"><Sparkle />Inteligencia en cada proyecto</span>
      <button className="login-visual__pause" type="button" aria-label={paused ? 'Reanudar animación' : 'Pausar animación'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? '▷' : 'Ⅱ'}</button>
      <div className="login-network" aria-hidden="true">
        <svg className="login-network__connections" viewBox="0 0 540 390" fill="none"><circle cx="270" cy="195" r="162" /><circle cx="270" cy="195" r="128" /><circle className="login-network__dashed" cx="270" cy="195" r="103" /><path d="m154 108 116 87 126-91M150 292l120-97 140 99" /><circle className="login-network__point" cx="235" cy="76" r="3" /><circle className="login-network__point" cx="367" cy="249" r="3" /></svg>
        <div className="login-network__hub"><Sparkle /><strong>DocAI</strong><span>Conocimiento conectado</span></div>
        <div className="login-network__card login-network__project"><small>Proyecto</small><p><i>✓</i>Planificación</p><p><i>✓</i>Investigación</p><p><i className="unchecked" />Entrega final</p></div>
        <div className="login-network__card login-network__document"><b>▤ <span>Documento</span></b><div className="login-network__lines"><i /><i /><i /></div><small>Analizado ✓</small></div>
        <div className="login-network__card login-network__team"><small>Colaboración</small><div className="login-network__avatars"><span>AM</span><span>LP</span><span>LC</span><span>+3</span></div></div>
        <div className="login-network__card login-network__insight"><div className="login-network__spark"><Sparkle /></div><div><b>Insight generado</b><p>Tu proyecto avanza<br />según lo planeado.</p></div></div>
        <Sparkle className="login-network__star" />
      </div>
      <div className="login-visual__copy"><span className="login-visual__rule" /><h2>Todo conectado.<br /><span>Todo más inteligente.</span></h2><p>Transforma la información de tu equipo en decisiones que impulsan tus proyectos.</p><div className="login-visual__dots" aria-hidden="true"><i /><i /><i /></div></div>
    </aside>
  )
}
