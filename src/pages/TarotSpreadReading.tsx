import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import TarotSpreadBoard from "@/components/TarotSpreadBoard";
import { SpreadKind, positionsFor, normalizePositions } from "@/lib/positions";
import type { Position } from "@/lib/positions";
import TarotGridDisplay from "@/components/TarotGridDisplay";
import { useTranslation } from "react-i18next";
import { Spread, DrawnCard, Locale, SpreadPosition } from "@/types/tarot";
import { useTarotInterpretation, TarotInterpretationPayload } from "@/hooks/useTarotInterpretation";
import TarotInterpretationPanel from "@/components/TarotInterpretationPanel";
import { usePersona } from "@/contexts/PersonaContext";
import { PersonaPicker } from "@/components/PersonaPicker";
import { PersonaBadge } from "@/components/PersonaBadge";
import { Card, CardContent } from "@/components/ui/card";
import { useTarotDeck } from "@/hooks/useTarotDeck";

type Phase = 'loading' | 'error' | 'picking' | 'reading';

function mapSpreadIdToKind(id: string): SpreadKind {
  const kindMap: Record<string, SpreadKind> = {
    "daily-1": "daily-1",
    "two-choice-2": "two-choice-2",
    "ppf-3": "ppf-3",
    "line-3": "line-3",
    "star-6": "star-6",
    "horseshoe-7": "horseshoe-7",
    "celtic-cross-10": "cross-10",
    "year-12": "year-12",
  };
  return kindMap[id] || 'custom';
}

