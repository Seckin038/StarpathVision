import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Eye, 
  Sparkles, 
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import { usePersona } from "@/contexts/PersonaContext";
import ReadingPanel from "@/components/ReadingPanel";
import PersonaSelector from "@/components/PersonaSelector";

const DreamReading = () => {
  const { i18n, t } = useTranslation();
  const { personaId } = usePersona();
  const [dreamDescription, setDreamDescription] = useState("");
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [readingLocale, setReadingLocale] = useState<string | null>(null);

  // Reset reading if language changes
  useEffect(() => {
    if (readingResult && readingLocale && i18n.language !== readingLocale) {
      setReadingResult(null);
      setReadingLocale(null);
    }
  }, [i18n.language, readingResult, readingLocale]);

  const generateReading = async () => {
    if (!dreamDescription || isGenerating) return;
    
    setIsGenerating(true);
    const toastId = showLoading("Je droom wordt geduid...");
    setReadingLocale(i18n.language); // Set locale at time of generation

    try {
      const { data, error } = await supabase.functions.invoke('generate-reading', {
        body: {
          locale: i18n.language,
          personaId: personaId,
          method: 'dromen',
          payload: {
            userQuestion: dreamDescription,
          }
        }
      });

      if (error) {
        const detailedError = error.context?.error || error.message;
        throw new Error(detailedError);
      }
      if (data.error) throw new Error(JSON.stringify(data.error));

      setReadingResult(data.reading.reading);
      dismissToast(toastId);
      showSuccess("Je droomduiding is klaar!");

    } catch (err: any) {
      dismissToast(toastId);
      showError(`Er ging iets mis: ${err.message}`);
      setReadingLocale(null); // Reset locale on error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative z-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
            <ChevronLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-amber-200 tracking-wider">{t('dream.title')}</h1>
        <div className="w-32"></div>
      </div>

      <Card className="mb-6 bg-stone-900/50 backdrop-blur-sm border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
            <Eye className="h-5 w-5" />
            {t('dream.yourDreamWorld')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!readingResult ? (
            <div className="space-y-6">
              <PersonaSelector method="dromen" />
              <p className="text-stone-300">
                {t('dream.describe')}
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dreamDescription" className="text-stone-300">{t('dream.yourDream')}</Label>
                  <Textarea 
                    id="dreamDescription" 
                    value={dreamDescription} 
                    onChange={(e) => setDreamDescription(e.target.value)} 
                    placeholder="Ik droomde dat ik kon vliegen boven een stad van kristal..." 
                    className="mt-2 bg-stone-900 border-stone-700 focus:ring-amber-500 min-h-[120px]" 
                  />
                </div>
              </div>
              <Button onClick={generateReading} disabled={!dreamDescription || isGenerating} className="w-full bg-amber-800 hover:bg-amber-700 text-stone-100 flex items-center justify-center gap-2">
                {isGenerating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Duiding...</> : <><Sparkles className="h-4 w-4" />{t('dream.interpret')}</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <ReadingPanel title="De betekenis van je droom" body={readingResult} />
              <div className="flex justify-center">
                <Button onClick={() => setReadingResult(null)} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">Nieuwe droom duiden</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DreamReading;