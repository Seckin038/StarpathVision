import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import MysticalBackground from "@/components/MysticalBackground";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import orakelPersona from "../data/orakel.json";

// Types
type TarotCardData = { id: string; name: string; image: string; meanings: { general: string } };
type ReadingStep = "picking" | "generating" | "reading";

const SELECTION_LIMIT = 3;

export default function TarotPickThreePage() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const [step, setStep] = useState<ReadingStep>("picking");
  const [deck, setDeck] = useState<TarotCardData[]>([]);
  const [selectedCards, setSelectedCards] = useState<TarotCardData[]>([]);
  const [reading, setReading] = useState<string | null>(null);

  // Load and shuffle cards
  useEffect(() => {
    const loadCards = async () => {
      try {
        const cardsData = await fetch(`/tarot/cards.${locale}.json`).then(r => r.json());
        setDeck([...cardsData].sort(() => 0.5 - Math.random()));
      } catch (error) {
        showError("Kon tarotkaarten niet laden.");
        console.error(error);
      }
    };
    loadCards();
  }, [locale]);

  const handleCardSelect = (card: TarotCardData) => {
    if (step !== "picking") return;

    setSelectedCards(prev => {
      if (prev.find(c => c.id === card.id)) {
        return prev.filter(c => c.id !== card.id);
      }
      if (prev.length < SELECTION_LIMIT) {
        return [...prev, card];
      }
      return prev;
    });
  };

  const handleGenerateReading = async () => {
    if (selectedCards.length !== SELECTION_LIMIT) return;

    setStep("generating");
    const toastId = showLoading("Je lezing wordt voorbereid...");

    try {
      const readingInput = {
        readingType: "Tarot",
        language: locale,
        persona: orakelPersona,
        cards: selectedCards.map((card, index) => ({
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
      setStep("reading");

    } catch (err: any) {
      dismissToast(toastId);
      showError(`Er ging iets mis: ${err.message}`);
      setStep("picking");
    }
  };

  const handleReset = () => {
    setSelectedCards([]);
    setReading(null);
    setStep("picking");
    setDeck(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles+sigils" intensity="medium" />
      <div className="relative z-10 max-w-6xl mx-auto">
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
              {step === 'picking' ? `Kies ${SELECTION_LIMIT} kaarten die je aanspreken.` : 'Jouw persoonlijke lezing.'}
            </p>
          </div>
          <div className="w-32 text-right">
            {step === 'reading' && (
              <Button onClick={handleReset} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">
                Opnieuw
              </Button>
            )}
          </div>
        </header>

        <main className="min-h-[60vh] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {step === "picking" && (
              <motion.div
                key="picking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                  {deck.slice(0, 40).map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
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
                    onClick={handleGenerateReading}
                    disabled={selectedCards.length !== SELECTION_LIMIT}
                    className="bg-amber-700 hover:bg-amber-600 text-white text-lg px-8 py-6"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Onthul mijn lezing
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "generating" && (
              <motion.div key="generating" className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
                <p className="text-stone-400">De kosmos wordt geraadpleegd...</p>
              </motion.div>
            )}

            {step === "reading" && (
              <motion.div
                key="reading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl"
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
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}