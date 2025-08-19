import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Sparkles, 
  User, 
  Calendar,
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
    
    // Simulate calculation delay
    setTimeout(() => {
      // In a real app, this would be actual numerology calculations
      const lifePath = Math.floor(Math.random() * 9) + 1;
      const destiny = Math.floor(Math.random() * 9) + 1;
      const soulUrge = Math.floor(Math.random() * 9) + 1;
      
      setReadingResult({
        lifePath: {
          number: lifePath,
          meaning: getLifePathMeaning(lifePath)
        },
        destiny: {
          number: destiny,
          meaning: getDestinyMeaning(destiny)
        },
        soulUrge: {
          number: soulUrge,
          meaning: getSoulUrgeMeaning(soulUrge)
        }
      });
      
      setIsCalculating(false);
    }, 2000);
  };

  const getLifePathMeaning = (number: number) => {
    const meanings: Record<number, string> = {
      1: "De leider - Initiatiefnemer, onafhankelijk, ambitieus",
      2: "De mediator - Samenwerking, diplomatie, gevoeligheid",
      3: "De communicatieve - Creativiteit, expressie, sociale vaardigheden",
      4: "De bouwer - Stabiliteit, praktisch, hardwerkend",
      5: "De vrijheidszoeker - Avontuur, verandering, adaptief",
      6: "De verzorger - Verantwoordelijkheid, liefde, harmonie",
      7: "De denker - Spiritueel, analytisch, introspectief",
      8: "De manager - Macht, materieel succes, autoriteit",
      9: "De humanist - Altruïsme, wijsheid, universele liefde"
    };
    return meanings[number] || "Uniek pad met speciale gaven";
  };

  const getDestinyMeaning = (number: number) => {
    const meanings: Record<number, string> = {
      1: "Leiderschap en onafhankelijkheid zijn jouw roeping",
      2: "Je bent geboren om te verbinden en te harmoniëren",
      3: "Creatieve expressie en communicatie zijn je gave",
      4: "Je roeping is om structuren te bouwen en te stabiliseren",
      5: "Je bent bedoeld voor avontuur en verandering",
      6: "Je roeping is om te verzorgen en te harmoniseren",
      7: "Je bent een spirituele gids en denker",
      8: "Je roeping is om materieel succes te creëren",
      9: "Je bent een humanist met universele liefde"
    };
    return meanings[number] || "Een unieke bestemming die zich ontvouwt";
  };

  const getSoulUrgeMeaning = (number: number) => {
    const meanings: Record<number, string> = {
      1: "Je innerlijk verlangt naar onafhankelijkheid en leiderschap",
      2: "Je ziel verlangt naar harmonie en verbinding",
      3: "Je innerlijk verlangt naar expressie en creativiteit",
      4: "Je ziel verlangt naar stabiliteit en structuur",
      5: "Je innerlijk verlangt naar vrijheid en avontuur",
      6: "Je ziel verlangt naar liefde en verantwoordelijkheid",
      7: "Je innerlijk verlangt naar wijsheid en spiritualiteit",
      8: "Je ziel verlangt naar macht en materieel succes",
      9: "Je innerlijk verlangt naar altruïsme en universele liefde"
    };
    return meanings[number] || "Een diep verlangen dat zich nog moet onthullen";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
              <ChevronLeft className="h-4 w-4" />
              Terug naar dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-amber-900">Numerologie Lezing</h1>
          <div className="w-32"></div> {/* Spacer for alignment */}
        </div>

        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Jouw Numerologische Profiel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!readingResult ? (
              <div className="space-y-6">
                <p className="text-amber-800">
                  Ontdek de getallen die jouw pad beïnvloeden. Vul je geboortedatum en volledige naam in om je numerologische profiel te ontvangen.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-amber-900">Volledige naam</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Bijv. Jan van der Berg"
                      className="mt-2 border-amber-300 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="birthDate" className="text-amber-900">Geboortedatum</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="mt-2 border-amber-300 focus:ring-amber-500"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={calculateNumerology}
                  disabled={!birthDate || !fullName || isCalculating}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2"
                >
                  {isCalculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Berekenen...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Bereken mijn numerologie
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-amber-900 mb-2">Jouw Numerologische Profiel</h2>
                  <p className="text-amber-700">Gebaseerd op je geboortedatum en naam</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-amber-900 font-bold text-xl">{readingResult.lifePath.number}</span>
                        </div>
                        <h3 className="font-semibold text-amber-900">Levenspad</h3>
                        <p className="text-sm text-amber-700 mt-2">{readingResult.lifePath.meaning}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-amber-900 font-bold text-xl">{readingResult.destiny.number}</span>
                        </div>
                        <h3 className="font-semibold text-amber-900">Bestemming</h3>
                        <p className="text-sm text-amber-700 mt-2">{readingResult.destiny.meaning}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-amber-900 font-bold text-xl">{readingResult.soulUrge.number}</span>
                        </div>
                        <h3 className="font-semibold text-amber-900">Ziel Verlangen</h3>
                        <p className="text-sm text-amber-700 mt-2">{readingResult.soulUrge.meaning}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Separator className="my-4" />
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Persoonlijke Inzichten
                  </h3>
                  <p className="text-amber-800">
                    Je Levenspad {readingResult.lifePath.number} wijst op een reis van zelfontdekking en groei. 
                    Je Bestemming {readingResult.destiny.number} suggereert dat je talenten zich manifesteren 
                    in creatieve en expressieve domeinen. Je Ziel Verlangen {readingResult.soulUrge.number} 
                    toont een diepe behoefte aan harmonie en verbinding met anderen.
                  </p>
                  <p className="text-amber-800 mt-2">
                    Deze combinatie wijst op een pad waarbij je je unieke gaven kunt gebruiken om anderen te inspireren 
                    en te verbinden. Vertrouw op je intuïtie en wees open voor nieuwe mogelijkheden die zich voordoen.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setReadingResult(null)}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Nieuwe berekening
                  </Button>
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