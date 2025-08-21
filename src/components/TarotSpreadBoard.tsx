import React, { useMemo, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils';

// Types
export type CardItem = { id: string; name: string; imageUrl?: string }
export type SpreadName =
  | 'Grid6x13'
  | 'Line3'
  | 'Cross5'
  | 'CelticCross10'
  | 'Star7'
  | 'Horseshoe7'
  | 'YearAhead12'
  | 'NineSquare'

export type CardAnnotation = { title: string; label: string; copy?: string };

// Utility: clamp
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// Calculate positions (0..1) for spreads
function layoutFor(
  spread: SpreadName,
  count: number
): { x: number; y: number; r?: number; z?: number }[] {
  switch (spread) {
    case 'Grid6x13': {
      const cols = 13
      const rows = 6
      const positions: { x: number; y: number }[] = []
      for (let i = 0; i < 78; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        const x = (col + 0.5) / cols
        const y = (row + 0.5) / rows
        positions.push({ x, y })
      }
      return positions as any
    }
    case 'Line3': {
      const n = Math.min(count, 3)
      const positions = new Array(n).fill(0).map((_, i) => ({
        x: (i + 1) / (n + 1),
        y: 0.5,
      }))
      return positions
    }
    case 'Cross5': {
      const map = [
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.22 },
        { x: 0.5, y: 0.78 },
        { x: 0.22, y: 0.5 },
        { x: 0.78, y: 0.5 },
      ]
      return map.slice(0, Math.min(5, count))
    }
    case 'CelticCross10': {
      const P = {
        c: { x: 0.35, y: 0.5 },
        right: 0.7,
        space: 0.12,
      }
      const out = [
        { x: P.c.x, y: P.c.y },
        { x: P.c.x, y: P.c.y, r: 90, z: 2 },
        { x: P.c.x - 0.18, y: P.c.y },
        { x: P.c.x, y: P.c.y + 0.22 },
        { x: P.c.x, y: P.c.y - 0.22 },
        { x: P.c.x + 0.18, y: P.c.y },
        { x: P.right, y: 0.25 },
        { x: P.right, y: 0.25 + P.space },
        { x: P.right, y: 0.25 + P.space * 2 },
        { x: P.right, y: 0.25 + P.space * 3 },
      ]
      return out.slice(0, Math.min(10, count))
    }
    case 'Star7': {
      const around = Math.min(count - 1, 6)
      const radius = 0.33
      const cx = 0.5, cy = 0.5
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i < around; i++) {
        const angle = ((-90 + i * (360 / around)) * Math.PI) / 180
        pts.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
      }
      if (count > 0) pts.push({ x: cx, y: cy })
      return pts
    }
    case 'Horseshoe7': {
      const n = Math.min(count, 7)
      const pts: { x: number; y: number }[] = []
      const start = 200, end = -20
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1)
        const angle = ((start + t * (end - start)) * Math.PI) / 180
        const r = 0.36
        pts.push({ x: 0.5 + r * Math.cos(angle), y: 0.55 + r * Math.sin(angle) })
      }
      return pts
    }
    case 'YearAhead12': {
      const n = Math.min(count, 12)
      const r = 0.38
      const cx = 0.5, cy = 0.5
      return new Array(n).fill(0).map((_, i) => {
        const angle = ((-90 + (i * 360) / n) * Math.PI) / 180
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
      })
    }
    case 'NineSquare': {
      const cols = 3, rows = 3
      const n = Math.min(count, 9)
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        pts.push({ x: (col + 0.5) / cols, y: (row + 0.5) / rows })
      }
      return pts.map(p => ({ x: 0.5 + (p.x - 0.5) * 0.9, y: 0.5 + (p.y - 0.5) * 0.9 }))
    }
    default:
      return []
  }
}

