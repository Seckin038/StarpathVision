import React from "react";

export type TarotGridDisplayProps = {
  totalCards?: number;
  maxSelect?: number;
  selected?: number[];
  onChange?: (next: number[]) => void;
  renderCard?: (index: number, isSelected: boolean) => React.ReactNode;
};

export default function TarotGridDisplay({
  totalCards,
  maxSelect = 78,
  selected = [],
  onChange,
  renderCard,
}: TarotGridDisplayProps) {
  const count = totalCards ?? 78;

  const toggle = (i: number) => {
    if (!onChange) return;
    const isSelected = selected.includes(i);
    const nextSelection = isSelected
      ? selected.filter((item) => item !== i)
      : selected.length < maxSelect
      ? [...selected, i]
      : selected;
    onChange(nextSelection);
  };

  const cards = React.useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <div className="w-full px-1">
      <div
        className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-1 md:gap-2 mx-auto w-full max-w-7xl"
      >
        {cards.map((i) => {
          const isSelected = selected.includes(i);
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