import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

// The new data structure is much simpler
export interface InterpretationData {
  text: string;
}

// Type for the static card information
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
      {/* Display the full interpretation text */}
      {data?.text && (
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200 text-2xl flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              Jouw Lezing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-stone-300 whitespace-pre-line leading-relaxed">
              <MarkdownRenderer text={data.text} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per kaart details (statisch) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-amber-200 text-center">De Kaarten in Detail</h2>
        {items.map((item, i) => (
          <Card key={i} className="bg-stone-950/60 border border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="p-4">
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
                  <div className="mt-3 text-sm">
                    <p className="font-semibold text-stone-300">{item.positionTitle}</p>
                    <p className="text-stone-400">{item.positionCopy}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}