// Card visual
function TarotCard({ card, w, r = 0, isFlipped }: { card: CardItem; w: number; r?: number; isFlipped?: boolean }) {
  const h = Math.round(w * 1.62)
  
  return (
    <div className="relative select-none" style={{ width: w, height: h, perspective: '1000px' }}>
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d', rotate: r }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        {/* Back */}
        <div className="absolute inset-0 rounded-2xl shadow-lg overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-700/40 to-fuchsia-700/40" style={{ backfaceVisibility: 'hidden' }}>
          <img src="/tarot/back.svg" alt="Tarot card back" className="w-full h-full object-cover" />
        </div>
        {/* Front */}
        <div className="absolute inset-0 rounded-2xl shadow-lg overflow-hidden border border-white/10 bg-stone-900" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center p-2">
              <span className="text-sm font-semibold">{card.name}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Main board component
export default function TarotSpreadBoard({
  selectedCards,
  spread: spreadProp,
  annotations,
  cardsFlipped,
  mode,
}: {
  selectedCards: CardItem[]
  spread: SpreadName
  annotations?: CardAnnotation[];
  cardsFlipped?: boolean;
  mode?: 'grid' | 'spread';
}) {
  const [spread, setSpread] = useState<SpreadName>(spreadProp ?? 'CelticCross10')
  useEffect(() => {
    if (spreadProp) setSpread(spreadProp)
  }, [spreadProp])

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect
      setContainerSize({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const positions = useMemo(() => {
    return layoutFor(spread, selectedCards.length)
  }, [spread, selectedCards.length])

  const cardW = useMemo(() => {
    const { w, h } = containerSize
    if (w === 0 || h === 0) return 120
    const map: Record<SpreadName, number> = {
      CelticCross10: Math.min(w, h) * 0.14,
      Cross5: Math.min(w, h) * 0.16,
      Star7: Math.min(w, h) * 0.14,
      Horseshoe7: Math.min(w, h) * 0.13,
      YearAhead12: Math.min(w, h) * 0.12,
      NineSquare: Math.min(w, h) * 0.14,
      Line3: Math.min(w, h) * 0.18,
      Grid6x13: Math.min(w, h) * 0.08,
    }
    return clamp(Math.round(map[spread]), 72, 200)
  }, [containerSize, spread])

  return (
    <div className="w-full h-full flex flex-col gap-3 text-white">
      <div 
        ref={ref} 
        className="relative flex-1 rounded-3xl sv-board p-4 md:p-6 min-h-[480px] overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), transparent 60%)' }} />
          <AnimatePresence>
            {positions.map((p, i) => {
              const card = selectedCards[i]
              if (!card) return null
              const left = `calc(${(p.x * 100).toFixed(2)}% - ${cardW / 2}px)`
              const cardH = Math.round(cardW * 1.62);
              const topCard = `calc(${(p.y * 100).toFixed(2)}% - ${cardH / 2}px)`;
              const topLabel = `calc(${(p.y * 100).toFixed(2)}% + ${cardH / 2 + 6}px)`;
              const ann = annotations?.[i];

              return (
                <React.Fragment key={card.id + String(i)}>
                  <motion.div
                    className="absolute"
                    style={{ left, top: topCard, zIndex: (p as any).z ?? (i + 1) }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 24, delay: i * 0.03 }}
                  >
                    <TarotCard card={card} w={cardW} r={p.r} isFlipped={cardsFlipped} />
                  </motion.div>

                  {ann && cardsFlipped && (
                    <motion.div
                      className={cn(
                        "absolute text-[11px] leading-snug text-amber-100/90",
                        "px-2 py-1 rounded-md bg-stone-950/70 border border-white/10 backdrop-blur-sm"
                      )}
                      style={{ left, top: topLabel, width: cardW, zIndex: 999 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    >
                      <div className="font-semibold truncate">{ann.title}</div>
                      <div className="opacity-80 italic">{ann.label}</div>
                    </motion.div>
                  )}
                </React.Fragment>
              )
            })}
          </AnimatePresence>
      </div>
    </div>
  )
}