import React from "react";

export type TarotGridDisplayProps = {
  totalCards?: number; // default 78
  rows?: number; // default 6
  cols?: number; // default 13
  maxSelect?: number; // optional selection cap (e.e.g., 3 for three‑card draw)
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

  // Build array [0..totalCards-1]
  const cards = React.useMemo(() => Array.from({ length: totalCards }, (_, i) => i), [totalCards]);

  return (
    <div className="w-full">
      {/* Ensure the grid can actually span 13 columns without flex clashes */}
      <div
        className={[
          "grid",
          // Force exact grid shape
          `grid-rows-${rows}`,
          `grid-cols-${cols}`,
          // Spacing and centering
          "gap-2 mx-auto",
          // Allow the grid to grow wide enough; prevent parent constraints from squashing columns
          "w-full max-w-[min(100%,1400px)]",
        ].join(" ")}
        style={{
          // Fallback: if Tailwind doesn't have dynamic utilities for 6x13, we enforce it via CSS here
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {cards.map((i) => {
          const isSelected = sel.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={[
                "relative aspect-[2/3] w-full",
                "rounded-xl sv-card",
                "bg-gradient-to-b from-purple-500/15 to-indigo-600/15",
                "border border-white/10",
                "shadow-[0_10px_20px_rgba(0,0,0,.25)]",
                isSelected ? "ring-2 ring-amber-500" : "ring-0",
              ].join(" ")}
              aria-pressed={isSelected}
              aria-label={`Card ${i + 1}`}
            >
              {/* Optional overlay content (index). Remove if not wanted */}
              {renderCard ? (
                renderCard(i, isSelected)
              ) : (
                <span className="absolute bottom-1 right-1 text-xs text-amber-200/70 select-none">
                  {i + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}