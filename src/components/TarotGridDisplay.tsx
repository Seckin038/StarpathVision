import React from "react";
import { motion } from "framer-motion";

export type TarotGridDisplayProps = {
  totalCards?: number; // default 78
  rows?: number; // default 6
  cols?: number; // default 13
  maxSelect?: number; // optional selection cap (e.g., 3 for three‑card draw)
  selected?: number[]; // controlled selection
  onChange?: (next: number[]) => void;
  // Optional: custom renderer for a card (e.g., to show numbers or custom backs)
  renderCard?: (index: number, isSelected: boolean) => React.ReactNode;
};

export default function TarotGridDisplay({
  totalCards = 78,
  rows = 6,
  cols = 13,
  maxSelect,
  selected,
  onChange,
  renderCard,
}: TarotGridDisplayProps) {
  const [internalSelected, setInternalSelected] = React.useState<number[]>([]);
  const sel = selected ?? internalSelected;

  const toggle = (i: number) => {
    const exists = sel.includes(i);
    let next = exists ? sel.filter((x) => x !== i) : [...sel, i];
    if (maxSelect && next.length > maxSelect) {
      // If over cap, drop the earliest pick
      next = next.slice(next.length - maxSelect);
    }
    if (onChange) onChange(next);
    else setInternalSelected(next);
  };

  const cards = React.useMemo(() => Array.from({ length: totalCards }, (_, i) => i), [totalCards]);

  return (
    <div className="w-full">
      <div
        className="grid gap-2 mx-auto w-full max-w-[min(100%,1400px)]"
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {cards.map((i) => {
          const isSelected = sel.includes(i);
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={`relative aspect-[2/3] w-full rounded-xl border border-purple-900/40 bg-[url('/tarot/back.svg')] bg-cover bg-center shadow-sm hover:shadow-md transition-all duration-300 ${
                isSelected ? "ring-2 ring-amber-500 scale-105" : "ring-0 hover:border-amber-600/50"
              }`}
              aria-pressed={isSelected}
              aria-label={`Card ${i + 1}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.01 }}
            >
              {renderCard ? (
                renderCard(i, isSelected)
              ) : (
                <span className="absolute bottom-1 right-1 text-xs text-amber-200/70 select-none">
                  {i + 1}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}