export default function TarotReadingPage() {
  const params = useParams<Record<string, string>>();
  const spreadId = params.spread ?? "ppf-3";

  const { i18n, t } = useTranslation();
  const locale = i18n.language as Locale;
  const { personaId } = usePersona();
  const { deck, loading: deckLoading, error: deckError } = useTarotDeck(locale);

  const [phase, setPhase] = useState<Phase>('loading');
  const [spread, setSpread] = useState<Spread | null>(null);
  const [draw, setDraw] = useState<DrawnCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const [cardsFlipped, setCardsFlipped] = useState(false);
  const [overridePositions, setOverridePositions] = useState<Position[] | null>(null);

  const { data: interpretation, isLoading: isLoadingInterpretation, error: interpretationError, getInterpretation } = useTarotInterpretation();

  useEffect(() => { setOverridePositions(null); }, [spreadId]);

  useEffect(() => {
    const initializeReading = async () => {
      try {
        setPhase('loading');
        setError(null);
        const libraryResponse = await fetch('/config/tarot/spread-library.json');
        if (!libraryResponse.ok) throw new Error(`Kon leggingen niet laden: ${libraryResponse.statusText}`);
        const library = await libraryResponse.json();
        
        const currentSpread = library.spreads.find((s: Spread) => s.id === spreadId);
        if (!currentSpread) throw new Error(`Legging '${spreadId}' niet gevonden.`);

        // Force-correct the number of cards for known spreads to override faulty config
        if (spreadId === 'ppf-3') {
          currentSpread.cards_required = 3;
        } else if (spreadId === 'star-6') {
          currentSpread.cards_required = 6;
        }

        setSpread(currentSpread);
        setPhase('picking');
      } catch (err: any) {
        setError(err.message || "Kon de tarot-lezing niet laden.");
        setPhase('error');
      }
    };
    initializeReading();
  }, [spreadId]);

  const handleConfirmSelection = () => {
    if (!spread || selectedIndices.length !== spread.cards_required || deck.length === 0) return;

    const selectedCards = selectedIndices.map(i => deck[i % deck.length]);

    if (selectedCards.some(c => c === undefined)) {
      setError("Fout bij het selecteren van kaarten. Probeer het opnieuw.");
      setPhase('error');
      return;
    }

    const hasValidPositions =
      Array.isArray(spread.positions) && spread.positions.length >= spread.cards_required;

    const positionsToUse = hasValidPositions
      ? spread.positions
      : positionsFor(mapSpreadIdToKind(spread.id), spread.cards_required).map((p, i) => ({
          slot_key: p.label || `pos_${i + 1}`,
          idx: i + 1,
          x: p.x, y: p.y, rot: p.r || 0,
          title: { nl: `Positie ${i + 1}`, en: `Position ${i + 1}`, tr: `Pozisyon ${i + 1}` },
          upright_copy: { nl: "", en: "", tr: "" },
          reversed_copy: { nl: "", en: "", tr: "" },
        }));

    if (!hasValidPositions) {
      setOverridePositions(
        normalizePositions(positionsToUse.map(p => ({ x: p.x, y: p.y, rot: p.rot, slot_key: p.slot_key })))
      );
      setSpread(prev => prev ? { ...prev, positions: positionsToUse } : null);
    }

    const finalDraw: DrawnCard[] = positionsToUse.slice(0, spread.cards_required).map((position, index) => ({
      positionId: position.slot_key,
      card: selectedCards[index],
      isReversed: spread.allow_reversals ? Math.random() < 0.3 : false,
    }));
    
    setDraw(finalDraw);
    setPhase('reading');
  };

  const handleGetInterpretation = useCallback(() => {
    if (!spread || draw.length === 0) return;
    
    const payload: TarotInterpretationPayload = {
      locale,
      personaId,
      spread: { id: spread.id, name: spread.name?.[locale] ?? spread.id },
      spreadGuide: spread.ui_copy?.[locale]?.subtitle ?? '',
      cards: draw.map((c, i) => {
        const position = spread.positions[i];
        return {
          index: i + 1,
          name: c.card.name,
          upright: !c.isReversed,
          position_key: position.slot_key,
          position_title: position.title?.[locale] ?? position.slot_key,
        };
      }),
    };
    getInterpretation(payload);
  }, [draw, spread, locale, personaId, getInterpretation]);

  // Effect to fetch interpretation only once when entering the reading phase
  useEffect(() => {
    if (phase === 'reading' && draw.length > 0 && !interpretation && !isLoadingInterpretation) {
      handleGetInterpretation();
      if (!cardsFlipped) {
        setTimeout(() => setCardsFlipped(true), 300);
      }
    }
  }, [phase, draw, interpretation, isLoadingInterpretation, handleGetInterpretation, cardsFlipped]);

  const handlePersonaPicked = () => {
    setShowPersonaPicker(false);
  };

  const annotations =
    phase === "reading" && spread
      ? draw.map((d, i) => {
          const pos: SpreadPosition = spread.positions[i];
          const title = (pos.title?.[locale]) || pos.slot_key || `#${i + 1}`;
          const label = d.isReversed ? t("tarot.reversed") : t("tarot.upright");
          return { title, label };
        })
      : [];

  const panelItems =
    phase === "reading" && spread
      ? draw.map((d, i) => {
          const pos: SpreadPosition = spread.positions[i];
          const title = (pos.title?.[locale]) || pos.slot_key || `#${i + 1}`;
          const copy = (d.isReversed ? pos.reversed_copy?.[locale] : pos.upright_copy?.[locale]) || "";
          return {
            index: i + 1,
            name: d.card.name,
            imageUrl: d.card.imageUrl,
            upright: !d.isReversed,
            positionTitle: title,
            positionCopy: copy,
          };
        })
      : [];

  const renderContent = () => {
    if (phase === 'loading' || deckLoading) {
      return <div className="text-center py-12"><Loader2 className="h-8 w-8 text-amber-600 animate-spin" /></div>;
    }

    if (phase === 'error' || deckError) {
      return <div className="text-center py-12 text-red-400"><AlertTriangle className="h-12 w-12 mx-auto mb-4" /><p>{error || (deckError as Error)?.message}</p></div>;
    }

    if (phase === 'picking' && spread) {
      return (
        <div className="space-y-8">
          <div className="text-center text-stone-300">
            <div className="flex justify-center items-center gap-4 mb-2">
              <p>Kies je waarzegger:</p>
              <PersonaBadge onClick={() => setShowPersonaPicker(true)} />
            </div>
            <p>Kies {spread.cards_required} kaarten.</p>
            <p className="text-sm text-stone-400">Geselecteerd: {selectedIndices.length} / {spread.cards_required}</p>
          </div>
          <TarotGridDisplay
            totalCards={78}
            maxSelect={spread.cards_required}
            selected={selectedIndices}
            onChange={setSelectedIndices}
            renderCard={(_index, isSelected) => (
              <div className={`w-full h-full rounded-md sm:rounded-lg overflow-hidden transition-all duration-200 relative group ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-stone-950' : ''}`}>
                <img src="/tarot/back.svg" alt="Tarot card back" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            )}
          />
          <div className="flex justify-center">
            <Button 
              onClick={handleConfirmSelection} 
              disabled={selectedIndices.length !== spread.cards_required || deckLoading} 
              className="bg-amber-800 hover:bg-amber-700 text-stone-100 px-6 py-3"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Bevestig selectie
            </Button>
          </div>
        </div>
      );
    }

    if (phase === 'reading' && spread && draw.length > 0) {
      const spreadKind = mapSpreadIdToKind(spread.id);
      
      const customPositions =
        overridePositions ??
        (spread.positions?.length
          ? normalizePositions(
              spread.positions.map(p => ({ x: p.x, y: p.y, rot: p.rot, slot_key: p.slot_key }))
            )
          : undefined);

      return (
        <div className="space-y-8">
          <TarotSpreadBoard
            cards={draw.map(d => ({ id: d.card.id, name: d.card.name, imageUrl: d.card.imageUrl }))}
            kind={spreadKind}
            customPositions={customPositions}
            annotations={annotations}
            cardsFlipped={cardsFlipped}
          />
          {isLoadingInterpretation && (
            <Card className="bg-stone-900/50"><CardContent className="pt-6 text-center"><Loader2 className="h-8 w-8 text-amber-600 animate-spin" /></CardContent></Card>
          )}
          {interpretationError && (
            <Card className="bg-red-900/20 border-red-800 text-red-300">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Fout bij genereren van lezing: {interpretationError}</p>
                <Button onClick={handleGetInterpretation} variant="outline" className="mt-4"><RefreshCw className="h-4 w-4 mr-2" /> Probeer opnieuw</Button>
              </CardContent>
            </Card>
          )}
          {interpretation && <TarotInterpretationPanel items={panelItems} data={interpretation} />}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative min-h-screen p-4 font-serif">
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link to="/readings/tarot"><Button variant="outline" className="border-amber-800 text-amber-300"><ChevronLeft className="h-4 w-4" /> Terug</Button></Link>
          <div className="text-center">
            <h1 className="text-3xl font-serif tracking-wide text-amber-200">{spread ? (spread.name?.[locale] ?? spread.id) : "Tarot Lezing"}</h1>
          </div>
          <div className="w-32 flex justify-end"></div>
        </header>
        {showPersonaPicker && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowPersonaPicker(false)}>
            <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-stone-950 p-6" onClick={e => e.stopPropagation()}>
              <PersonaPicker method="tarot" onPicked={handlePersonaPicked} />
            </div>
          </div>
        )}
        <main>{renderContent()}</main>
      </div>
    </div>
  );
}