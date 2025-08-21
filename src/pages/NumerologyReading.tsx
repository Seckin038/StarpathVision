import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Star, 
  Sparkles, 
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import { usePersona } from "@/contexts/PersonaContext";
import ReadingPanel from "@/components/ReadingPanel";

const NumerologyReading = () => {
  const { i18n } = useTranslation();
  const { personaId } = usePersona();
  const [birthDate, setBirthDate] = useState("");
  const [fullName, setFullName] = useState("");
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateNumerology = async () => {
    if (!birthDate || !fullName || isCalculating) return;
    
    setIsCalculating(true);
    const toastId = showLoading("Je numerologische profiel wordt berekend...");

    try {
      const { data, error } = await supabase.functions.invoke('generate-reading', {
        body: {
          locale: i18n.language,
          personaId: personaId,
          method: 'numerologie',
          payload: {
            numerologyData: { birthDate, fullName },
          }
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(JSON.stringify(data.error));

      setReadingResult(data.reading.reading);
      dismissToast(toastId);
      showSuccess("Je profiel is klaar!");

    } catch (err: any) {
      dismissToast(toastId);
      showError(`Er ging iets mis: ${err.message}`);
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="relative z-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
            <ChevronLeft className="h-4 w-4" />
            Terug
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-amber-200 tracking-wider">Numerologie Lezing</h1>
        <div className="w-32"></div>
      </div>

      <Card className="mb-6 bg-stone-900/50 backdrop-blur-sm border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
            <Star className="h-5 w-5" />
            Jouw Numerologische Profiel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!readingResult ? (
            <div className="space-y-6">
              <p className="text-stone-300">
                Ontdek de getallen die jouw pad beïnvloeden. Vul je geboortedatum en volledige naam in.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-stone-300">Volledige naam</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Bijv. Jan van der Berg" className="mt-2 bg-stone-900 border-stone-700 focus:ring-amber-500" />
                </div>
                <div>
                  <Label htmlFor="birthDate" className="text-stone-300">Geboortedatum</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-2 bg-stone-900 border-stone-700 focus:ring-amber-500" />
                </div>
              </div>
              <Button onClick={calculateNumerology} disabled={!birthDate || !fullName || isCalculating} className="w-full bg-amber-800 hover:bg-amber-700 text-stone-100 flex items-center justify-center gap-2">
                {isCalculating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Berekenen...</> : <><Sparkles className="h-4 w-4" />Bereken mijn numerologie</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <ReadingPanel title="Jouw Numerologische Lezing" body={readingResult} />
              <div className="flex justify-center">
                <Button onClick={() => setReadingResult(null)} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">Nieuwe berekening</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NumerologyReading;