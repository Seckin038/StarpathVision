import React, { useEffect, useState, useMemo } from "react";
import MysticalBackground from "@/components/MysticalBackground";
import { supabase } from "@/lib/supabaseClient";
import { useParams, Link } from "react-router-dom";
import TarotInterpretationPanel, { InterpretationData } from "@/components/TarotInterpretationPanel";
import TarotSpreadBoard, { SpreadName } from "@/components/TarotSpreadBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Loader2, FileText } from "lucide-react";
import jsPDF from "jspdf";

type Reading = {
  id: string;
  user_id: string;
  method: string;
  spread_id: string | null;
  title: string | null;
  created_at: string;
  payload: any;
  interpretation: InterpretationData;
};

function mapSpread(id?: string | null): SpreadName {
  if (!id) return "Line";
  if (id.includes("celtic-cross")) return "CelticCross10";
  if (id.includes("cross-of-truth") || id.includes("cross-5")) return "Cross5";
  if (id.includes("star")) return "Star7";
  if (id.includes("horseshoe")) return "Horseshoe7";
  if (id.includes("year") || id.includes("astrological")) return "YearAhead12";
  if (id.includes("nine")) return "NineSquare";
  if (id.includes("grand-tableau")) return "GrandTableau36";
  return "Line";
}

export default function ReadingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("readings").select("*").eq("id", id).single();
      setR(data ?? null);
      setLoading(false);
    })();
  }, [id]);

  const downloadPDF = async () => {
    if (!r || !r.interpretation) return;
    setIsDownloading(true);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let yPos = margin;

    // Helper to add text and handle page breaks
    const addText = (text: string | string[], x: number, y: number, options: any = {}) => {
      const lines = Array.isArray(text) ? text : pdf.splitTextToSize(text, contentW);
      const textHeight = lines.length * (options.fontSize || 10) * 0.35;
      if (y + textHeight > pageH - margin) {
        pdf.addPage();
        y = margin;
        addSectionTitle("Vervolg", y);
        y += 10;
      }
      pdf.text(lines, x, y, options);
      return y + textHeight;
    };
    
    const addSectionTitle = (title: string, y: number) => {
      pdf.setFontSize(14);
      pdf.setTextColor("#F59E0B"); // amber-500
      pdf.text(title, margin, y);
      pdf.setDrawColor("#374151"); // stone-700
      pdf.line(margin, y + 2, pageW - margin, y + 2);
      return y + 8;
    };

    // --- PAGE 1: MAIN INTERPRETATION ---
    pdf.setFontSize(22);
    pdf.setTextColor("#FDE68A"); // amber-200
    pdf.text(r.title || "Jouw Tarot Lezing", pageW / 2, yPos, { align: 'center' });
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setTextColor("#9CA3AF"); // stone-400
    pdf.text(new Date(r.created_at).toLocaleString('nl-NL'), pageW / 2, yPos, { align: 'center' });
    yPos += 15;

    const { combinedInterpretation: comb } = r.interpretation;
    pdf.setFontSize(10);
    pdf.setTextColor("#E5E7EB"); // stone-200

    if (comb.story) {
      yPos = addSectionTitle("Het Verhaal van de Kaarten", yPos);
      yPos = addText(comb.story, margin, yPos);
      yPos += 8;
    }
    if (comb.advice) {
      yPos = addSectionTitle("Advies voor Jou", yPos);
      yPos = addText(comb.advice, margin, yPos);
      yPos += 8;
    }
    if (comb.affirmation) {
      yPos = addSectionTitle("Affirmatie", yPos);
      pdf.setFont("helvetica", "italic");
      yPos = addText(`"${comb.affirmation}"`, margin, yPos);
      pdf.setFont("helvetica", "normal");
      yPos += 8;
    }
    if (comb.actions?.length > 0) {
      yPos = addSectionTitle("Concrete Acties", yPos);
      const actionsText = comb.actions.map(a => `• ${a}`).join('\n');
      yPos = addText(actionsText, margin, yPos);
    }

    // --- SUBSEQUENT PAGES: CARD DETAILS ---
    pdf.addPage();
    yPos = margin;
    yPos = addSectionTitle("De Kaarten in Detail", yPos);
    
    let cardsOnPage = 0;
    const CARDS_PER_PAGE = 7;

    r.interpretation.cardInterpretations.forEach((card, index) => {
      if (cardsOnPage >= CARDS_PER_PAGE) {
        pdf.addPage();
        yPos = margin;
        yPos = addSectionTitle("De Kaarten in Detail (vervolg)", yPos);
        cardsOnPage = 0;
      }

      const cardTitle = `${index + 1}. ${card.cardName} (${card.isReversed ? 'Omgekeerd' : 'Rechtop'})`;
      pdf.setFontSize(12);
      pdf.setTextColor("#FDE68A"); // amber-200
      yPos = addText(cardTitle, margin, yPos);
      yPos += 2;

      pdf.setFontSize(10);
      pdf.setTextColor("#D1D5DB"); // stone-300
      yPos = addText(card.positionTitle, margin, yPos);
      yPos += 4;

      pdf.setTextColor("#E5E7EB"); // stone-200
      yPos = addText(card.longMeaning, margin, yPos);
      yPos += 4;

      if (card.keywords?.length > 0) {
        pdf.setTextColor("#9CA3AF"); // stone-400
        yPos = addText(`Keywords: ${card.keywords.join(', ')}`, margin, yPos);
      }
      
      yPos += 8; // Spacing between cards
      cardsOnPage++;
    });

    pdf.save(`Starpathvision-Lezing-${r.id}.pdf`);
    setIsDownloading(false);
  };

  const cards = useMemo(() => {
    const d = r?.payload;
    if (!d) return [];
    const src = d.cards ?? d.selected ?? [];
    return src.map((c: any, idx: number) => ({
      id: c.id ?? `c-${idx}`,
      name: c.name ?? `Card ${idx + 1}`,
      imageUrl: c.imageUrl ?? (c.image ? `/tarot/${c.image}` : undefined),
      upright: c.upright ?? !c.isReversed,
    }));
  }, [r]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-7 w-7 animate-spin text-amber-500" /></div>;
  }
  if (!r) {
    return <div className="p-8 text-center text-red-400">Sessie niet gevonden.</div>;
  }

  return (
    <div className="relative min-h-screen">
      <MysticalBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/profile"><Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/40"><ChevronLeft className="h-4 w-4 mr-1" /> Terug naar profiel</Button></Link>
          <Button onClick={downloadPDF} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </div>
        <div className="space-y-6">
          <Card className="bg-stone-950/60 border-white/10">
            <CardHeader><CardTitle className="text-amber-200">{r.title ?? (r.method === "tarot" && r.spread_id ? `Tarot — ${r.spread_id}` : r.method)}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {r.method === "tarot" && cards.length > 0 ? (
                <TarotSpreadBoard
                  selectedCards={cards.map((c: any) => ({ id: c.id, name: c.name, imageUrl: c.imageUrl }))}
                  spread={mapSpread(r.spread_id)}
                  mode="spread"
                  cardsFlipped={true}
                />
              ) : <div className="text-stone-400">Visualisatie voor {r.method} is (nog) niet beschikbaar.</div>}
              <TarotInterpretationPanel
                items={cards.map((c: any, i: number) => ({
                  index: i + 1,
                  name: c.name,
                  imageUrl: c.imageUrl,
                  upright: !!c.upright,
                  positionTitle: r.interpretation?.cardInterpretations?.[i]?.positionTitle || "—",
                }))}
                data={r.interpretation}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}