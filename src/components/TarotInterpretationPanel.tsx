import { InterpretationData } from '@/hooks/useTarotInterpretation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, ShieldCheck, Star } from 'lucide-react';

interface TarotInterpretationPanelProps {
  data: InterpretationData;
}

export default function TarotInterpretationPanel({ data }: TarotInterpretationPanelProps) {
  const { combinedInterpretation, cardInterpretations } = data;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 font-serif mt-8">
      {/* Combined Interpretation */}
      <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-200 flex items-center gap-3 text-2xl">
            <Sparkles className="h-6 w-6" />
            Jouw Lezing in het Kort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-amber-300 flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4" />
              Het Verhaal van je Kaarten
            </h3>
            <p className="text-stone-300 whitespace-pre-line">{combinedInterpretation.story}</p>
          </div>
          <div>
            <h3 className="font-semibold text-amber-300 flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4" />
              Advies voor Jouw Pad
            </h3>
            <p className="text-stone-300 whitespace-pre-line">{combinedInterpretation.advice}</p>
          </div>
          <div>
            <h3 className="font-semibold text-amber-300 flex items-center gap-2 mb-2">
              <Star className="h-4 w-4" />
              Affirmatie
            </h3>
            <p className="text-stone-200 italic text-lg text-center py-2 border-t border-b border-stone-700">
              "{combinedInterpretation.affirmation}"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Card Interpretations */}
      <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-200 flex items-center gap-3 text-2xl">
            <BookOpen className="h-6 w-6" />
            Betekenis per Kaart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {cardInterpretations.map((card, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-stone-200 hover:no-underline">
                  <div className="flex items-center gap-4 text-left">
                    <span className="text-amber-400 font-bold">{index + 1}.</span>
                    <div>
                      <h4 className="font-semibold">{card.cardName}</h4>
                      <p className="text-sm text-stone-400">{card.positionTitle}</p>
                    </div>
                    {!card.isReversed && <Badge variant="outline" className="border-red-800/50 text-red-300">Omgekeerd</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-stone-300">
                  <p className="italic">"{card.shortMeaning}"</p>
                  <p className="whitespace-pre-line">{card.longMeaning}</p>
                  <div className="flex flex-wrap gap-2">
                    {card.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}