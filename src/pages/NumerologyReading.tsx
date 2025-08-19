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
import { supabase } from "@/integrations/supabase/client";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import selvaraPersona from "../data/selvara.json";
import MysticalBackground from "@/components/MysticalBackground";

const NumerologyReading = () => {
  const { i18n } = useTranslation();
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
          readingType: "Numerologie",
          language: i18n.language,
          persona: selvaraPersona,
          numerologyData: { birthDate, fullName },
        }
      });

      if (error) throw new Error(error.message);

      setReadingResult(data.reading);
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
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles" intensity="low" />
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
                <Card className="bg-stone-900 border-stone-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-amber-200 mb-2">Jouw Numerologische Lezing:</h3>
                        <p className="text-stone-300 whitespace-pre-line">{readingResult}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-center">
                  <Button onClick={() => setReadingResult(null)} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">Nieuwe berekening</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NumerologyReading;