import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- TYPE DEFINITIES ---
type Locale = 'nl' | 'en' | 'tr';

type LocalizedString = {
  [key in Locale]: string;
};

type TarotCard = {
  id: string;
  name: string;
  image: string;
};

type DrawnCard = {
  positionId: string;
  card: TarotCard;
  isReversed: boolean;
};

type SpreadPosition = {
  id: string;
  label: LocalizedString;
};

type LayoutCoord = {
  id: string;
  x: number;
  y: number;
  rotation?: number;
};

type SpreadLayout = {
  type: 'absolute' | 'row' | 'circle' | 'arc' | 'stair' | 'columns';
  gap?: number;
  origin?: { x: number | string; y: number | string };
  radius?: number;
  cardSize?: { w: number; h: number };
  coords?: LayoutCoord[];
  step?: number;
  columns?: number;
};

type Spread = {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  drawCount: number;
  positions: SpreadPosition[];
  layout: SpreadLayout;
};

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
      if (newSet.has(positionId)) {
        // newSet.delete(positionId); // Uncomment to allow flipping back
      } else {
        newSet.add(positionId);
      }
      return newSet;
    });
  };

  const cardPositions = calculateCardPositions(spread, draw);

  return (
    <div className={cn('relative w-full min-h-[600px] p-4', className)}>
      <AnimatePresence>
        {cardPositions.map(({ drawnCard, style, position }) => (
          <motion.div
            key={drawnCard.positionId}
            className="absolute"
            style={style}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          >
            <div className="relative group">
              <Card
                drawnCard={drawnCard}
                isFlipped={flippedCards.has(drawnCard.positionId)}
                onClick={() => handleCardClick(drawnCard.positionId)}
                cardSize={spread.layout.cardSize}
              />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max text-center">
                <p className="text-xs font-semibold text-amber-200 bg-black/50 px-2 py-1 rounded">
                  {position.label[locale]}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- SUBCOMPONENT: Card ---
interface CardProps {
  drawnCard: DrawnCard;
  isFlipped: boolean;
  onClick: () => void;
  cardSize?: { w: number; h: number };
}

function Card({ drawnCard, isFlipped, onClick, cardSize }: CardProps) {
  const { card, isReversed } = drawnCard;
  const width = cardSize?.w || 120;
  const height = cardSize?.h || 200;

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
  const cardSize = layout.cardSize || { w: 120, h: 200 };
  const origin = {
    x: typeof layout.origin?.x === 'string' ? 0 : layout.origin?.x || 0,
    y: typeof layout.origin?.y === 'string' ? 0 : layout.origin?.y || 0,
  };

  const positionMap = new Map(positions.map(p => [p.id, p]));
  const drawnMap = new Map(draw.map(d => [d.positionId, d]));

  let styles: { [key: string]: React.CSSProperties } = {};

  switch (layout.type) {
    case 'absolute':
      layout.coords?.forEach(coord => {
        styles[coord.id] = {
          left: `calc(${layout.origin?.x || '50%'} + ${coord.x - cardSize.w / 2}px)`,
          top: `calc(${layout.origin?.y || '50%'} + ${coord.y - cardSize.h / 2}px)`,
          transform: `rotate(${coord.rotation || 0}deg)`,
        };
      });
      break;

    case 'row':
      const totalWidth = draw.length * cardSize.w + (draw.length - 1) * (layout.gap || 20);
      draw.forEach((d, i) => {
        styles[d.positionId] = {
          left: `calc(50% - ${totalWidth / 2}px + ${i * (cardSize.w + (layout.gap || 20))}px)`,
          top: '50%',
          transform: 'translateY(-50%)',
        };
      });
      break;

    case 'circle':
    case 'arc':
      const angleStep = (layout.type === 'circle' ? 360 : 180) / (draw.length > 1 ? (layout.type === 'circle' ? draw.length : draw.length -1) : 1);
      const startAngle = layout.type === 'arc' ? -90 : 0;
      draw.forEach((d, i) => {
        const angle = (startAngle + i * angleStep) * (Math.PI / 180);
        const x = (layout.radius || 250) * Math.cos(angle);
        const y = (layout.radius || 250) * Math.sin(angle);
        styles[d.positionId] = {
          left: `calc(${layout.origin?.x || '50%'} + ${x - cardSize.w / 2}px)`,
          top: `calc(${layout.origin?.y || '50%'} + ${y - cardSize.h / 2}px)`,
        };
      });
      break;
      
    case 'stair':
        const totalStairWidth = draw.length * (layout.step || 95);
        draw.forEach((d, i) => {
            styles[d.positionId] = {
                left: `calc(${layout.origin?.x || '50%'} - ${totalStairWidth/2}px + ${i * (layout.step || 95)}px)`,
                top: `calc(${layout.origin?.y || '50%'} + ${i * (layout.step || 95) - (draw.length * (layout.step || 95))/2}px)`,
            };
        });
        break;

    case 'columns':
        const cols = layout.columns || 2;
        const rows = Math.ceil(draw.length / cols);
        const colWidth = cardSize.w + (layout.gap || 30);
        const rowHeight = cardSize.h + 60; // card height + label space
        const totalColWidth = cols * colWidth - (layout.gap || 30);
        draw.forEach((d, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            styles[d.positionId] = {
                left: `calc(50% - ${totalColWidth/2}px + ${col * colWidth}px)`,
                top: `calc(50% - ${(rows * rowHeight)/2}px + ${row * rowHeight}px)`,
            };
        });
        break;
  }

  return draw
    .map(drawnCard => ({
      drawnCard,
      style: styles[drawnCard.positionId],
      position: positionMap.get(drawnCard.positionId)!,
    }))
    .filter(item => item.position && item.style);
}