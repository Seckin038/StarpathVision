import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Sparkles, 
  RotateCcw, 
  Share2, 
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import tarotDeckData from "../data/tarot-cards.json";
import falyaPersona from "../data/falya.json";

const allCards = [
  ...tarotDeckData.majorArcana,
  ...tarotDeckData.minorArcana.staven,
  ...tarotDeckData.minorArcana.bekers,
  ...tarotDeckData.minorArcana.zwaarden,
  ...tarotDeckData.minorArcana.pentakels,
];

const TarotReading = () => {
  const { spread } = useParams();
  const { i18n } = useTranslation();
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const spreadType = spread || "daily";
  const spreadName = spreadType === "daily" ? "Kaart van de Dag" : 
                    spreadType === "three" ? "Verleden-Heden-Toekomst" : 
                    spreadType === "celtic" ? "Keltische Kruis" : "Jaarkaart";

  useEffect(() => {
    resetReading();
  }, [spreadType]);

  const resetReading = () => {
    const cardCount = spreadType === "daily" ? 1 : 
                     spreadType === "three" ? 3 : 
                     spreadType === "celtic" ? 10 : 1;
    
    const initialCards = Array(cardCount).fill(null).map((_, index) => ({
      id: index,
      card: null,
      position: spreadType === "three" ? 
        (index === 0 ? "Verleden" : index === 1 ? "Heden" : "Toekomst") : 
        spreadType === "celtic" ? 
        `Positie ${index + 1}` : 
        "Dagkaart"
    }));
    
    setSelectedCards(initialCards);
    setReadingResult(null);
    setCurrentCardIndex(0);
  };

  const drawCards = () => {
    setIsFlipping(true);
    setReadingResult(null);
    
    setTimeout(() => {
      const shuffledDeck = [...allCards].sort(() => 0.5 - Math.random());
      const drawnCards = selectedCards.map((cardSlot, index) => ({
        ...cardSlot,
        card: shuffledDeck[index]
      }));
      
      setSelectedCards(drawnCards);
      setIsFlipping(false);
    }, 1500);
  };

  const generateReading = async () => {
    if (selectedCards.some(c => !c.card) || isGenerating) return;

    setIsGenerating(true);
    const toastId = showLoading("Je lezing wordt voorbereid...");

    try {
      const persona = falyaPersona; // Default persona for now

      const { data, error } = await supabase.functions.invoke('generate-reading', {
        body: {
          readingType: "Tarot",
          language: i18n.language,
          persona: persona,
          cards: selectedCards,
        }
      });

      if (error) throw new Error(error.message);

      setReadingResult(data.reading);
      dismissToast(toastId);
      showSuccess("Je lezing is klaar!");

    } catch (err: any) {
      dismissToast(toastId);
      showError("Er ging iets mis bij het genereren van de lezing.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    if (currentCardIndex < selectedCards.length - 1) setCurrentCardIndex(currentCardIndex + 1);
  };

  const prevCard = () => {
    if (currentCardIndex > 0) setCurrentCardIndex(currentCardIndex - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-black to-stone-950 text-stone-200 p-4 font-serif">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" /> Terug
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-amber-200 tracking-wider">{spreadName}</h1>
          <div className="w-32"></div>
        </div>

        <Card className="mb-6 bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5" /> {spreadName}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Share2 className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Download className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCards.length > 0 && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-amber-200">{selectedCards[currentCardIndex].position}</h3>
                    {selectedCards.length > 1 && (
                      <div className="flex gap-2 items-center">
                        <Button variant="outline" size="sm" onClick={prevCard} disabled={currentCardIndex === 0} className="border-stone-700 text-stone-300 hover:bg-stone-800 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-stone-400 text-sm">{currentCardIndex + 1} / {selectedCards.length}</span>
                        <Button variant="outline" size="sm" onClick={nextCard} disabled={currentCardIndex === selectedCards.length - 1} className="border-stone-700 text-stone-300 hover:bg-stone-800 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    {selectedCards[currentCardIndex].card ? (
                      <Card className="bg-stone-950/50 border-2 border-stone-700 rounded-lg w-56 h-96 flex flex-col items-center justify-center p-4 shadow-lg shadow-amber-900/10">
                        <img src={selectedCards[currentCardIndex].card.image} alt={selectedCards[currentCardIndex].card.name} className="w-32 h-32 mb-4 opacity-50" />
                        <h3 className="font-bold text-center text-amber-200 text-xl tracking-wider">{selectedCards[currentCardIndex].card.name}</h3>
                      </Card>
                    ) : (
                      <div className={`bg-stone-900/50 border-2 border-dashed border-stone-600 rounded-lg w-56 h-96 flex items-center justify-center cursor-pointer transition-all ${isFlipping ? "animate-pulse" : "hover:bg-stone-800/50"}`} onClick={drawCards}>
                        {isFlipping ? (
                          <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-2"></div><p className="text-stone-400">Kaarten schudden...</p></div>
                        ) : (
                          <div className="text-center"><BookOpen className="h-12 w-12 text-amber-400 mx-auto mb-2" /><p className="text-stone-300">Klik om kaart te trekken</p></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6 bg-stone-800" />

                <div className="flex justify-center gap-3">
                  <Button onClick={resetReading} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" /> Opnieuw
                  </Button>
                  
                  {selectedCards.every(c => c.card) && (
                    <Button onClick={generateReading} disabled={isGenerating} className="bg-amber-800 hover:bg-amber-700 text-stone-100 flex items-center gap-2">
                      {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Sparkles className="h-4 w-4" />}
                      Lezing genereren
                    </Button>
                  )}
                </div>

                {readingResult && (
                  <Card className="mt-6 bg-stone-900 border-stone-800">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-amber-200 mb-2">Je lezing:</h3>
                          <p className="text-stone-300 whitespace-pre-line">{readingResult}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TarotReading;