import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import MysticalBackground from "@/components/MysticalBackground";
import { supabase } from "@/lib/supabaseClient";
import { useParams, Link, useLocation } from "react-router-dom";
import TarotInterpretationPanel from "@/components/TarotInterpretationPanel";
import { InterpretationData } from "@/hooks/useTarotInterpretation";
import TarotSpreadBoard from "@/components/TarotSpreadBoard";
import type { SpreadKind } from "@/lib/tarot/positions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Loader2, FileText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ReadingInputSummary from "@/components/ReadingInputSummary";
import ReadingPanel from "@/components/ReadingPanel";
import { useTranslation } from "react-i18next";

type Reading = {
  id: string;
  user_id: string;
  method: string;
  spread_id: string | null;
  title: string | null;
  created_at: string;
  payload: any;
  interpretation: InterpretationData & { reading?: string };
};

function mapSpreadIdToKind(id: string | null): SpreadKind {
  if (!id) return "custom";
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

export default function ReadingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t } = useTranslation();
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

  const downloadPDF = useCallback(async () => {
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
  }, [r]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('download') === 'pdf' && printRef.current && r && !isDownloading) {
      const download = async () => {
        // A small delay to ensure full render, especially images.
        await new Promise(resolve => setTimeout(resolve, 1500));
        await downloadPDF();
      };
      download();
    }
  }, [location.search, r, isDownloading, downloadPDF]);

  const cards = useMemo(() => {
    if (r?.method !== 'tarot') return [];
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
    return <div className="p-8 text-center text-red-400">{t('readingDetail.notFound')}</div>;
  }

  const isTarot = r.method === 'tarot';

  return (
    <div className="relative min-h-screen">
      <MysticalBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/profile"><Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/40"><ChevronLeft className="h-4 w-4 mr-1" /> {t('readingDetail.backToProfile')}</Button></Link>
          <Button onClick={downloadPDF} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            {t('readingDetail.downloadPdf')}
          </Button>
        </div>
        <div ref={printRef} className="space-y-6">
          <Card className="bg-stone-950/60 border-white/10">
            <CardHeader><CardTitle className="text-amber-200">{r.title ?? r.method}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {isTarot && cards.length > 0 ? (
                <TarotSpreadBoard
                  cards={cards}
                  kind={mapSpreadIdToKind(r.spread_id)}
                  cardsFlipped={true}
                />
              ) : (
                <ReadingInputSummary reading={r} />
              )}
              
              {r.interpretation.story ? (
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
              ) : r.interpretation.reading ? (
                <ReadingPanel title={t('readingDetail.title', { method: r.method })} body={r.interpretation.reading} />
              ) : (
                <p className="text-stone-400">{t('readingDetail.noInterpretation')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}