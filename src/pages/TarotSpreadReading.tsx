import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import TarotSpreadBoard from "@/components/TarotSpreadBoard";
import { SpreadKind, positionsFor } from "@/lib/positions";
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

const DEFAULT_COUNT: Record<SpreadKind, number> = {
  "daily-1": 1, "two-choice-2": 2, "ppf-3": 3, "line-3": 3,
  "cross-5": 5, "pentagram-5": 5, "star-6": 6, "horseshoe-7": 7,
  "chakra-7": 7, "planetary-7": 7, "week-7": 7, "cross-10": 10,
  "career-10": 10, "tree-of-life-10": 10, "year-12": 12, "romani-21": 21,
  "grand-tableau-36": 36, "full-deck-78": 78, "custom": 3,
};

function mapSpreadIdToKind(id: string): SpreadKind {
  const kindMap: Record<string, SpreadKind> = {
    "daily-1": "daily-1", "two-choice-2": "two-choice-2", "ppf-3": "ppf-3",
    "mind-body-spirit-3": "line-3", "sao-3": "line-3", "line-3": "line-3",
    "relationship-5": "cross-5", "cross-of-truth-5": "cross-5", "pentagram-5": "pentagram-5",
    "star-6": "star-6", "horseshoe-7": "horseshoe-7", "chakra-7": "chakra-7",
    "planetary-7": "planetary-7", "week-7": "week-7", "celtic-cross-10": "cross-10",
    "career-10": "career-10", "tree-of-life-10": "tree-of-life-10",
    "astrological-12": "year-12", "year-12": "year-12", "romani-21": "romani-21",
    "grand-tableau-36": "grand-tableau-36", "full-deck-78": "full-deck-78",
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
  const [readingLocale, setReadingLocale] = useState<string | null>(null);

  const { data: interpretation, isLoading: isLoadingInterpretation, error: interpretationError, getInterpretation, resetInterpretation } = useTarotInterpretation();

  // Reset reading if language changes, but keep card selection
  useEffect(() => {
    if (interpretation && readingLocale && i18n.language !== readingLocale) {
      resetInterpretation();
      setPhase('picking');
      setDraw([]);
      setCardsFlipped(false);
      // NOTE: We DO NOT reset selectedIndices here, to preserve user's choice.
    }
  }, [i18n.language, interpretation, readingLocale, resetInterpretation]);

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

        const kind = mapSpreadIdToKind(currentSpread.id);
        
        currentSpread.cards_required = DEFAULT_COUNT[kind] || 1;

        if (Array.isArray(currentSpread.positions) && currentSpread.positions.length > 0) {
          currentSpread.cards_required = Math.min(
            currentSpread.cards_required,
            currentSpread.positions.length
          );
        }

        setSpread(currentSpread);
        setPhase('picking');
      } catch (err: any) {
        setError(err.message || "Kon de tarot-lezing niet laden.");
        setPhase('error');
      }
    };
    initializeReading();
  }, [spreadId, locale]);

  const positionsToUse = useMemo(() => {
    if (!spread) return [];
    const hasValidPositionsInJson = Array.isArray(spread.positions) && spread.positions.length >= spread.cards_required;
    if (hasValidPositionsInJson) {
        return spread.positions;
    }
    // Fallback to generated positions
    return positionsFor(mapSpreadIdToKind(spread.id), spread.cards_required).map((p, i) => ({
        slot_key: p.label || `pos_${i + 1}`,
        idx: i + 1,
        x: p.x,
        y: p.y,
        rot: p.r || 0,
        title: { nl: `Positie ${i + 1}`, en: `Position ${i + 1}`, tr: `Pozisyon ${i + 1}` },
        upright_copy: { nl: "", en: "", tr: "" },
        reversed_copy: { nl: "", en: "", tr: "" },
    }));
  }, [spread]);

  const handleConfirmSelection = () => {
    if (!spread || selectedIndices.length !== spread.cards_required || deck.length === 0) return;

    const selectedCards = selectedIndices.map(i => deck[i % deck.length]);
    if (selectedCards.some(c => c === undefined)) {
      setError("Fout bij het selecteren van kaarten. Probeer het opnieuw.");
      setPhase('error');
      return;
    }

    const finalDraw: DrawnCard[] = selectedCards.map((card, index) => {
      const position = positionsToUse[index];
      return {
        positionId: position.slot_key,
        card: card,
        isReversed: spread.allow_reversals ? Math.random() < 0.3 : false,
      };
    });
    
    setDraw(finalDraw);
    setPhase('reading');
  };

  const handleGetInterpretation = useCallback(() => {
    if (!spread || draw.length === 0) return;
    
    setReadingLocale(locale);
    const payload: TarotInterpretationPayload = {
      locale,
      personaId,
      spread: { id: spread.id, name: spread.name?.[locale] ?? spread.id },
      spreadGuide: spread.ui_copy?.[locale]?.subtitle ?? '',
      cards: draw.map((c, i) => {
        const position = positionsToUse[i];
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
  }, [draw, spread, locale, personaId, getInterpretation, positionsToUse]);

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

  const getPositionTitle = (pos: SpreadPosition) => {
    const rawTitle = pos.title?.[locale] || pos.slot_key;
    const translationKey = `tarot.${rawTitle.toLowerCase()}`;
    return i18n.exists(translationKey) ? t(translationKey) : rawTitle;
  };

  const annotations =
    phase === "reading" && spread
      ? draw.map((d, i) => {
          const pos = positionsToUse[i];
          const title = getPositionTitle(pos);
          const label = d.isReversed ? t("tarot.reversed") : t("tarot.upright");
          return { title, label };
        })
      : [];

  const panelItems =
    phase === "reading" && spread
      ? draw.map((d, i) => {
          const pos = positionsToUse[i];
          const title = getPositionTitle(pos);
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
              <p>{t('tarotReading.chooseSeer')}</p>
              <PersonaBadge onClick={() => setShowPersonaPicker(true)} />
            </div>
            <p>{t('tarotReading.chooseCards', { count: spread.cards_required })}</p>
            <p className="text-sm text-stone-400">{t('tarotReading.selected', { selected: selectedIndices.length, total: spread.cards_required })}</p>
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
              <Sparkles className="h-4 w-4 mr-2" /> {t('common.confirmSelection')}
            </Button>
          </div>
        </div>
      );
    }

    if (phase === 'reading' && spread && draw.length > 0) {
      return (
        <div className="space-y-8">
          <TarotSpreadBoard
            cards={draw.map(d => ({ id: d.card.id, name: d.card.name, imageUrl: d.card.imageUrl }))}
            kind={mapSpreadIdToKind(spread.id)}
            customPositions={positionsToUse.map(p => ({ x: p.x, y: p.y, rot: p.rot, slot_key: p.slot_key }))}
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
          <Link to="/readings/tarot"><Button variant="outline" className="border-amber-800 text-amber-300"><ChevronLeft className="h-4 w-4" /> {t('common.back')}</Button></Link>
          <div className="text-center">
            <h1 className="text-3xl font-serif tracking-wide text-amber-200">{spread ? (spread.name?.[locale] ?? spread.id) : "Tarot Lezing"}</h1>
          </div>
          <div className="w-32 flex justify-end"></div>
        </header>
        {showPersonaPicker && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowPersonaPicker(false)}>
            <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-stone-950 p-6 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <PersonaPicker method="tarot" onPicked={handlePersonaPicked} />
            </div>
          </div>
        )}
        <main>{renderContent()}</main>
      </div>
    </div>
  );
}