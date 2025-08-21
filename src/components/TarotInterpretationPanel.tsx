import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TarotPanelItem = {
  index: number;
  name: string;
  imageUrl?: string;
  upright: boolean;
  positionTitle: string;   // bv. "Verleden / Huidig / Toekomst"
  positionCopy?: string;   // korte uitleg per positie (upright/reversed)
};

type Props = {
  /** Geëxtraheerde kaart/positie data uit de reading */
  items: TarotPanelItem[];
  /** AI interpretatie (vorm tolerant; we proberen de meest voorkomende keys) */
  data?: any;
};

function getAiForCard(data: any, i: number) {
  if (!data) return {};
  // Tolerante extractie voor veel voorkomende vormen
  // 1) { cards: [ { summary, details[] } ] }
  // 2) { per_card: [ { summary, details[] } ] }
  // 3) { items: [ ... ] }
  const fromArray =
    data.cards?.[i] ??
    data.per_card?.[i] ??
    data.items?.[i] ??
    data[i];

  if (!fromArray || typeof fromArray !== "object") return {};

  const title =
    fromArray.title ||
    fromArray.heading ||
    undefined;

  const summary =
    fromArray.summary ||
    fromArray.synopsis ||
    fromArray.text ||
    fromArray.description ||
    undefined;

  const bullets: string[] =
    fromArray.details ||
    fromArray.bullets ||
    fromArray.points ||
    [];

  return { title, summary, bullets };
}

export default function TarotInterpretationPanel({ items, data }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as "nl" | "en" | "tr";

  // Overkoepelende samenvatting (optioneel)
  const overallTitle =
    data?.overall_title ||
    data?.summary_title ||
    (locale === "nl" ? "Samenvatting" : locale === "tr" ? "Özet" : "Summary");

  const overallText =
    data?.overall ||
    data?.summary ||
    data?.synopsis ||
    "";

  return (
    <section className="space-y-6">
      {/* Overall summary (optioneel) */}
      {(overallText || overallTitle) && (
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200">{overallTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-stone-200">{overallText}</p>
          </CardContent>
        </Card>
      )}

      {/* Per kaart */}
      <div className="grid gap-4 md:gap-6">
        {items.map((it, i) => {
          const ai = getAiForCard(data, i);
          return (
            <Card
              key={i}
              className="bg-stone-950/60 border border-white/10 backdrop-blur-sm"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  {/* Kaartafbeelding */}
                  <div
                    className={cn(
                      "w-16 h-24 rounded-md overflow-hidden border border-white/10 shrink-0",
                      !it.imageUrl && "bg-gradient-to-b from-purple-500/15 to-indigo-600/15"
                    )}
                  >
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  {/* Titels + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-amber-200 truncate">
                        {it.index}. {it.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          "uppercase tracking-wide",
                          it.upright
                            ? "border-emerald-700 text-emerald-300"
                            : "border-rose-700 text-rose-300"
                        )}
                      >
                        {it.upright ? t("tarot.upright") : t("tarot.reversed")}
                      </Badge>
                    </div>
                    <div className="text-stone-400 text-sm">
                      <span className="font-medium text-stone-300">
                        {it.positionTitle}
                      </span>
                      {it.positionCopy ? (
                        <span className="opacity-80"> — {it.positionCopy}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* AI block (title/summary/bullets) */}
                {ai?.title ? (
                  <div className="text-amber-200 font-semibold mb-1">
                    {ai.title}
                  </div>
                ) : null}
                {ai?.summary ? (
                  <p className="text-stone-200">{ai.summary}</p>
                ) : null}
                {Array.isArray(ai?.bullets) && ai.bullets.length > 0 ? (
                  <ul className="mt-3 space-y-1 list-disc list-inside text-stone-300">
                    {ai.bullets.map((b: string, j: number) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}