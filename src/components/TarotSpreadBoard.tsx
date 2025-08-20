import React, { useMemo, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
      // center, north, south, west, east
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
      // Classic 10-card layout
      //  1 center, 2 crossing (rotated), 3 left, 4 below, 5 above, 6 right,
      //  7..10 vertical staff on right
      const P = {
        c: { x: 0.35, y: 0.5 }, // center cluster area
        right: 0.7,
        left: 0.1,
        top: 0.25,
        bottom: 0.75,
        space: 0.12, // spacing between staff cards
      }
      const out = [
        { x: P.c.x, y: P.c.y }, // 1
        { x: P.c.x, y: P.c.y, r: 90, z: 2 }, // 2 (crossing)
        { x: P.c.x - 0.18, y: P.c.y }, // 3 left
        { x: P.c.x, y: P.c.y + 0.22 }, // 4 bottom
        { x: P.c.x, y: P.c.y - 0.22 }, // 5 top
        { x: P.c.x + 0.18, y: P.c.y }, // 6 right (bridge to staff)
        { x: P.right, y: P.top }, // 7
        { x: P.right, y: P.top + P.space }, // 8
        { x: P.right, y: P.top + P.space * 2 }, // 9
        { x: P.right, y: P.top + P.space * 3 }, // 10
      ]
      return out.slice(0, Math.min(10, count))
    }
    case 'Star7': {
      // 6 around + 1 center (hexagram-like ring, center last)
      const around = Math.min(count - 1, 6)
      const radius = 0.33
      const cx = 0.5
      const cy = 0.5
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i < around; i++) {
        const angle = ((-90 + i * (360 / around)) * Math.PI) / 180
        pts.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
      }
      if (count > 0) pts.push({ x: cx, y: cy })
      return pts
    }
    case 'Horseshoe7': {
      // 7-card arc from left to right (open at top)
      const n = Math.min(count, 7)
      const pts: { x: number; y: number }[] = []
      const start = 200
      const end = -20
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1)
        const angle = ((start + t * (end - start)) * Math.PI) / 180
        const r = 0.36
        pts.push({ x: 0.5 + r * Math.cos(angle), y: 0.55 + r * Math.sin(angle) })
      }
      return pts
    }
    case 'YearAhead12': {
      // 12 months around a circle
      const n = Math.min(count, 12)
      const r = 0.38
      const cx = 0.5
      const cy = 0.5
      return new Array(n).fill(0).map((_, i) => {
        const angle = ((-90 + (i * 360) / n) * Math.PI) / 180
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
      })
    }
    case 'NineSquare': {
      // 3×3 box (past-present-future × mind-heart-action, for example)
      const cols = 3
      const rows = 3
      const n = Math.min(count, 9)
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        pts.push({ x: (col + 0.5) / cols, y: (row + 0.5) / rows })
      }
      // center layout inside board (shrink slightly)
      return pts.map(p => ({ x: 0.5 + (p.x - 0.5) * 0.9, y: 0.5 + (p.y - 0.5) * 0.9 }))
    }
    default:
      return []
  }
}

