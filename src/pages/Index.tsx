import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Coffee, Sparkles, Star, User } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";

// Import persona data
import personaeData from "../data/personae.index.json";

const Index = () => {
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<any[]>([]);
  const [readingResult, setReadingResult] = useState<string | null>(null);

  // Load persona data
  const personae = personaeData.personae;

  // Load coffee symbols
  useEffect(() => {
    // In a real app, this would come from a JSON file or API
    const coffeeSymbols = [
      { id: 1, name: "EILAND", meaning: "Onverwachte kans", category: "A" },
      { id: 2, name: "BOOM", meaning: "Lang leven", category: "A" },
      { id: 3, name: "NET", meaning: "Gevaar dat op de loer ligt", category: "A" },
      { id: 4, name: "KOK", meaning: "Binnen korte tijd geluk", category: "A" },
      { id: 5, name: "OCTOPUS", meaning: "Wees voorzichtig", category: "A" },
      { id: 6, name: "GEZIN", meaning: "Blij nieuws", category: "A" },
      { id: 7, name: "SCHORPIOEN", meaning: "Kwaadwillige mensen in je omgeving", category: "A" },
      { id: 8, name: "GIERVOGEL", meaning: "Je moet niet in de schulden raken", category: "A" },
      { id: 9, name: "LONG", meaning: "Overvloed", category: "A" },
      { id: 10, name: "VLAM", meaning: "Een grote liefde wacht op je", category: "A" },
      // More symbols would be loaded here
    ];
    setSymbols(coffeeSymbols);
  }, []);

  const handlePersonaSelect = (persona: any) => {
    setSelectedPersona(persona);
    setSelectedSymbols([]);
    setReadingResult(null);
  };

  const handleSymbolSelect = (symbol: any) => {
    if (selectedSymbols.some(s => s.id === symbol.id)) {
      setSelectedSymbols(selectedSymbols.filter(s => s.id !== symbol.id));
    } else {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
  };

  const generateReading = () => {
    if (selectedSymbols.length === 0) return;
    
    // In a real app, this would call an API or use more sophisticated logic
    const interpretations = selectedSymbols.map(symbol => 
      `${symbol.name}: ${symbol.meaning}`
    );
    
    setReadingResult(`Je koffielezing door ${selectedPersona.displayName}:
    
${interpretations.join("\n\n")}

Interpretatie: Deze symbolen wijzen op een periode van verandering en nieuwe kansen. Wees open voor onverwachte ontmoetingen en vertrouw op je intuïtie.`);
  };

  if (selectedPersona) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button 
              onClick={() => setSelectedPersona(null)} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Andere lezer kiezen
            </Button>
            <h1 className="text-2xl font-bold text-amber-900">Koffielezing</h1>
            <div className="w-32"></div> {/* Spacer for alignment */}
          </div>

          <Card className="mb-6 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-amber-200 p-3 rounded-full">
                  <User className="h-8 w-8 text-amber-800" />
                </div>
                <div>
                  <CardTitle className="text-amber-900">{selectedPersona.displayName}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      {selectedPersona.gender === "female" ? "Vrouwelijk" : "Mannelijk"}
                    </Badge>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      {selectedPersona.age} jaar
                    </Badge>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      {selectedPersona.premium ? "Premium" : "Standaard"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800 mb-4">
                Kies symbolen uit je koffiekop om je lezing te ontvangen.
              </p>
              
              <div className="mb-6">
                <h3 className="font-semibold text-amber-900 mb-2">Geselecteerde symbolen:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSymbols.length > 0 ? (
                    selectedSymbols.map(symbol => (
                      <Badge 
                        key={symbol.id} 
                        className="bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                        onClick={() => handleSymbolSelect(symbol)}
                      >
                        {symbol.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-amber-700 text-sm">Nog geen symbolen geselecteerd</p>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <h3 className="font-semibold text-amber-900 mb-3">Koffiesymbolen (A-K):</h3>
              <ScrollArea className="h-64 rounded-md border border-amber-200 p-4 bg-amber-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {symbols.filter(s => s.category <= "K").map(symbol => (
                    <Button
                      key={symbol.id}
                      variant={selectedSymbols.some(s => s.id === symbol.id) ? "default" : "outline"}
                      className={`h-auto py-3 flex flex-col items-center justify-center ${
                        selectedSymbols.some(s => s.id === symbol.id) 
                          ? "bg-amber-500 hover:bg-amber-600" 
                          : "bg-white hover:bg-amber-100 border-amber-300"
                      }`}
                      onClick={() => handleSymbolSelect(symbol)}
                    >
                      <span className="font-medium text-sm">{symbol.name}</span>
                      <span className="text-xs mt-1 text-center">{symbol.meaning}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={generateReading}
                  disabled={selectedSymbols.length === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 px-6 py-3"
                >
                  <Coffee className="h-5 w-5" />
                  Lezing genereren
                </Button>
              </div>

              {readingResult && (
                <Card className="mt-6 bg-amber-50 border-amber-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-amber-900 mb-2">Je lezing:</h3>
                        <p className="text-amber-800 whitespace-pre-line">{readingResult}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <MadeWithDyad />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 mt-8">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-200 p-4 rounded-full">
              <Coffee className="h-12 w-12 text-amber-800" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-amber-900 mb-3">Starpath Vision</h1>
          <p className="text-amber-700 max-w-2xl mx-auto">
            Ontvang een persoonlijke koffielezing van één van onze ervaren lezers. 
            Kies hieronder je favoriete lezer en ontdek wat de symbolen in je koffiekop betekenen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personae.map((persona) => (
            <Card 
              key={persona.id} 
              className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer border-amber-200"
              onClick={() => handlePersonaSelect(persona)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-amber-900 flex items-center gap-2">
                      {persona.displayName}
                      {persona.premium && (
                        <Star className="h-4 w-4 text-amber-500" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-amber-700 mt-1">
                      {persona.style.tone.split(",")[0]} stijl
                    </p>
                  </div>
                  <div className="bg-amber-200 p-2 rounded-full">
                    <User className="h-5 w-5 text-amber-800" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {persona.gender === "female" ? "Vrouwelijk" : "Mannelijk"}
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {persona.age} jaar
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    QoS: {persona.qos}%
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-amber-900 mb-1">Methodes:</h4>
                  <div className="flex flex-wrap gap-1">
                    {persona.methods.slice(0, 3).map((method) => (
                      <Badge key={method} variant="outline" className="text-amber-700 border-amber-300">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-amber-700 mb-4">
                  "{persona.style.keywords.join(", ")}"
                </p>
                
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePersonaSelect(persona);
                  }}
                >
                  Kies deze lezer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-amber-900 mb-2">Hoe werkt een koffielezing?</h3>
              <p className="text-amber-700 text-sm mb-4">
                Na het drinken van je koffie blijven er symbolen achter in de kop. 
                Onze ervaren lezers interpreteren deze symbolen om inzicht te geven in jouw toekomst.
              </p>
              <div className="flex justify-center gap-4 text-amber-700">
                <div className="flex items-center gap-1">
                  <Coffee className="h-4 w-4" />
                  <span className="text-xs">Drink je koffie</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs">Kies symbolen</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="text-xs">Ontvang lezing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link to="/onboarding">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              Begin je spirituele reis
            </Button>
          </Link>
        </div>

        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;