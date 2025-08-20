import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type TarotCardData = { id: string; [key: string]: any };

interface Props {
  deck: TarotCardData[];
  selectionLimit: number;
  onSelectionComplete: (selectedCards: TarotCardData[]) => void;
}

export default function TarotGridDisplay({ deck, selectionLimit, onSelectionComplete }: Props) {
  const [selectedCards, setSelectedCards] = useState<TarotCardData[]>([]);

  const handleCardSelect = (card: TarotCardData) => {
    setSelectedCards(prev => {
      if (prev.find(c => c.id === card.id)) {
        return prev.filter(c => c.id !== card.id);
      }
      if (prev.length < selectionLimit) {
        return [...prev, card];
      }
      return prev;
    });
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] grid-rows-[repeat(6,minmax(0,1fr))] gap-2">
        {deck.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.01 }}
            onClick={() => handleCardSelect(card)}
            className="cursor-pointer aspect-[2/3] relative"
          >
            <img
              src="/tarot/back.svg"
              alt="Tarot Kaart"
              className={`w-full h-full object-cover rounded-md transition-all duration-300 border-2 ${
                selectedCards.find(c => c.id === card.id)
                  ? 'border-amber-400 scale-105 shadow-lg shadow-amber-500/20'
                  : 'border-transparent hover:border-amber-600/50'
              }`}
            />
          </motion.div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Button
          onClick={() => onSelectionComplete(selectedCards)}
          disabled={selectedCards.length !== selectionLimit}
          className="bg-amber-700 hover:bg-amber-600 text-white text-lg px-8 py-6"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Onthul mijn lezing ({selectedCards.length}/{selectionLimit})
        </Button>
      </div>
    </div>
  );
}