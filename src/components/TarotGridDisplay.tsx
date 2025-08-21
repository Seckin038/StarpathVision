import React from "react";

export type TarotGridDisplayProps = {
  cardCount: number;
  maxSelect?: number;
  selected?: number[];
  onChange?: (next: number[]) => void;
  renderCard?: (index: number, isSelected: boolean) => React.ReactNode;
};

export default function TarotGridDisplay({
  cardCount,
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
      next = next.slice(next.length - maxSelect);
    }
    if (onChange) onChange(next);
    else setInternalSelected(next);
  };

  const cards = React.useMemo(() => Array.from({ length: cardCount }, (_, i) => i), [cardCount]);

  return (
    <div className="w-full">
      <div
        className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-1 md:gap-2 mx-auto w-full max-w-7xl"
      >
        {cards.map((i) => {
          const isSelected = sel.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="relative aspect-[2/3] w-full rounded-md sm:rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 focus:scale-105"
              aria-pressed={isSelected}
              aria-label={`Card ${i + 1}`}
            >
              {renderCard ? (
                renderCard(i, isSelected)
              ) : (
                <div className={`w-full h-full rounded-lg border ${isSelected ? "border-amber-500 ring-2 ring-amber-500" : "border-white/10"} bg-stone-800`}>
                  <span className="absolute bottom-1 right-1 text-xs text-amber-200/70 select-none">
                    {i + 1}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}