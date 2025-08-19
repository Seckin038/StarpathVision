import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coffee, 
  Sparkles, 
  User, 
  Upload, 
  Camera,
  ChevronLeft,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

// Load coffee symbols data
import coffeeSymbolsData from "../data/coffeeSymbols.json";

const CoffeeReading = () => {
  const [symbols, setSymbols] = useState<any[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<any[]>([]);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Load coffee symbols
  useEffect(() => {
    setSymbols(coffeeSymbolsData);
  }, []);

  const handleSymbolSelect = (symbol: any) => {
    if (selectedSymbols.some(s => s["Symbool NL"] === symbol["Symbool NL"])) {
      setSelectedSymbols(selectedSymbols.filter(s => s["Symbool NL"] !== symbol["Symbool NL"]));
    } else {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
  };

  const generateReading = () => {
    if (selectedSymbols.length === 0) return;
    
    // In a real app, this would call an AI service
    const interpretations = selectedSymbols.map(symbol => 
      `${symbol["Symbool NL"]}: ${symbol["Betekenis NL"]}`
    );
    
    setReadingResult(`Je koffielezing:
    
${interpretations.join("\n\n")}

Interpretatie: Deze symbolen wijzen op een periode van verandering en nieuwe kansen. Wees open voor onverwachte ontmoetingen en vertrouw op je intuïtie. De energie van vandaag ondersteunt je bij belangrijke beslissingen.`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          setShowUpload(false);
        }
      };
      reader.readAsDataURL(file);
    }
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
          <h1 className="text-2xl font-bold text-amber-900">Koffielezing</h1>
          <div className="w-32"></div> {/* Spacer for alignment */}
        </div>

        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Kies Symbolen uit je Koffiekop
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadedImage ? (
              <div className="mb-6">
                <div className="relative">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded coffee cup" 
                    className="w-full h-64 object-cover rounded-lg border border-amber-300"
                  />
                  <Button 
                    onClick={() => setUploadedImage(null)}
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Verwijderen
                  </Button>
                </div>
                <p className="text-sm text-amber-700 mt-2 text-center">
                  Analyseer de symbolen in je koffiekop of kies handmatig uit de lijst hieronder.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <div 
                  className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center cursor-pointer hover:bg-amber-50 transition-colors"
                  onClick={() => setShowUpload(true)}
                >
                  <Camera className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-medium text-amber-900">Upload een foto van je koffiekop</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Of kies handmatig symbolen uit de lijst hieronder
                  </p>
                </div>
                
                {showUpload && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Tips voor een goede foto</span>
                    </div>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Zorg voor voldoende licht</li>
                      <li>• Fotografeer de binnenkant van de kop</li>
                      <li>• Zorg dat de symbolen duidelijk zichtbaar zijn</li>
                    </ul>
                    <label className="block mt-3">
                      <Button 
                        variant="outline" 
                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Kies foto
                      </Button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold text-amber-900 mb-2">Geselecteerde symbolen:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSymbols.length > 0 ? (
                  selectedSymbols.map((symbol, index) => (
                    <Badge 
                      key={index} 
                      className="bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                      onClick={() => handleSymbolSelect(symbol)}
                    >
                      {symbol["Symbool NL"]}
                    </Badge>
                  ))
                ) : (
                  <p className="text-amber-700 text-sm">Nog geen symbolen geselecteerd</p>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="font-semibold text-amber-900 mb-3">Koffiesymbolen:</h3>
            <ScrollArea className="h-96 rounded-md border border-amber-200 p-4 bg-amber-50">
              <div className="space-y-4">
                {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"].map(letter => {
                  const letterSymbols = symbols.filter(s => s["Letter"] === letter);
                  return letterSymbols.length > 0 ? (
                    <div key={letter}>
                      <h4 className="font-bold text-amber-900 mb-2">{letter}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {letterSymbols.map((symbol, index) => (
                          <Button
                            key={index}
                            variant={selectedSymbols.some(s => s["Symbool NL"] === symbol["Symbool NL"]) ? "default" : "outline"}
                            className={`h-auto py-3 flex flex-col items-center justify-center text-left ${
                              selectedSymbols.some(s => s["Symbool NL"] === symbol["Symbool NL"]) 
                                ? "bg-amber-500 hover:bg-amber-600" 
                                : "bg-white hover:bg-amber-100 border-amber-300"
                            }`}
                            onClick={() => handleSymbolSelect(symbol)}
                          >
                            <span className="font-medium text-sm">{symbol["Symbool NL"]}</span>
                            <span className="text-xs mt-1 text-center">{symbol["Betekenis NL"]}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
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
      </div>
    </div>
  );
};

export default CoffeeReading;