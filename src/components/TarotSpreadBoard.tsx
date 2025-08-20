import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Spread, DrawnCard, Locale, SpreadPosition } from '@/types/tarot';

// --- COMPONENT PROPS ---
interface TarotSpreadBoardProps {
  spread: Spread;
  draw: DrawnCard[];
  locale: Locale;
  className?: string;
}

// --- HOOFDCOMPONENT ---
export default function TarotSpreadBoard({
  spread,
  draw,
  locale,
  className = '',
}: TarotSpreadBoardProps) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const handleCardClick = (positionId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(positionId)) {
        newSet.add(positionId);
      }
      return newSet;
    });
  };

  const cardPositions = calculateCardPositions(spread, draw);

  return (
    <div className={cn('relative w-full min-h-[600px] p-4 flex items-center justify-center', className)}>
      <div className="relative w-full h-full">
        <AnimatePresence>
          {cardPositions.map(({ drawnCard, style, position }, index) => (
            <motion.div
              key={drawnCard.positionId}
              className="absolute"
              style={style}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.1 * index }}
            >
              <div className="relative group">
                <Card
                  drawnCard={drawnCard}
                  isFlipped={flippedCards.has(drawnCard.positionId)}
                  onClick={() => handleCardClick(drawnCard.positionId)}
                />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max text-center">
                  <p className="text-xs font-semibold text-amber-200 bg-black/50 px-2 py-1 rounded">
                    {position[locale]}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- SUBCOMPONENT: Card ---
interface CardProps {
  drawnCard: DrawnCard;
  isFlipped: boolean;
  onClick: () => void;
}

function Card({ drawnCard, isFlipped, onClick }: CardProps) {
  const { card, isReversed } = drawnCard;
  const width = 120;
  const height = 200;

  return (
    <div
      className="cursor-pointer"
      style={{ perspective: '1000px', width, height }}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Card Back */}
        <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
          <img
            src="/tarot/back.svg"
            alt="Tarot Card Back"
            className="w-full h-full object-cover rounded-lg shadow-lg border border-yellow-800/40"
          />
        </div>
        {/* Card Front */}
        <div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <img
            src={card.image || '/placeholder.svg'}
            alt={card.name}
            className={cn(
              'w-full h-full object-cover rounded-lg shadow-xl border border-amber-600/50',
              isReversed && 'rotate-180'
            )}
          />
        </div>
      </motion.div>
    </div>
  );
}

// --- LAYOUT CALCULATIE LOGICA ---
function calculateCardPositions(spread: Spread, draw: DrawnCard[]) {
  const { layout, positions } = spread;
  const cardSize = { w: 120, h: 200 };
  const gap = 40;

  const positionMap = new Map(positions.map((p) => [p.slot_key, p]));
  const styles: { [key: string]: React.CSSProperties } = {};

  const cardWidthWithGap = cardSize.w + gap;

  // For now, we'll treat most layouts as a simple horizontal line.
  // This can be expanded later with more complex layout logic.
  const totalWidth = draw.length * cardSize.w + (draw.length - 1) * gap;
  draw.forEach((d, i) => {
    styles[d.positionId] = {
      left: `calc(50% - ${totalWidth / 2}px + ${i * cardWidthWithGap}px)`,
      top: `calc(50% - ${cardSize.h / 2}px)`,
    };
  });

  return draw
    .map((drawnCard) => ({
      drawnCard,
      style: styles[drawnCard.positionId],
      position: positionMap.get(drawnCard.positionId)!,
    }))
    .filter((item) => item.position && item.style);
}