import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { positionsFor, normalizePositions, type Position, type SpreadKind } from "@/lib/positions";

export type CardItem = { id:string; name:string; imageUrl?:string|null };
export type Annotation = { title:string; label:string };

type Props = {
  cards: CardItem[];
  kind?: SpreadKind;
  customPositions?: Position[];
  cardWidthPct?: number;
  className?: string;
  annotations?: Annotation[];
  cardsFlipped?: boolean;
  debugGrid?: boolean;
  onCardClick?: (card: CardItem) => void;
};

const DEFAULT_CARD_WIDTH: Record<SpreadKind, number> = {
  "daily-1": 12,
  "two-choice-2": 11,
  "ppf-3": 10,
  "line-3": 10,
  "star-6": 9.5,
  "horseshoe-7": 10,
  "cross-10": 9,
  "year-12": 8.5,
  "pentagram-5": 10,
  "cross-5": 10,
  "chakra-7": 10,
  "planetary-7": 10,
  "week-7": 10,
  "career-10": 9,
  "tree-of-life-10": 9,
  "romani-21": 7,
  "grand-tableau-36": 6,
  "full-deck-78": 5,
  "custom": 10
};

const HEIGHT_PCT_PER_WIDTH_PCT = 8/3;

export default function TarotSpreadBoard({
  cards, kind="ppf-3", customPositions, cardWidthPct, className,
  annotations, cardsFlipped, debugGrid, onCardClick
}: Props) {
  const desired = cards.length;
  let positions: Position[];

  if (kind !== 'custom') {
    positions = positionsFor(kind, desired);
  } else if (customPositions && customPositions.length >= desired) {
    positions = normalizePositions(customPositions.slice(0, desired));
  } else {
    positions = positionsFor('custom', desired);
  }

  const widthPct = cardWidthPct ?? DEFAULT_CARD_WIDTH[kind];
  const halfW = widthPct / 2;
  const halfH = (widthPct * HEIGHT_PCT_PER_WIDTH_PCT) / 2;

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border border-white/10 overflow-hidden",
        "bg-gradient-to-b from-purple-500/10 to-indigo-600/10 shadow-[inset_0_0_40px_rgba(0,0,0,.35)]",
        className
      )}
      style={{ aspectRatio: "16 / 9" }}
    >
      {debugGrid && (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
            {Array.from({length:100}).map((_,i)=>(<div key={i} className="border border-white/5" />))}
          </div>
        </div>
      )}

      {cards.map((card, i) => {
        const p = positions[i];
        if (!p) return null;

        const targetX = (p.x ?? 0.5) * 100;
        const targetY = (p.y ?? 0.5) * 100;

        const leftPct = Math.max(halfW, Math.min(100 - halfW, targetX));
        const topPct  = Math.max(halfH, Math.min(100 - halfH,  targetY));

        const ann = annotations?.[i];

        return (
          <motion.div
            key={`${card.id}_${i}`}
            className="absolute"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              transform: `translate(-50%, -50%) rotate(${p.r ?? 0}deg)`,
              zIndex: p.z ?? (i+1),
            }}
            whileHover={{ scale: 1.05, zIndex: 100 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => onCardClick?.(card)}
              className="w-full rounded-xl overflow-hidden border border-white/10
                         bg-gradient-to-b from-stone-800/40 to-stone-900/60"
              style={{ aspectRatio: "2 / 3" }}
            >
              <img src={card.imageUrl || "/tarot/back.svg"} alt={card.name}
                   className="absolute inset-0 w-full h-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,.10),transparent_55%)]" />
            </button>

            {ann && cardsFlipped && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-[160px] text-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i*0.04 }}
              >
                <div className="inline-block text-[11px] leading-snug text-amber-100/90
                                px-2 py-1 rounded-md bg-stone-950/70 border border-white/10 backdrop-blur-sm">
                  <div className="font-semibold truncate">{ann.title}</div>
                  <div className="opacity-80 italic">{ann.label}</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}