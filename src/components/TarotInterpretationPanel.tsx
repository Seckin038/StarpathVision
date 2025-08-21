import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Lightbulb, Heart, CheckCircle } from "lucide-react";

// Type voor de data die we van de AI-functie verwachten
export interface InterpretationData {
  combinedInterpretation: {
    story: string;
    advice: string;
    affirmation: string;
    actions: string[];
  };
  cardInterpretations: {
    cardName: string;
    positionTitle: string;
    isReversed: boolean;
    shortMeaning: string;
    longMeaning: string;
    keywords: string[];
  }[];
}

// Type voor de statische kaartinformatie
export type TarotPanelItem = {
  index: number;
  name: string;
  imageUrl?: string;
  upright: boolean;
  positionTitle: string;
  positionCopy?: string;
};

type Props = {
  items: TarotPanelItem[];
  data?: InterpretationData | null;
};

export default function TarotInterpretationPanel({ items, data }: Props) {
  const { t } = useTranslation();

  const combined = data?.combinedInterpretation;
  const cardInts = data?.cardInterpretations;

  return (
    <section className="space-y-8">
      {/* Algehele samenvatting */}
      {combined && (
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200 text-2xl flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              Jouw Lezing in het Kort
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-amber-300 mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4" />Het Verhaal van de Kaarten</h3>
              <p className="text-stone-300 whitespace-pre-line">{combined.story}</p>
            </div>
            <div>
              <h3 className="font-semibold text-amber-300 mb-2 flex items-center gap-2"><Heart className="h-4 w-4" />Advies voor Jou</h3>
              <p className="text-stone-300 whitespace-pre-line">{combined.advice}</p>
            </div>
            {combined.affirmation && (
              <div className="bg-stone-900 p-4 rounded-lg border border-stone-800">
                <h4 className="font-semibold text-amber-200 mb-2">Affirmatie</h4>
                <p className="text-stone-200 italic">"{combined.affirmation}"</p>
              </div>
            )}
            {combined.actions && combined.actions.length > 0 && (
               <div>
                <h3 className="font-semibold text-amber-300 mb-2 flex items-center gap-2"><CheckCircle className="h-4 w-4" />Concrete Acties</h3>
                <ul className="list-disc list-inside text-stone-300 space-y-1">
                  {combined.actions.map((action, i) => <li key={i}>{action}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Per kaart */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-amber-200 text-center">De Kaarten in Detail</h2>
        {items.map((item, i) => {
          const interpretation = cardInts?.[i];
          return (
            <Card key={i} className="bg-stone-950/60 border border-white/10 backdrop-blur-sm overflow-hidden">
              <div className="md:grid md:grid-cols-3">
                {/* Kaart info */}
                <div className="p-4 border-b md:border-b-0 md:border-r border-stone-800">
                  <div className="flex items-start gap-4">
                    <img
                      src={item.imageUrl || '/tarot/back.svg'}
                      alt={item.name}
                      className="w-16 h-auto rounded-md border border-white/10 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-amber-200">{item.index}. {item.name}</h4>
                      <Badge
                        variant="outline"
                        className={cn("mt-1", item.upright ? "border-emerald-700 text-emerald-300" : "border-rose-700 text-rose-300")}
                      >
                        {item.upright ? t("tarot.upright") : t("tarot.reversed")}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    <p className="font-semibold text-stone-300">{item.positionTitle}</p>
                    <p className="text-stone-400">{item.positionCopy}</p>
                  </div>
                </div>

                {/* AI Interpretatie */}
                <div className="p-4 md:col-span-2">
                  {interpretation ? (
                    <div className="space-y-3">
                      <p className="text-stone-300 whitespace-pre-line">{interpretation.longMeaning}</p>
                      {interpretation.keywords && interpretation.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {interpretation.keywords.map(kw => <Badge key={kw} variant="outline" className="text-stone-400 border-stone-700">{kw}</Badge>)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-stone-500">Geen gedetailleerde interpretatie beschikbaar.</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}