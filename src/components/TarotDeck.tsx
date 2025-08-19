import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TarotCard = {
  id: string;
  name: string;
  suit: string;
  number: number;
  image: string;
  meanings: {
    general: string;
    love: string;
    work: string;
    spiritual: string;
  };
  element: string;
  uprightKeywords: string[];
  reversedKeywords: string[];
};

type Props = {
  locale?: "nl" | "tr" | "en";
  maxVisible?: number;
};

export default function TarotDeck({ locale = "nl", maxVisible = 40 }: Props) {
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [revealed, setRevealed] = useState<TarotCard | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetch(`/tarot/cards.${locale}.json`).then(r => r.json());
        setCards(data);
        setDeck(shuffle(data));
      } catch (error) {
        console.error("Failed to load tarot cards:", error);
      }
    })();
  }, [locale]);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function handleShuffle() {
    setIsShuffling(true);
    setTimeout(() => {
      setDeck(shuffle(cards));
      setIsShuffling(false);
    }, 600);
  }

  function handleReset() {
    setDeck(shuffle(cards));
    setRevealed(null);
  }

  function drawTop() {
    if (deck.length === 0 || isRevealing) return;
    const [top, ...rest] = deck;
    setDeck(rest);
    setRevealed(top);
    setIsRevealing(true);
  }

  const fan = useMemo(() => {
    const subset = deck.slice(0, maxVisible);
    const count = subset.length;
    const startAngle = -45;
    const endAngle = 45;
    return subset.map((c, i) => {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = lerp(startAngle, endAngle, t);
      return { card: c, angle, idx: i };
    });
  }, [deck, maxVisible]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button onClick={handleReset} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">↺ Reset</Button>
        <Button onClick={handleShuffle} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">⤮ Schudden</Button>
        <Button onClick={drawTop} className="bg-amber-700 hover:bg-amber-600 text-white text-lg px-6 py-4">★ Trek een kaart</Button>
      </div>

      <div className="relative h-[300px] sm:h-[350px] md:h-[400px]">
        <div className="absolute inset-0 flex items-start justify-center pt-3">
          <div className="relative" style={{ perspective: 1200 }}>
            <AnimatePresence initial={false}>
              {fan.map(({ card, angle, idx }) => (
                <motion.div
                  key={card.id}
                  className={cn(
                    "absolute origin-bottom cursor-pointer",
                    "w-[80px] h-[120px] sm:w-[90px] sm:h-[136px] md:w-[100px] md:h-[152px]",
                    "rounded-lg shadow-lg overflow-hidden border border-yellow-800/40"
                  )}
                  style={{ transformOrigin: `50% 400%`, left: `calc(50% - 50px)` }}
                  initial={{ rotate: angle, y: 20, opacity: 0, x: 0 }}
                  animate={{
                    rotate: isShuffling ? angle + Math.random() * 20 - 10 : angle,
                    y: idx * 2,
                    opacity: 1,
                    x: 0
                  }}
                  exit={{ opacity: 0, y: 40, rotate: angle + 20 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                  onClick={drawTop}
                  title="Klik om te trekken"
                >
                  <img
                    src={"/tarot/back.svg"}
                    alt="Tarot kaart"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Dialog open={!!revealed} onOpenChange={(o) => { if (!o) { setRevealed(null); setIsRevealing(false); }}}>
        <DialogContent className="max-w-2xl bg-stone-900/80 backdrop-blur-md border-stone-700 text-stone-200">
          {revealed && (
            <>
              <DialogHeader>
                <DialogTitle className="text-amber-200">{revealed.name}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <motion.div
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <img src={revealed.image || "/placeholder.svg"} alt={revealed.name} className="w-48 rounded-lg shadow-xl" />
                </motion.div>
                <div className="flex-1">
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-stone-800">
                      <TabsTrigger value="general">Algemeen</TabsTrigger>
                      <TabsTrigger value="love">Liefde</TabsTrigger>
                      <TabsTrigger value="work">Werk</TabsTrigger>
                      <TabsTrigger value="spiritual">Spiritueel</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general" className="mt-3 leading-relaxed text-stone-300">{revealed.meanings.general}</TabsContent>
                    <TabsContent value="love" className="mt-3 leading-relaxed text-stone-300">{revealed.meanings.love}</TabsContent>
                    <TabsContent value="work" className="mt-3 leading-relaxed text-stone-300">{revealed.meanings.work}</TabsContent>
                    <TabsContent value="spiritual" className="mt-3 leading-relaxed text-stone-300">{revealed.meanings.spiritual}</TabsContent>
                  </Tabs>
                  <div className="mt-4 text-xs text-stone-400">
                    <strong>Trefwoorden:</strong> {revealed.uprightKeywords.join(", ")}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}