import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, AlertTriangle } from "lucide-react";
import MysticalBackground from "@/components/MysticalBackground";
import TarotSpreadBoard from "@/components/TarotSpreadBoard";
import TarotGridDisplay from "@/components/TarotGridDisplay";
import { useTranslation } from "react-i18next";

// Type definitions
type Locale = 'nl' | 'en' | 'tr';
type TarotCardData = { id: string; name: string; image: string; [key: string]: any };
type Spread = any;
type DrawnCard = { positionId: string; card: TarotCardData; isReversed: boolean };
type Phase = 'loading' | 'error' | 'picking' | 'reading';

export default function TarotReadingPage() {
  const { spread: spreadId } = useParams<{ spread: string }>();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;

  const [phase, setPhase] = useState<Phase>('loading');
  const [spread, setSpread] = useState<Spread | null>(null);
  const [deck, setDeck] = useState<TarotCardData[]>([]);
  const [draw, setDraw] = useState<DrawnCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeReading = async () => {
      if (!spreadId) {
        setError("Geen legging gespecificeerd.");
        setPhase('error');
        return;
      }

      try {
        setPhase('loading');
        
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
        setDeck([...cardsData].sort(() => 0.5 - Math.random()));
        setPhase('picking');

      } catch (err: any) {
        console.error("Fout bij initialiseren van de lezing:", err);
        setError(err.message || "Kon de tarot-lezing niet laden.");
        setPhase('error');
      }
    };

    initializeReading();
  }, [spreadId, locale]);

  const handleSelectionComplete = (selectedCards: TarotCardData[]) => {
    if (!spread) return;

    const finalDraw = spread.positions.map((position: any, index: number) => ({
      positionId: position.id,
      card: selectedCards[index],
      isReversed: Math.random() < 0.3,
    }));

    setDraw(finalDraw);
    setPhase('reading');
  };

  const renderContent = () => {
    switch (phase) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-96 text-stone-400">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
            <p>De kaarten worden voorbereid...</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-96 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-8">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-bold mb-2">Er is iets misgegaan</h2>
            <p>{error}</p>
          </div>
        );
      case 'picking':
        if (!spread) return null;
        return (
          <TarotGridDisplay
            deck={deck}
            selectionLimit={spread.drawCount}
            onSelectionComplete={handleSelectionComplete}
          />
        );
      case 'reading':
        if (!spread || draw.length === 0) return null;
        return <TarotSpreadBoard spread={spread} draw={draw} locale={locale} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles+sigils" intensity="low" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link to="/readings/tarot">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" /> Terug
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif tracking-wide text-amber-200 text-center">
              {spread ? spread.name[locale] : "Tarot Lezing"}
            </h1>
            <p className="text-stone-400 text-center">
              {spread && phase === 'picking' ? `Kies ${spread.drawCount} kaarten voor je legging.` : (spread ? spread.description[locale] : "Klik op de kaarten om ze om te draaien.")}
            </p>
          </div>
          <div className="w-32"></div>
        </header>

        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}