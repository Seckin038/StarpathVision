import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, AlertTriangle, Sparkles, Users } from "lucide-react";
import TarotSpreadBoard, { SpreadName } from "@/components/TarotSpreadBoard";
import TarotGridDisplay from "@/components/TarotGridDisplay";
import { useTranslation } from "react-i18next";
import { Spread, DrawnCard, TarotCardData, Locale } from "@/types/tarot";
import { useTarotInterpretation } from "@/hooks/useTarotInterpretation";
import TarotInterpretationPanel from "@/components/TarotInterpretationPanel";
import { usePersona } from "@/contexts/PersonaContext";
import { PersonaPicker } from "@/components/PersonaPicker";
import { PersonaBadge } from "@/components/PersonaBadge";

type Phase = 'loading' | 'error' | 'picking' | 'reading';

function mapSpreadIdToSpreadName(id: string): SpreadName {
  if (id.includes('celtic-cross')) return 'CelticCross10';
  if (id.includes('cross-of-truth')) return 'Cross5';
  if (id.includes('star-6')) return 'Star7';
  if (id.includes('horseshoe-7')) return 'Horseshoe7';
  if (id.includes('year-ahead-12') || id.includes('astrological-12')) return 'YearAhead12';
  if (id.includes('nine-square')) return 'NineSquare';
  if (id.includes('ppf-3') || id.includes('mind-body-spirit-3') || id.includes('situation-action-outcome-3')) return 'Line3';
  if (id.includes('-1') || id.includes('-2') || id.includes('-3') || id.includes('-7')) return 'Line3';
  return 'Line3';
}

export default function TarotReadingPage() {
  const { spread: spreadId } = useParams<{ spread: string }>();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const { personaId } = usePersona();

  const [phase, setPhase] = useState<Phase>('loading');
  const [spread, setSpread] = useState<Spread | null>(null);
  const [deck, setDeck] = useState<TarotCardData[]>([]);
  const [draw, setDraw] = useState<DrawnCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

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
        if (!currentSpread) throw new Error(`Legging '${spreadId}' niet gevonden.`);
        setSpread(currentSpread);
        setDeck([...cardsData].sort(() => 0.5 - Math.random()));
        setPhase('picking');
      } catch (err: any) {
        setError(err.message || "Kon de tarot-lezing niet laden.");
        setPhase('error');
      }
    };
    initializeReading();
  }, [spreadId, locale]);

  const handleSelectionChange = (indices: number[]) => setSelectedIndices(indices);

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

  useEffect(() => {
    if (phase === 'reading' && draw.length > 0 && spread) {
      const payload = {
        locale,
        personaId,
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
    }
  }, [phase, draw, spread, locale, personaId, getInterpretation]);

  const renderContent = () => {
    // ... content rendering logic
  };

  return (
    <div className="relative min-h-screen p-4 font-serif">
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link to="/readings/tarot">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" /> Terug
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-serif tracking-wide text-amber-200">
              {spread ? spread.name[locale] : "Tarot Lezing"}
            </h1>
            <p className="text-stone-400">
              {spread && phase === 'picking' ? spread.ui_copy[locale].subtitle : (spread ? "Je lezing wordt onthuld." : "")}
            </p>
          </div>
          <div className="w-32 flex justify-end">
            <PersonaBadge onClick={() => setShowPersonaPicker(true)} />
          </div>
        </header>

        {showPersonaPicker && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-stone-950 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif text-amber-200">Kies je waarzegger</h3>
                <button onClick={() => setShowPersonaPicker(false)} className="text-stone-300 hover:text-amber-200">Sluiten</button>
              </div>
              <PersonaPicker method="tarot" onPicked={() => setShowPersonaPicker(false)} />
            </div>
          </div>
        )}

        <main>
          {/* ... renderContent() logic from previous version ... */}
        </main>
      </div>
    </div>
  );
}