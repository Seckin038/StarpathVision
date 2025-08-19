import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coffee, 
  Sparkles, 
  Upload,
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import falyaPersona from "../data/falya.json";
import MysticalBackground from "@/components/MysticalBackground";

const CoffeeReading = () => {
  const { i18n } = useTranslation();
  const [groupedSymbols, setGroupedSymbols] = useState<Record<string, any[]>>({});
  const [selectedSymbols, setSelectedSymbols] = useState<any[]>([]);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadSymbols = async () => {
      const { data, error } = await supabase
        .from('coffee_symbols')
        .select('*')
        .order('symbol_name_nl', { ascending: true });

      if (error) {
        showError("Kon koffiesymbolen niet laden.");
        console.error(error);
      } else {
        const grouped = (data || []).reduce((acc, symbol) => {
          const letter = (symbol.symbol_name_nl || 'A').charAt(0).toUpperCase();
          if (!acc[letter]) {
            acc[letter] = [];
          }
          acc[letter].push(symbol);
          return acc;
        }, {} as Record<string, any[]>);
        setGroupedSymbols(grouped);
      }
    };
    loadSymbols();
  }, []);

  const handleSymbolSelect = (symbol: any) => {
    if (selectedSymbols.some(s => s.id === symbol.id)) {
      setSelectedSymbols(selectedSymbols.filter(s => s.id !== symbol.id));
    } else {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
  };

  const generateReading = async () => {
    if (selectedSymbols.length === 0 || isGenerating) return;

    setIsGenerating(true);
    const toastId = showLoading("Je lezing wordt voorbereid...");

    try {
      const { data, error } = await supabase.functions.invoke('generate-reading', {
        body: {
          readingType: "Koffiedik",
          language: i18n.language,
          persona: falyaPersona,
          symbols: selectedSymbols,
        }
      });

      if (error) throw new Error(error.message);

      setReadingResult(data.reading);
      dismissToast(toastId);
      showSuccess("Je lezing is klaar!");

    } catch (err: any) {
      dismissToast(toastId);
      showError(`Er ging iets mis: ${err.message}`);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSymbolName = (symbol: any) => {
    return symbol[`symbol_name_${i18n.language}`] || symbol.symbol_name_nl;
  }

  const getSymbolMeaning = (symbol: any) => {
    const desc = symbol[`description_${i18n.language}`] || symbol.description_nl || '';
    return desc.split('.')[0];
  }

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles+sigils" intensity="low" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" />
              Terug
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-amber-200 tracking-wider">Koffielezing</h1>
          <div className="w-32"></div>
        </div>

        <Card className="mb-6 bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
              <Coffee className="h-5 w-5" />
              Kies Symbolen uit je Koffiekop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="font-semibold text-amber-200 mb-2">Geselecteerde symbolen:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSymbols.length > 0 ? (
                  selectedSymbols.map((symbol) => (
                    <Badge 
                      key={symbol.id}
                      className="bg-amber-800 hover:bg-amber-700 text-stone-100 cursor-pointer"
                      onClick={() => handleSymbolSelect(symbol)}
                    >
                      {getSymbolName(symbol)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-stone-400 text-sm">Nog geen symbolen geselecteerd</p>
                )}
              </div>
            </div>

            <Separator className="my-4 bg-stone-800" />

            <h3 className="font-semibold text-amber-200 mb-3">Koffiesymbolen:</h3>
            <ScrollArea className="h-96 rounded-md border border-stone-800 p-4 bg-stone-950/50">
              <div className="space-y-4">
                {Object.keys(groupedSymbols).sort().map(letter => (
                  <div key={letter}>
                    <h4 className="font-bold text-amber-300 mb-2 text-lg">{letter}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {groupedSymbols[letter].map((symbol) => (
                        <Button
                          key={symbol.id}
                          variant={selectedSymbols.some(s => s.id === symbol.id) ? "default" : "outline"}
                          className={`h-auto py-3 flex flex-col items-center justify-center text-center transition-all ${
                            selectedSymbols.some(s => s.id === symbol.id) 
                              ? "bg-amber-800 hover:bg-amber-700 text-stone-100 border-amber-700" 
                              : "bg-stone-900/50 hover:bg-stone-800 border-stone-700 text-stone-300"
                          }`}
                          onClick={() => handleSymbolSelect(symbol)}
                        >
                          <span className="font-medium text-sm">{getSymbolName(symbol)}</span>
                          <span className="text-xs mt-1 text-stone-400">{getSymbolMeaning(symbol)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 flex justify-center gap-3">
              <Link to="/readings/coffee/upload">
                <Button 
                  variant="outline"
                  className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Foto uploaden
                </Button>
              </Link>
              <Button 
                onClick={generateReading}
                disabled={selectedSymbols.length === 0 || isGenerating}
                className="bg-amber-800 hover:bg-amber-700 text-stone-100 flex items-center gap-2 px-6 py-3"
              >
                {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Coffee className="h-5 w-5" />}
                Lezing genereren
              </Button>
            </div>

            {readingResult && (
              <Card className="mt-6 bg-stone-900 border-stone-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-amber-200 mb-2">Je lezing:</h3>
                      <p className="text-stone-300 whitespace-pre-line">{readingResult}</p>
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