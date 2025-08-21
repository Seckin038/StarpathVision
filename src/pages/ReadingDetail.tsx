import React, { useEffect, useState, useMemo, useRef } from "react";
import MysticalBackground from "@/components/MysticalBackground";
import { supabase } from "@/lib/supabaseClient";
import { useParams, Link } from "react-router-dom";
import TarotInterpretationPanel from "@/components/TarotInterpretationPanel";
import { InterpretationData } from "@/hooks/useTarotInterpretation";
import TarotSpreadBoard, { SpreadName } from "@/components/TarotSpreadBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Loader2, FileText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("readings").select("*").eq("id", id).single();
      setR(data ?? null);
      setLoading(false);
    })();
  }, [id]);

  const downloadPDF = async () => {
    const element = printRef.current;
    if (!element || !r) return;

    setIsDownloading(true);

    const canvas = await html2canvas(element, {
      backgroundColor: "#0a090c",
      scale: 2,
      useCORS: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    const scaledCanvasHeight = pdfWidth / ratio;

    let position = 0;
    let heightLeft = scaledCanvasHeight;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledCanvasHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledCanvasHeight);
      heightLeft -= pdfHeight;
    }
    
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
        <div ref={printRef} className="space-y-6">
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
                  positionTitle: r.payload?.cards?.[i]?.position_title || "—",
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