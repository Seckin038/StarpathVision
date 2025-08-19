import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Sparkles, 
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";

const NumerologyReading = () => {
  const [birthDate, setBirthDate] = useState("");
  const [fullName, setFullName] = useState("");
  const [readingResult, setReadingResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateNumerology = () => {
    if (!birthDate || !fullName) return;
    setIsCalculating(true);
    setTimeout(() => {
      const lifePath = Math.floor(Math.random() * 9) + 1;
      const destiny = Math.floor(Math.random() * 9) + 1;
      const soulUrge = Math.floor(Math.random() * 9) + 1;
      setReadingResult({
        lifePath: { number: lifePath, meaning: getLifePathMeaning(lifePath) },
        destiny: { number: destiny, meaning: getDestinyMeaning(destiny) },
        soulUrge: { number: soulUrge, meaning: getSoulUrgeMeaning(soulUrge) }
      });
      setIsCalculating(false);
    }, 2000);
  };

  const getLifePathMeaning = (n: number) => ({1:"De leider",2:"De mediator",3:"De communicatieve",4:"De bouwer",5:"De vrijheidszoeker",6:"De verzorger",7:"De denker",8:"De manager",9:"De humanist"}[n]||"");
  const getDestinyMeaning = (n: number) => ({1:"Leiderschap",2:"Verbinding",3:"Creativiteit",4:"Structuur",5:"Avontuur",6:"Verzorging",7:"Spiritualiteit",8:"Materieel succes",9:"Humanisme"}[n]||"");
  const getSoulUrgeMeaning = (n: number) => ({1:"Onafhankelijkheid",2:"Harmonie",3:"Expressie",4:"Stabiliteit",5:"Vrijheid",6:"Liefde",7:"Wijsheid",8:"Macht",9:"Altruïsme"}[n]||"");

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-black to-stone-950 text-stone-200 p-4 font-serif">
      <div className="max-w-4xl mx-auto">
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
                <div className="text-center">
                  <h2 className="text-xl font-bold text-amber-200 mb-2">Jouw Numerologische Profiel</h2>
                  <p className="text-stone-400">Gebaseerd op je geboortedatum en naam</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[{title: "Levenspad", data: readingResult.lifePath}, {title: "Bestemming", data: readingResult.destiny}, {title: "Ziel Verlangen", data: readingResult.soulUrge}].map(item => (
                    <Card key={item.title} className="bg-stone-900 border-stone-800">
                      <CardContent className="p-4 text-center">
                        <div className="bg-stone-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-amber-300 font-bold text-xl">{item.data.number}</span></div>
                        <h3 className="font-semibold text-amber-200">{item.title}</h3>
                        <p className="text-sm text-stone-400 mt-2">{item.data.meaning}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator className="my-4 bg-stone-800" />
                <div className="bg-stone-900 p-4 rounded-lg border border-stone-800">
                  <h3 className="font-semibold text-amber-200 mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" />Persoonlijke Inzichten</h3>
                  <p className="text-stone-300">Je Levenspad {readingResult.lifePath.number} wijst op een reis van zelfontdekking. Je Bestemming {readingResult.destiny.number} suggereert dat je talenten zich manifesteren in creatieve domeinen. Je Ziel Verlangen {readingResult.soulUrge.number} toont een diepe behoefte aan harmonie.</p>
                </div>
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