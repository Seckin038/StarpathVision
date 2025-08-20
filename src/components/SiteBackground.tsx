import React from 'react'

type Mode = 'stars' | 'sigils' | 'aurora' | 'stars+sigils' | 'stars+aurora' | 'sigils+aurora' | 'all'
type Intensity = 'low' | 'med' | 'high'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setReduced(!!mq.matches)
    fn(); mq.addEventListener?.('change', fn)
    return () => mq.removeEventListener?.('change', fn)
  }, [])
  return reduced
}

export default function SiteBackground({ mode = 'all', intensity = 'med', meteors = true, planets = true, tarot = true }:{
  mode?: Mode,
  intensity?: Intensity,
  meteors?: boolean,
  planets?: boolean,
  tarot?: boolean,
}) {
  const reduced = usePrefersReducedMotion()
  const levels = { low: 50, med: 100, high: 160 }
  const starCount = levels[intensity]

  const SIGILS = [
    ...(planets ? ['☉','☽','☿','♀','♂','♃','♄'] : []),
    ...(tarot ? ['✦','✧','★','☆','✺','✹','☥','☯'] : []),
  ]

  const showStars = mode === 'stars' || mode.includes('stars') || mode === 'all'
  const showSigils = mode === 'sigils' || mode.includes('sigils') || mode === 'all'
  const showAurora = mode === 'aurora' || mode.includes('aurora') || mode === 'all'

  return (
    <div className="pointer-events-none fixed inset-0 -z-50">
      <style>{css}</style>

      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-black" />

      {/* Aurora */}
      {showAurora && (
        <div className={`absolute inset-0 ${reduced ? '' : 'sv-aurora'}`} />
      )}

      {/* Stars */}
      {showStars && (
        <div className="absolute inset-0">
          {Array.from({ length: starCount }).map((_, i) => {
            const x = Math.random() * 100
            const y = Math.random() * 100
            const s = 0.8 + Math.random() * 1.4
            const d = 3 + Math.random() * 8
            return (
              <span
                key={i}
                className={`sv-star ${reduced ? '' : 'sv-twinkle'}`}
                style={{ left: `${x}%`, top: `${y}%`, width: `${s}px`, height: `${s}px`, animationDuration: `${d}s` }}
              />
            )
          })}
        </div>
      )}

      {/* Meteors */}
      {showStars && meteors && !reduced && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: Math.round(starCount / 25) }).map((_, i) => (
            <span key={i} className="sv-meteor" style={{
              top: `${Math.random()*100}%`, left: `${Math.random()*100}%`,
              animationDelay: `${Math.random()*8}s`, animationDuration: `${4 + Math.random()*6}s`
            }} />
          ))}
        </div>
      )}

      {/* Sigils */}
      {showSigils && (
        <div className="absolute inset-0">
          {Array.from({ length: Math.min(SIGILS.length * 2, 18) }).map((_, i) => {
            const g = SIGILS[i % SIGILS.length]
            const left = (10 + (i * 7)) % 90
            const top = 10 + ((i*13) % 70)
            const d = 30 + i * 6
            const s = 0.8 + (i % 3) * 0.2
            return (
              <span key={i} className={`sv-sigil ${reduced ? '' : 'sv-rotate'}`} style={{ left: `${left}%`, top: `${top}%`, animationDuration: `${d}s`, transform: `scale(${s})` }}>{g}</span>
            )
          })}
        </div>
      )}
    </div>
  )
}

const css = `
/* Tiny stars */
.sv-star { position:absolute; background:#fff; border-radius:9999px; opacity:.7; box-shadow:0 0 6px rgba(255,255,255,.35) }
@keyframes svTwinkle { 0%{opacity:.4} 50%{opacity:1} 100%{opacity:.4} }
.sv-twinkle { animation-name: svTwinkle; animation-iteration-count: infinite; animation-timing-function: ease-in-out }

/* Meteors */
.sv-meteor { position:absolute; width:2px; height:2px; background:linear-gradient(90deg, rgba(255,255,255,.95), rgba(255,255,255,0)); box-shadow:0 0 8px rgba(255,255,255,.8); transform: translate3d(0,0,0); }
@keyframes svShoot { 0%{ transform: translate3d(0,0,0) rotate(20deg); opacity:0 } 10%{ opacity:1 } 100%{ transform: translate3d(300px,-120px,0) rotate(20deg); opacity:0 } }
.sv-meteor { animation-name: svShoot; animation-iteration-count: infinite; }

/* Sigils */
.sv-sigil { position:absolute; color: rgba(250, 204, 21, .25); font-size: 48px; text-shadow: 0 0 20px rgba(250,204,21,.12); }
@keyframes svRotate { from{ transform: rotate(0deg) } to{ transform: rotate(360deg) } }
.sv-rotate { animation-name: svRotate; animation-iteration-count: infinite; animation-timing-function: linear }

/* Aurora layer */
.sv-aurora { filter: blur(32px); background: radial-gradient(60% 80% at 20% 10%, rgba(168,85,247,.20), transparent 60%), radial-gradient(50% 70% at 80% 20%, rgba(56,189,248,.20), transparent 60%), radial-gradient(40% 60% at 30% 90%, rgba(34,197,94,.15), transparent 60%); animation: svAurora 22s ease-in-out infinite alternate; }
@keyframes svAurora { 0%{ transform: translateY(0) } 100%{ transform: translateY(-4%) } }

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sv-twinkle, .sv-rotate, .sv-meteor, .sv-aurora { animation: none !important }
}
`