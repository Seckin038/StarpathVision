import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, AlertTriangle } from "lucide-react";
import MysticalBackground from "@/components/MysticalBackground";
import TarotSpreadBoard from "@/components/TarotSpreadBoard";
import { useTranslation } from "react-i18next";

// Type definities (kunnen later naar een apart types-bestand)
type Locale = 'nl' | 'en' | 'tr';
type TarotCardData = { id: string; name: string; image: string; [key: string]: any };
type Spread = any; // Vereenvoudigd voor dit voorbeeld
type DrawnCard = { positionId: string; card: TarotCardData; isReversed: boolean };

export default function TarotReadingPage() {
  const { spread: spreadId } = useParams<{ spread: string }>();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;

  const [spread, setSpread] = useState<Spread | null>(null);
  const [draw, setDraw] = useState<DrawnCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeReading = async () => {
      if (!spreadId) {
        setError("Geen legging gespecificeerd.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. Laad alle spreads
        const [bundle, starpath, cardsData] = await Promise.all([
          fetch('/config/tarot/tarot.spreads.bundle.json').then(r => r.json()),
          fetch('/config/tarot/tarot.spreads.starpath.json').then(r => r.json()),
          fetch(`/tarot/cards.${locale}.json`).then(r => r.json())
        ]);
        
        const allSpreads = [...bundle.spreads, ...starpath.spreads];
        const currentSpread = allSpreads.find(s => s.id === spreadId);

        if (!currentSpread) {
          throw new Error(`Legging '${spreadId}' niet gevonden.`);
        }
        setSpread(currentSpread);

        // 2. Schud de kaarten en trek het benodigde aantal
        const shuffledDeck = [...cardsData].sort(() => 0.5 - Math.random());
        const drawnCardsRaw = shuffledDeck.slice(0, currentSpread.drawCount);

        // 3. Koppel de getrokken kaarten aan de posities van de spread
        const finalDraw = currentSpread.positions.map((position: any, index: number) => ({
          positionId: position.id,
          card: drawnCardsRaw[index],
          isReversed: Math.random() < 0.3, // 30% kans op een omgekeerde kaart
        }));

        setDraw(finalDraw);

      } catch (err: any) {
        console.error("Fout bij initialiseren van de lezing:", err);
        setError(err.message || "Kon de tarot-lezing niet laden.");
      } finally {
        setLoading(false);
      }
    };

    initializeReading();
  }, [spreadId, locale]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-stone-400">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
          <p>De kaarten worden geschud...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-8">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Er is iets misgegaan</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (spread && draw.length > 0) {
      return <TarotSpreadBoard spread={spread} draw={draw} locale={locale} />;
    }

    return null;
  };

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles+sigils" intensity="low" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" /> Terug
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif tracking-wide text-amber-200 text-center">
              {spread ? spread.name[locale] : "Tarot Lezing"}
            </h1>
            <p className="text-stone-400 text-center">
              {spread ? spread.description[locale] : "Klik op de kaarten om ze om te draaien."}
            </p>
          </div>
          <div className="w-24"></div>
        </header>

        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}