// Card visual
function TarotCard({ card, w, r = 0, label }: { card: CardItem; w: number; r?: number; label?: string }) {
  const h = Math.round(w * 1.62)
  const hasImg = !!card.imageUrl
  return (
    <div className="relative select-none" style={{ width: w, height: h }}>
      <motion.div
        className="absolute inset-0 rounded-2xl shadow-lg overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-700/40 to-fuchsia-700/40 backdrop-blur-sm"
        style={{ rotate: r }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        {hasImg ? (
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-2">
              <div className="text-xs uppercase tracking-widest opacity-70">{label ?? card.id}</div>
              <div className="text-sm font-semibold">{card.name}</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Main board component
export default function TarotSpreadBoard({
  deck,
  selectedCards,
  spread: spreadProp,
  mode,
  onSpreadChange,
}: {
  deck?: CardItem[]
  selectedCards?: CardItem[]
  spread?: SpreadName
  mode?: 'grid' | 'spread'
  onSpreadChange?: (s: SpreadName) => void
}) {
  // Demo fallback deck (78 placeholder cards)
  const fallbackDeck = useMemo<CardItem[]>(() => {
    const names = [
      'The Fool','The Magician','The High Priestess','The Empress','The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Wheel of Fortune','Justice','The Hanged Man','Death','Temperance','The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World',
    ]
    // 22 majors + 56 minors placeholder labels
    const majors = names.map((n, i) => ({ id: `MA${i+0}`.padStart(3,'0'), name: n }))
    const suits = ['Wands','Cups','Swords','Pentacles']
    const ranks = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King']
    const minors: CardItem[] = []
    suits.forEach((suit, s) => {
      ranks.forEach((rank, r) => minors.push({ id: `MI${s}${r}`.padStart(3,'0'), name: `${rank} of ${suit}` }))
    })
    const full = [...majors, ...minors]
    return full.slice(0, 78)
  }, [])

  const DECK = deck && deck.length === 78 ? deck : fallbackDeck

  const [spread, setSpread] = useState<SpreadName>(spreadProp ?? 'CelticCross10')
  useEffect(() => {
    if (spreadProp) setSpread(spreadProp)
  }, [spreadProp])

  const [picked, setPicked] = useState<CardItem[]>(selectedCards ?? [])
  useEffect(() => {
    if (selectedCards) setPicked(selectedCards)
  }, [selectedCards])

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

  const effectiveMode: 'grid' | 'spread' = mode ?? (picked.length ? 'spread' : 'grid')

  const positions = useMemo(() => {
    if (effectiveMode === 'grid') return layoutFor('Grid6x13', 78)
    switch (spread) {
      case 'CelticCross10':
        return layoutFor('CelticCross10', Math.min(picked.length, 10))
      case 'Cross5':
        return layoutFor('Cross5', Math.min(picked.length, 5))
      case 'Star7':
        return layoutFor('Star7', Math.min(picked.length, 7))
      case 'Horseshoe7':
        return layoutFor('Horseshoe7', Math.min(picked.length, 7))
      case 'YearAhead12':
        return layoutFor('YearAhead12', Math.min(picked.length, 12))
      case 'NineSquare':
        return layoutFor('NineSquare', Math.min(picked.length, 9))
      case 'Line3':
      default:
        return layoutFor('Line3', Math.min(picked.length, 3))
    }
  }, [effectiveMode, spread, picked.length])

  // Compute card width from container & spread density
  const cardW = useMemo(() => {
    const { w, h } = containerSize
    if (w === 0 || h === 0) return 120
    if (effectiveMode === 'grid') {
      // 13 columns with gaps
      const g = 8
      return clamp(Math.floor((w - g * 12) / 13), 60, 160)
    }
    // heuristic sizes per spread
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
  }, [containerSize, spread, effectiveMode])

  return (
    <div className="w-full h-full flex flex-col gap-3 text-white">
      <div ref={ref} className="relative flex-1 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), transparent 60%)' }} />
          <AnimatePresence>
            {positions.map((p, i) => {
              const card = picked[i]
              if (!card) return null
              const left = `calc(${(p.x * 100).toFixed(2)}% - ${cardW / 2}px)`
              const top = `calc(${(p.y * 100).toFixed(2)}% - ${Math.round(cardW*1.62)/2}px)`
              return (
                <motion.div
                  key={card.id+String(i)}
                  className="absolute"
                  style={{ left, top, zIndex: p.z ?? (i + 1) }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 24, delay: i * 0.03 }}
                >
                  <TarotCard card={card} w={cardW} r={p.r} label={`#${i+1}`} />
                </motion.div>
              )
            })}
          </AnimatePresence>
      </div>
    </div>
  )
}