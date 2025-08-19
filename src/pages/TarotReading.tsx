import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Sparkles, 
  User, 
  RotateCcw, 
  Share2, 
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

// Mock tarot deck data
const tarotDeck = [
  { id: 1, name: "De Waag", meaning: "Evenwicht, keuzes, rechtvaardigheid", image: "/placeholder.svg" },
  { id: 2, name: "De Gek", meaning: "Nieuwe beginnens, onschuld, avontuur", image: "/placeholder.svg" },
  { id: 3, name: "De Hoge Priesteres", meaning: "Intuïtie, mysterie, innerlijke wijsheid", image: "/placeholder.svg" },
  { id: 4, name: "De Keizer", meaning: "Autoriteit, structuur, vaderschap", image: "/placeholder.svg" },
  { id: 5, name: "De Ster", meaning: "Hoop, inspiratie, gids", image: "/placeholder.svg" },
  { id: 6, name: "De Dood", meaning: "Transformatie, einde, vernieuwing", image: "/placeholder.svg" },
  { id: 7, name: "Liefde", meaning: "Relaties, verbinding, harmonie", image: "/placeholder.svg" }
];

const TarotReading = () => {
  const { spread } = useParams();
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Set spread type based on route
  const spreadType = spread || "daily";
  const spreadName = spreadType === "daily" ? "Kaart van de Dag" : 
                    spreadType === "three" ? "Verleden-Heden-Toekomst" : 
                    spreadType === "celtic" ? "Keltische Kruis" : "Jaarkaart";

  // Initialize cards based on spread
  useEffect(() => {
    const cardCount = spreadType === "daily" ? 1 : 
                     spreadType === "three" ? 3 : 
                     spreadType === "celtic" ? 6 : 1;
    
    const initialCards = Array(cardCount).fill(null).map((_, index) => ({
      id: index,
      card: null,
      position: spreadType === "three" ? 
        (index === 0 ? "Verleden" : index === 1 ? "Heden" : "Toekomst") : 
        spreadType === "celtic" ? 
        (index === 0 ? "Aanwezige situatie" : 
         index === 1 ? "Uitdaging" : 
         index === 2 ? "Distantie" : 
         index === 3 ? "Verleden" : 
         index === 4 ? "Mogelijke toekomst" : 
         "Huidige houding") : 
        "Dagkaart"
    }));
    
    setSelectedCards(initialCards);
  }, [spreadType]);

  const drawCards = () => {
    setIsFlipping(true);
    
    // Simulate card drawing with delay
    setTimeout(() => {
      const drawnCards = selectedCards.map((cardSlot, index) => {
        // Randomly select a card from the deck
        const randomCard = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
        return {
          ...cardSlot,
          card: randomCard
        };
      });
      
      setSelectedCards(drawnCards);
      setIsFlipping(false);
    }, 1500);
  };

  const generateReading = () => {
    if (selectedCards.some(card => !card.card)) return;
    
    // In a real app, this would call an AI service
    const interpretations = selectedCards.map(cardSlot => 
      `${cardSlot.position}: ${cardSlot.card.name} - ${cardSlot.card.meaning}`
    );
    
    setReadingResult(`Je ${spreadName} lezing:
    
${interpretations.join("\n\n")}

Interpretatie: Deze kaarten wijzen op een periode van verandering en nieuwe inzichten. Vertrouw op je intuïtie en wees open voor onverwachte ontmoetingen. De energie van vandaag ondersteunt je bij belangrijke beslissingen.`);
  };

  const nextCard = () => {
    if (currentCardIndex < selectedCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-amber-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50">
              <ChevronLeft className="h-4 w-4" />
              Terug naar dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-purple-900">{spreadName}</h1>
          <div className="w-32"></div> {/* Spacer for alignment */}
        </div>

        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-purple-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {spreadName}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCards.length > 0 && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-purple-900">
                      {selectedCards[currentCardIndex].position}
                    </h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-purple-700 text-sm">
                        {currentCardIndex + 1} / {selectedCards.length}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={nextCard}
                        disabled={currentCardIndex === selectedCards.length - 1}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    {selectedCards[currentCardIndex].card ? (
                      <div className="relative">
                        <div className="bg-purple-100 border-2 border-purple-300 rounded-lg w-48 h-72 flex flex-col items-center justify-center p-4 shadow-lg">
                          <BookOpen className="h-12 w-12 text-purple-600 mb-3" />
                          <h3 className="font-bold text-center text-purple-900">
                            {selectedCards[currentCardIndex].card.name}
                          </h3>
                          <p className="text-sm text-center text-purple-700 mt-2">
                            {selectedCards[currentCardIndex].card.meaning}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`bg-purple-200 border-2 border-dashed border-purple-400 rounded-lg w-48 h-72 flex items-center justify-center cursor-pointer transition-all ${
                          isFlipping ? "animate-pulse" : "hover:bg-purple-300"
                        }`}
                        onClick={drawCards}
                      >
                        {isFlipping ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto mb-2"></div>
                            <p className="text-purple-700">Kaarten aan het schudden...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <BookOpen className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                            <p className="text-purple-700">Klik om kaart te trekken</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-center gap-3 mb-6">
                  {selectedCards.map((cardSlot, index) => (
                    <div 
                      key={index} 
                      className={`w-16 h-24 rounded border-2 cursor-pointer ${
                        index === currentCardIndex 
                          ? "border-purple-500 bg-purple-100" 
                          : "border-purple-200 bg-purple-50"
                      }`}
                      onClick={() => setCurrentCardIndex(index)}
                    >
                      {cardSlot.card ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-purple-600" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-100">
                          <div className="bg-purple-200 border border-purple-300 rounded w-8 h-10"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-3">
                  <Button 
                    onClick={drawCards}
                    disabled={isFlipping}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {selectedCards[0].card ? "Opnieuw trekken" : "Kaarten trekken"}
                  </Button>
                  
                  {selectedCards.every(card => card.card) && (
                    <Button 
                      onClick={generateReading}
                      className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Lezing genereren
                    </Button>
                  )}
                </div>

                {readingResult && (
                  <Card className="mt-6 bg-purple-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-purple-900 mb-2">Je lezing:</h3>
                          <p className="text-purple-800 whitespace-pre-line">{readingResult}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                          <Share2 className="h-4 w-4 mr-2" />
                          Delen
                        </Button>
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