import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/spreadUtils";

/** Een kaart uit je deck (na de selectie) */
export type CardItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export type Position = {
  /** genormaliseerde positie 0..1 */
  x: number;
  y: number;
  /** rotatie in graden (optioneel) */
  r?: number;
  /** z-index voorkeur (optioneel) */
  z?: number;
  /** optioneel label (wordt niet gerenderd hier, maar handig voor debug) */
  label?: string;
};

export type SpreadKind =
  | "daily-1"
  | "two-choice-2"
  | "ppf-3"
  | "line-3"
  | "star-6"
  | "horseshoe-7"
  | "cross-10"     // Celtic Cross
  | "year-12"
  | "custom";

export type Annotation = {
  title: string;
  label: string;
};

type Props = {
  /** Kaarten in slot-volgorde (1..N) */
  cards: CardItem[];
  /** Kies een ingebouwde vorm óf gebruik customPositions */
  kind?: SpreadKind;
  /** Overschrijf posities (bijv. uit je DB / spread-library) */
  customPositions?: Position[];
  /** extra className op board */
  className?: string;
  /** Annotaties om onder de kaarten te tonen */
  annotations?: Annotation[];
  /** Bepaalt of de annotaties zichtbaar zijn */
  cardsFlipped?: boolean;
};

/* ---------- helpers voor vormen ---------- */

function circlePositions(n: number, opts?: { cx?: number; cy?: number; r?: number; startDeg?: number }) {
  const cx = opts?.cx ?? 0.5;
  const cy = opts?.cy ?? 0.5;
  const r  = opts?.r  ?? 0.36;
  const start = (opts?.startDeg ?? -90) * (Math.PI / 180);
  const res: Position[] = [];
  for (let i = 0; i < n; i++) {
    const t = start + (i * 2 * Math.PI) / n;
    res.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return res;
}

function horseshoe7(): Position[] {
  const xs = [0.10, 0.23, 0.36, 0.50, 0.64, 0.77, 0.90];
  const ys = [0.70, 0.60, 0.50, 0.45, 0.50, 0.60, 0.70];
  return xs.map((x, i) => ({ x, y: ys[i] }));
}

function celticCross10(): Position[] {
  return [
    { x: 0.33, y: 0.50, z: 2 },           // 1
    { x: 0.33, y: 0.50, r: 90, z: 3 },    // 2 (cross)
    { x: 0.20, y: 0.50 },                 // 3 (left)
    { x: 0.33, y: 0.66 },                 // 4 (bottom)
    { x: 0.33, y: 0.34 },                 // 5 (top)
    { x: 0.46, y: 0.50 },                 // 6 (right of 1)
    { x: 0.70, y: 0.65 },                 // 7 (staff, bottom)
    { x: 0.70, y: 0.51 },                 // 8
    { x: 0.70, y: 0.37 },                 // 9
    { x: 0.70, y: 0.23 },                 // 10 (top)
  ];
}

function star6(): Position[] {
  return circlePositions(6, { r: 0.33, startDeg: -90 });
}

function line3(): Position[] {
  return [
    { x: 0.25, y: 0.50 },
    { x: 0.50, y: 0.50 },
    { x: 0.75, y: 0.50 },
  ];
}

function twoChoice2(): Position[] {
  return [
    { x: 0.35, y: 0.50 },
    { x: 0.65, y: 0.50 },
  ];
}

function daily1(): Position[] {
  return [{ x: 0.50, y: 0.50 }];
}

function year12(): Position[] {
  return circlePositions(12, { r: 0.38, startDeg: -90 });
}

const CARD_WIDTH_FRACTION: Record<SpreadKind, number> = {
  "daily-1": 0.14, "two-choice-2": 0.13, "ppf-3": 0.13, "line-3": 0.13,
  "star-6": 0.12, "horseshoe-7": 0.12, "cross-10": 0.11, "year-12": 0.10, "custom": 0.12,
};

function positionsFor(kind: SpreadKind, n: number): Position[] {
  switch (kind) {
    case "daily-1": return daily1();
    case "two-choice-2": return twoChoice2();
    case "ppf-3": case "line-3": return line3();
    case "star-6": return star6();
    case "horseshoe-7": return horseshoe7();
    case "cross-10": return celticCross10();
    case "year-12": return year12();
    default: return circlePositions(n);
  }
}

/* ---------- component ---------- */

export default function TarotSpreadBoard({
  cards,
  kind = "ppf-3",
  customPositions,
  className,
  annotations,
  cardsFlipped,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setBoardSize({ w: rect.width, h: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  const cardSize = useMemo(() => {
    const CARD_ASPECT_RATIO = 65 / 112;
    const widthFraction = CARD_WIDTH_FRACTION[kind] || 0.12;
    const w = Math.min(boardSize.w * widthFraction, 180);
    const h = w / CARD_ASPECT_RATIO;
    return { w, h };
  }, [boardSize, kind]);

  const positions: Position[] = customPositions && customPositions.length
      ? customPositions
      : positionsFor(kind, cards.length);

  return (
    <div
      ref={stageRef}
      className={cn(
        "spread-stage bg-gradient-to-b from-purple-500/10 to-indigo-600/10",
        "shadow-[inset_0_0_40px_rgba(0,0,0,.35)]",
        className
      )}
      style={{ aspectRatio: "16 / 9" }}
    >
      {boardSize.w > 0 && cards.map((card, i) => {
        const p = positions[i];
        if (!p) return null;

        const targetX = p.x * boardSize.w;
        const targetY = p.y * boardSize.h;

        const left = clamp(targetX - cardSize.w / 2, 0, boardSize.w - cardSize.w);
        const top = clamp(targetY - cardSize.h / 2, 0, boardSize.h - cardSize.h);
        
        const rot = p.r ?? 0;
        const z = p.z ?? (i + 1);
        const ann = annotations?.[i];

        return (
          <div
            key={card.id + "_" + i}
            className="tarot-card-container"
            style={{
              width: cardSize.w,
              height: cardSize.h,
              left: left,
              top: top,
              transform: `rotate(${rot}deg)`,
              zIndex: z,
            }}
          >
            <div
              className="relative w-full h-full rounded-xl overflow-hidden border border-white/10
                         bg-gradient-to-b from-stone-800/40 to-stone-900/60"
            >
              <img
                src={card.imageUrl || '/tarot/back.svg'}
                alt={card.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,.10),transparent_55%)]" />
            </div>
            
            {ann && cardsFlipped && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-[150px] text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <div className={cn(
                  "inline-block text-[11px] leading-snug text-amber-100/90",
                  "px-2 py-1 rounded-md bg-stone-950/70 border border-white/10 backdrop-blur-sm"
                )}>
                  <div className="font-semibold truncate">{ann.title}</div>
                  <div className="opacity-80 italic">{ann.label}</div>
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}