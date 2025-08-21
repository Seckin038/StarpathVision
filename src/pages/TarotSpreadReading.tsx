import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, AlertTriangle, Sparkles, Users } from "lucide-react";
import TarotSpreadBoard, { SpreadName } from "@/components/TarotSpreadBoard";
import TarotGridDisplay from "@/components/TarotGridDisplay";
import { useTranslation } from "react-i18next";
import { Spread, DrawnCard, TarotCardData, Locale, SpreadPosition } from "@/types/tarot"; // Added SpreadPosition
import { useTarotInterpretation } from "@/hooks/useTarotInterpretation";
import TarotInterpretationPanel from "@/components/TarotInterpretationPanel";
import { usePersona } from "@/contexts/PersonaContext";
import { PersonaPicker } from "@/components/PersonaPicker";
import { PersonaBadge } from "@/components/PersonaBadge";
import { Card, CardContent } from "@/components/ui/card";
import { useTarotDeck } from "@/hooks/useTarotDeck";

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
  const params = useParams<Record<string, string>>();
  const spreadId =
    params.spread       // /readings/tarot/spread/:spread
    ?? params.id        // /readings/tarot/spread/:id
    ?? params.spreadId  // /readings/tarot/spread/:spreadId
    ?? null;

  const { i18n, t } = useTranslation();
  const locale = i18n.language as Locale;
  const { personaId } = usePersona();
  const { deck, loading: deckLoading } = useTarotDeck(locale);

  const [phase, setPhase] = useState<Phase>('loading');
  const [spread, setSpread] = useState<Spread | null>(null);
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
        const libraryResponse = await fetch('/config/tarot/spread-library.json');
        if (!libraryResponse.ok) throw new Error(`Kon leggingen niet laden: ${libraryResponse.statusText}`);
        const library = await libraryResponse.json();
        
        const currentSpread = library.spreads.find((s: Spread) => s.id === spreadId)
          ?? { id: "ppf-3", cards_required: 3, allow_reversals: true,
               name: { nl: "Verleden-Heden-Toekomst", en: "Past-Present-Future", tr: "Geçmiş-Şimdi-Gelecek" },
               ui_copy: { nl: { subtitle: "Kies 3 kaarten." }, en: { subtitle: "Pick 3 cards." }, tr: { subtitle: "3 kart seçin." } },
               positions: [
                 { slot_key: "past", idx: 1, x: 0.25, y: 0.5, rot: 0, title: {nl:"Verleden",en:"Past",tr:"Geçmiş"}, upright_copy: {nl:"Invloeden uit het verleden.",en:"Past influences.",tr:"Geçmişin etkileri."}, reversed_copy: {nl:"Verleden (omgekeerd).",en:"Past (reversed).",tr:"Geçmiş (ters)."} },
                 { slot_key: "present", idx: 2, x: 0.5, y: 0.5, rot: 0, title: {nl:"Heden",en:"Present",tr:"Şimdi"}, upright_copy: {nl:"Huidige situatie.",en:"Current situation.",tr:"Mevcut durum."}, reversed_copy: {nl:"Heden (omgekeerd).",en:"Present (reversed).",tr:"Şimdi (ters)."} },
                 { slot_key: "future", idx: 3, x: 0.75, y: 0.5, rot: 0, title: {nl:"Toekomst",en:"Future",tr:"Gelecek"}, upright_copy: {nl:"Waarschijnlijke uitkomst.",en:"Likely outcome.",tr:"Muhtemel sonuç."}, reversed_copy: {nl:"Toekomst (omgekeerd).",en:"Future (reversed).",tr:"Gelecek (ters)."} },
               ],
             };

        setSpread(currentSpread);
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

    // Maak een 78-kaarten “pool” op basis van je deck
    const pool = deck.length === 78 ? deck : Array.from({ length: 78 }, (_, i) => deck[i % deck.length]); // veilige fallback

    const selectedCards = selectedIndices.map(i => pool[i]);

    const finalDraw: DrawnCard[] = spread.positions.map((position, index) => ({ // Explicitly type finalDraw
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

  const annotations =
    phase === "reading" && spread
      ? draw.map((d, i) => {
          const pos: SpreadPosition = spread.positions[i]; // Explicitly type pos
          const title =
            (pos.title && pos.title[locale]) ||
            pos.slot_key ||
            `#${i + 1}`;
          const label = d.isReversed ? t("tarot.reversed") : t("tarot.upright");
          const copy =
            (d.isReversed
              ? pos.reversed_copy?.[locale]
              : pos.upright_copy?.[locale]) || "";
          return { title, label, copy };
        })
      : [];

  const panelItems =
    phase === "reading" && spread
      ? draw.map((d, i) => {
          const pos: SpreadPosition = spread.positions[i]; // Explicitly type pos
          const title =
            (pos.title && pos.title[locale]) ||
            pos.slot_key ||
            `#${i + 1}`;
          const copy =
            (d.isReversed
              ? pos.reversed_copy?.[locale]
              : pos.upright_copy?.[locale]) || "";

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
      return (
        <div className="text-center py-12 flex justify-center items-center gap-2">
          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
          <p className="text-stone-400">Legging wordt geladen...</p>
        </div>
      );
    }

    if (phase === 'error' && error) {
      return (
        <div className="text-center py-12 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Er is iets misgegaan</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (phase === 'picking' && spread && deck.length > 0) {
      return (
        <div className="space-y-8">
          <div className="text-center text-stone-300">
            <p>Kies {spread.cards_required} kaarten uit de stapel.</p>
            <p className="text-sm text-stone-400">Geselecteerd: {selectedIndices.length} / {spread.cards_required}</p>
          </div>
          <TarotGridDisplay
            totalCards={deck.length}
            maxSelect={spread.cards_required}
            selected={selectedIndices}
            onChange={handleSelectionChange}
            renderCard={(idx, isSelected) => (
              <img
                src="/tarot/back.svg"
                alt="Tarot Card Back"
                className={`w-full h-full object-cover rounded-xl transition-transform duration-200 
                  bg-gradient-to-b from-purple-500/15 to-indigo-600/15 border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,.25)]
                  ${isSelected ? 'scale-105 ring-2 ring-amber-500' : ''}`}
              />
            )}
          />
          <div className="flex justify-center">
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedIndices.length !== spread.cards_required}
              className="bg-amber-800 hover:bg-amber-700 text-stone-100 flex items-center gap-2 px-6 py-3"
            >
              <Sparkles className="h-4 w-4" />
              Bevestig selectie
            </Button>
          </div>
        </div>
      );
    }

    if (phase === 'reading' && spread && draw.length > 0) {
      return (
        <div className="space-y-8">
          <TarotSpreadBoard
            selectedCards={draw.map(d => ({ id: d.card.id, name: d.card.name, imageUrl: d.card.imageUrl }))}
            spread={mapSpreadIdToSpreadName(spread.id)}
            mode="spread"
            annotations={annotations}
          />
          {(isLoadingInterpretation || interpretationError || !interpretation) ? (
            <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
              <CardContent className="pt-6 text-center">
                {isLoadingInterpretation && (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                    <p className="text-stone-400">Lezing wordt gegenereerd...</p>
                  </div>
                )}
                {interpretationError && (
                  <div className="text-red-400">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Fout bij genereren van lezing: {interpretationError}</p>
                  </div>
                )}
                {!isLoadingInterpretation && !interpretationError && !interpretation && (
                  <p className="text-stone-400">Geen interpretatie beschikbaar.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <TarotInterpretationPanel items={panelItems} data={interpretation} />
          )}
        </div>
      );
    }
    return null;
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
}