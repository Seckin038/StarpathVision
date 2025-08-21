import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Position, SpreadKind } from "@/lib/positions";
import { positionsFor } from "@/lib/positions";

export type CardItem = { id:string; name:string; imageUrl?:string|null };
export type Annotation = { title:string; label:string };

type Props = {
  cards: CardItem[];
  kind?: SpreadKind;
  customPositions?: Position[];
  cardWidthPct?: number;   // t.o.v. board-breedte
  className?: string;
  annotations?: Annotation[];
  cardsFlipped?: boolean;
  debugGrid?: boolean;
};

const DEFAULT_CARD_WIDTH: Record<SpreadKind, number> = {
  "daily-1":14,"two-choice-2":13,"ppf-3":13,"line-3":13,
  "star-6":12,"horseshoe-7":12,"cross-10":11,"year-12":10,"custom":12
};

// 1% van board-breedte vertaalt naar (16/9) / (2/3) = 8/3 % van board-hoogte
const HEIGHT_PCT_PER_WIDTH_PCT = 8/3; // ≈ 2.6667

export default function TarotSpreadBoard({
  cards, kind="ppf-3", customPositions, cardWidthPct, className,
  annotations, cardsFlipped, debugGrid
}: Props) {
  const positions: Position[] = (customPositions?.length ? customPositions : positionsFor(kind, cards.length));

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
            {Array.from({length:100}).map((_,i)=>(
              <div key={i} className="border border-white/5" />
            ))}
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
          <div
            key={`${card.id}_${i}`}
            className="absolute"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              transform: `translate(-50%, -50%) rotate(${p.r ?? 0}deg)`,
              zIndex: p.z ?? (i+1),
            }}
          >
            <div
              className="relative w-full rounded-xl overflow-hidden border border-white/10
                         bg-gradient-to-b from-stone-800/40 to-stone-900/60"
              style={{ aspectRatio: "2 / 3" }}
            >
              <img src={card.imageUrl || "/tarot/back.svg"} alt={card.name}
                   className="absolute inset-0 w-full h-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,.10),transparent_55%)]" />
            </div>

            {ann && cardsFlipped && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-[160px] text-center"
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
          </div>
        );
      })}
    </div>
  );
}