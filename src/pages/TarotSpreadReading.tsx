import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import MysticalBackground from "@/components/MysticalBackground";
import TarotSpreadBoard, { SpreadName } from "@/components/TarotSpreadBoard";
import TarotGridDisplay from "@/components/TarotGridDisplay";
import { useTranslation } from "react-i18next";
import { Spread, DrawnCard, TarotCardData, Locale } from "@/types/tarot";
import { useTarotInterpretation } from "@/hooks/useTarotInterpretation";
import TarotInterpretationPanel from "@/components/TarotInterpretationPanel";

type Phase = 'loading' | 'error' | 'picking' | 'reading';

// Helper to map spread IDs from the library to the layout names in the new component
function mapSpreadIdToSpreadName(id: string): SpreadName {
  if (id.includes('celtic-cross')) return 'CelticCross10';
  if (id.includes('cross-of-truth')) return 'Cross5';
  if (id.includes('star-6')) return 'Star7';
  if (id.includes('horseshoe-7')) return 'Horseshoe7';
  if (id.includes('year-ahead-12') || id.includes('astrological-12')) return 'YearAhead12';
  if (id.includes('nine-square')) return 'NineSquare';
  if (id.includes('ppf-3') || id.includes('mind-body-spirit-3') || id.includes('situation-action-outcome-3')) return 'Line3';
  
  // Fallback for any other linear spreads
  if (id.includes('-1') || id.includes('-2') || id.includes('-3') || id.includes('-7')) return 'Line3';
  
  return 'Line3'; // Default fallback
}


export default function TarotReadingPage() {
  const { spread: spreadId } = useParams<{ spread: string }>();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;

  const [phase, setPhase] = useState<Phase>('loading');
  const [spread, setSpread] = useState<Spread | null>(null);
  const [deck, setDeck] = useState<TarotCardData[]>([]);
  const [draw, setDraw] = useState<DrawnCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const { data: interpretation, isLoading: isLoadingInterpretation, error: interpretationError, getInterpretation } = useTarotInterpretation();

  useEffect(() => {
    const initializeReading = async () => {
      if (!spreadId) {
        setError("Geen legging gespecificeerd.");
        setPhase('error');
        return;
      }

      try {
        setPhase('loading');
        
        const [libraryResponse, cardsResponse] = await Promise.all([
          fetch('/config/tarot/spread-library.json'),
          fetch(`/tarot/cards.${locale}.json`)
        ]);

        if (!libraryResponse.ok) throw new Error(`Kon leggingen niet laden: ${libraryResponse.statusText}`);
        if (!cardsResponse.ok) throw new Error(`Kon kaarten niet laden: ${cardsResponse.statusText}`);

        const library = await libraryResponse.json();
        const cardsData = await cardsResponse.json();
        
        const currentSpread = library.spreads.find((s: Spread) => s.id === spreadId);

        if (!currentSpread) {
          throw new Error(`Legging '${spreadId}' niet gevonden.`);
        }
        setSpread(currentSpread);

        let fullDeckData = [...cardsData];
        if (fullDeckData.length > 0 && fullDeckData.length < 78) {
            const originalCards = [...fullDeckData];
            while (fullDeckData.length < 78) {
                fullDeckData.push(...originalCards);
            }
            fullDeckData = fullDeckData.slice(0, 78);
        }

        setDeck(fullDeckData.sort(() => 0.5 - Math.random()));
        setPhase('picking');

      } catch (err: any) {
        console.error("Fout bij initialiseren van de lezing:", err);
        setError(err.message || "Kon de tarot-lezing niet laden.");
        setPhase('error');
      }
    };

    initializeReading();
  }, [spreadId, locale]);

  const handleSelectionChange = (indices: number[]) => {
    setSelectedIndices(indices);
  };

  const handleConfirmSelection = () => {
    if (!spread || selectedIndices.length !== spread.cards_required) return;

    const selectedCards = selectedIndices.map(i => deck[i]);

    const finalDraw = spread.positions.map((position, index) => ({
      positionId: position.slot_key,
      card: selectedCards[index],
      isReversed: spread.allow_reversals ? Math.random() < 0.3 : false,
    }));

    setDraw(finalDraw);
    setPhase('reading');
  };

  const handleInterpret = () => {
    if (!spread || draw.length === 0) return;

    const payload = {
      locale,
      spread: { id: spread.id, name: spread.name[locale] },
      spreadGuide: spread.ui_copy[locale]?.subtitle || '',
      cards: draw.map((c, i) => ({
        index: i + 1,
        name: c.card.name,
        upright: !c.isReversed,
        position_key: spread.positions[i].slot_key,
        position_title: spread.positions[i][locale],
      })),
    };
    getInterpretation(payload);
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
          <>
            <TarotGridDisplay
              totalCards={deck.length}
              maxSelect={spread.cards_required}
              selected={selectedIndices}
              onChange={handleSelectionChange}
            />
            <div className="mt-8 flex justify-center">
              <Button
                disabled={selectedIndices.length !== spread.cards_required}
                className="rounded-xl bg-amber-800/90 px-5 py-3 text-black disabled:opacity-40"
                onClick={handleConfirmSelection}
              >
                ✨ Onthul mijn lezing ( {selectedIndices.length}/{spread.cards_required} )
              </Button>
            </div>
          </>
        );
      case 'reading':
        if (!spread || draw.length === 0) return null;
        
        const spreadName = mapSpreadIdToSpreadName(spread.id);
        const selectedCardsForBoard = draw.map(d => ({
            id: d.card.id,
            name: d.card.name,
            imageUrl: d.card.image,
        }));

        return (
          <div className="flex flex-col items-center">
            <div className="h-[60vh] w-full">
              <TarotSpreadBoard
                deck={deck}
                selectedCards={selectedCardsForBoard}
                spread={spreadName}
                mode="spread"
              />
            </div>
            
            {!interpretation && !isLoadingInterpretation && (
              <Button
                onClick={handleInterpret}
                className="mt-8 bg-amber-700 hover:bg-amber-600 text-stone-100 text-lg px-6 py-6 flex items-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Onthul Interpretatie
              </Button>
            )}

            {isLoadingInterpretation && (
              <div className="mt-8 flex items-center gap-3 text-amber-300">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>De kaarten worden geduid...</span>
              </div>
            )}

            {interpretationError && (
              <div className="mt-8 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4">
                <p><strong>Fout:</strong> {interpretationError}</p>
              </div>
            )}

            {interpretation && <TarotInterpretationPanel data={interpretation} />}
          </div>
        );
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
              {spread && phase === 'picking' ? spread.ui_copy[locale].subtitle : (spread ? "Je lezing wordt onthuld." : "")}
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