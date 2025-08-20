import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import MysticalBackground from "@/components/MysticalBackground";
import TarotGridDisplay from "@/components/TarotGridDisplay";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import orakelPersona from "../data/orakel.json";

// Types
type TarotCardData = { id: string; name: string; image: string; meanings: { general: string } };
type Phase = 'loading' | 'picking' | 'generating' | 'reading';

const SELECTION_LIMIT = 3;

export default function TarotDailyReadingPage() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const [phase, setPhase] = useState<Phase>('loading');
  const [deck, setDeck] = useState<TarotCardData[]>([]);
  const [selectedCards, setSelectedCards] = useState<TarotCardData[]>([]);
  const [reading, setReading] = useState<string | null>(null);

  useEffect(() => {
    const loadCards = async () => {
      try {
        setPhase('loading');
        const cardsData = await fetch(`/tarot/cards.${locale}.json`).then(r => r.json());
        setDeck([...cardsData].sort(() => 0.5 - Math.random()));
        setPhase('picking');
      } catch (error) {
        showError("Kon tarotkaarten niet laden.");
        console.error(error);
      }
    };
    loadCards();
  }, [locale]);

  const handleSelectionComplete = async (pickedCards: TarotCardData[]) => {
    setSelectedCards(pickedCards);
    setPhase("generating");
    const toastId = showLoading("Je lezing wordt voorbereid...");

    try {
      const readingInput = {
        readingType: "Tarot",
        language: locale,
        persona: orakelPersona,
        cards: pickedCards.map((card, index) => ({
          position: `Kaart ${index + 1}`,
          card: { name: card.name, meaning_up: card.meanings.general },
        })),
        userQuestion: "Wat is de betekenis van deze drie kaarten (verleden, heden, toekomst) samen?",
      };

      const { data, error } = await supabase.functions.invoke('generate-reading', {
        body: readingInput
      });

      if (error) throw new Error(error.message);

      setReading(data.reading);
      dismissToast(toastId);
      showSuccess("Je lezing is klaar!");
      setPhase("reading");

    } catch (err: any) {
      dismissToast(toastId);
      showError(`Er ging iets mis: ${err.message}`);
      setPhase("picking");
    }
  };

  const handleReset = () => {
    setSelectedCards([]);
    setReading(null);
    setDeck(prev => [...prev].sort(() => 0.5 - Math.random()));
    setPhase('picking');
  };

  const renderContent = () => {
    switch (phase) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-96 text-stone-400">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
            <p>De kaarten worden geschud...</p>
          </div>
        );
      case 'picking':
        return (
          <TarotGridDisplay
            deck={deck}
            selectionLimit={SELECTION_LIMIT}
            onSelectionComplete={handleSelectionComplete}
          />
        );
      case 'generating':
        return (
          <div className="text-center flex flex-col items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
            <p className="text-stone-400">De kosmos wordt geraadpleegd...</p>
          </div>
        );
      case 'reading':
        return (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto"
          >
            <div className="flex justify-center gap-4 md:gap-8 mb-8">
              {selectedCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="w-1/3 max-w-[180px]"
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <img src={card.image} alt={card.name} className="w-full rounded-lg shadow-xl cursor-pointer hover:scale-105 transition-transform" />
                    </DialogTrigger>
                    <DialogContent className="bg-stone-900/80 backdrop-blur-md border-stone-700 text-stone-200">
                      <DialogHeader>
                        <DialogTitle className="text-amber-200">{card.name}</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <img src={card.image} alt={card.name} className="w-48 rounded-lg shadow-xl" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-300 mb-2">Betekenis</h3>
                          <p className="text-stone-300">{card.meanings.general}</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <p className="text-center mt-2 text-sm font-semibold">{card.name}</p>
                </motion.div>
              ))}
            </div>
            <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
              <CardHeader>
                <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5" />
                  Jouw Lezing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-300 whitespace-pre-line leading-relaxed">{reading}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles+sigils" intensity="medium" />
      <div className="relative z-10 max-w-full px-4 lg:max-w-7xl lg:px-8 mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" /> Terug
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-serif tracking-wide text-amber-200">
              Drie Kaart Legging
            </h1>
            <p className="text-stone-400">
              {phase === 'picking' ? `Kies ${SELECTION_LIMIT} kaarten die je aanspreken.` : 'Jouw persoonlijke lezing.'}
            </p>
          </div>
          <div className="w-32 text-right">
            {phase === 'reading' && (
              <Button onClick={handleReset} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">
                Opnieuw
              </Button>
            )}
          </div>
        </header>

        <main className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}