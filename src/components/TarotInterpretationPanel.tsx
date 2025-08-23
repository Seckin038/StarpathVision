import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Heart, Quote, CheckSquare } from "lucide-react";
import { InterpretationData } from "@/hooks/useTarotInterpretation";

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

  return (
    <section className="space-y-8">
      {/* Display the structured summary */}
      {data && (
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200 text-2xl flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              {t('tarot.summaryTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.story && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-amber-100 mb-2"><Sparkles className="h-5 w-5" /> {t('tarot.storyTitle')}</h3>
                <p className="text-stone-300 whitespace-pre-line">{data.story}</p>
              </div>
            )}
            {data.advice && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-amber-100 mb-2"><Heart className="h-5 w-5" /> {t('tarot.adviceTitle')}</h3>
                <p className="text-stone-300 whitespace-pre-line">{data.advice}</p>
              </div>
            )}
            {data.affirmation && (
              <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-4">
                <h3 className="flex items-center gap-2 font-semibold text-amber-100 mb-2"><Quote className="h-5 w-5" /> {t('tarot.affirmationTitle')}</h3>
                <p className="text-stone-300 italic">"{data.affirmation}"</p>
              </div>
            )}
            {data.actions && data.actions.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-amber-100 mb-2"><CheckSquare className="h-5 w-5" /> {t('tarot.actionsTitle')}</h3>
                <ul className="list-disc list-inside text-stone-300 space-y-1">
                  {data.actions.map((action, i) => <li key={i}>{action}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Per kaart details with interpretation */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-amber-200 text-center">{t('tarot.detailsTitle')}</h2>
        {items.map((item) => {
          const cardInterpretation = data?.card_interpretations?.find(ci => ci.card_index === item.index);
          return (
            <Card key={item.index} className="bg-stone-950/60 border border-white/10 backdrop-blur-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={item.imageUrl || '/tarot/back.svg'}
                    alt={item.name}
                    className="w-24 h-auto rounded-md border border-white/10 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-amber-200">{item.index}. {item.name}</h4>
                    <Badge
                      variant="outline"
                      className={cn("mt-1", item.upright ? "border-emerald-700 text-emerald-300" : "border-rose-700 text-rose-300")}
                    >
                      {item.upright ? t("tarot.upright") : t("tarot.reversed")}
                    </Badge>
                    <div className="mt-3 text-sm">
                      <p className="font-semibold text-stone-300">{item.positionTitle}</p>
                      <p className="text-stone-400">{item.positionCopy}</p>
                    </div>
                  </div>
                </div>
                {cardInterpretation && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-stone-300 whitespace-pre-line">{cardInterpretation.interpretation}</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}