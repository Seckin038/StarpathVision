import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coffee, 
  Upload, 
  Camera,
  ChevronLeft,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import { usePersona } from "@/contexts/PersonaContext";
import ReadingPanel from "@/components/ReadingPanel";

const CoffeeReadingWithUpload = () => {
  const { i18n, t } = useTranslation();
  const { personaId } = usePersona();
  const [symbols, setSymbols] = useState<any[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<any[]>([]);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedSymbols, setDetectedSymbols] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSymbols = async () => {
      const { data, error } = await supabase
        .from('coffee_symbols')
        .select('*');

      if (error) {
        showError("Kon koffiesymbolen niet laden.");
      } else {
        setSymbols(data);
      }
    };
    fetchSymbols();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          simulateSymbolDetection();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateSymbolDetection = () => {
    if (symbols.length === 0) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const shuffled = [...symbols].sort(() => 0.5 - Math.random());
      const mockDetectedSymbols = shuffled.slice(0, 5);
      
      setDetectedSymbols(mockDetectedSymbols);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleSymbolSelect = (symbol: any) => {
    const symbolIdentifier = symbol.symbol_nl;
    if (selectedSymbols.some(s => s.symbol_nl === symbolIdentifier)) {
      setSelectedSymbols(selectedSymbols.filter(s => s.symbol_nl !== symbolIdentifier));
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
          locale: i18n.language,
          personaId: personaId,
          method: 'koffiedik',
          payload: {
            symbols: selectedSymbols,
          }
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(JSON.stringify(data.error));

      setReadingResult(data.reading.reading);
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

  const resetReading = () => {
    setUploadedImage(null);
    setDetectedSymbols([]);
    setSelectedSymbols([]);
    setReadingResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const getSymbolName = (symbol: any) => {
    return symbol[`symbol_${i18n.language}`] || symbol.symbol_nl;
  }

  return (
    <div className="relative z-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
            <ChevronLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-amber-200 tracking-wider">{t('coffee.titleWithUpload')}</h1>
        <div className="w-32"></div>
      </div>

      <Card className="mb-6 bg-stone-900/50 backdrop-blur-sm border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
            <Camera className="h-5 w-5" />
            {t('coffee.uploadTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!uploadedImage ? (
            <div>
              <div 
                className="border-2 border-dashed border-stone-700 rounded-lg p-8 text-center cursor-pointer hover:bg-stone-900 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                <h3 className="font-medium text-stone-200">{t('coffee.uploadDesc')}</h3>
                <p className="text-stone-400 text-sm mt-1">
                  Of maak een foto met je camera
                </p>
                <Button 
                  className="mt-4 bg-amber-800 hover:bg-amber-700 text-stone-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('coffee.choosePhoto')}
                </Button>
              </div>
              
              <div className="mt-4 p-4 bg-stone-900 rounded-lg border border-stone-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-stone-200">{t('coffee.tipsTitle')}</span>
                </div>
                <ul className="text-sm text-stone-400 space-y-1 list-disc list-inside">
                  {(t('coffee.tips', { returnObjects: true }) as string[]).map((tip: string, index: number) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                ref={fileInputRef}
              />
            </div>
          ) : (
            <div className="mb-6">
              <div className="relative">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded coffee cup" 
                  className="w-full h-64 object-contain rounded-lg border border-stone-700"
                />
                <Button 
                  onClick={resetReading}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-stone-900/80 border-stone-700 text-stone-300 hover:bg-stone-800"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              {isAnalyzing ? (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-2"></div>
                  <p className="text-stone-400">{t('coffee.analyzing')}</p>
                </div>
              ) : detectedSymbols.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-amber-200 mb-2">{t('coffee.detectedSymbols')}</h3>
                  <p className="text-sm text-stone-400 mb-3">{t('coffee.clickToUse')}</p>
                  <div className="flex flex-wrap gap-2">
                    {detectedSymbols.map((symbol) => (
                      <Badge 
                        key={symbol.symbol_nl} 
                        variant={selectedSymbols.some(s => s.symbol_nl === symbol.symbol_nl) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          selectedSymbols.some(s => s.symbol_nl === symbol.symbol_nl)
                          ? "bg-amber-800 text-stone-100 border-amber-700"
                          : "border-stone-700 text-stone-300 hover:bg-stone-800"
                        }`}
                        onClick={() => handleSymbolSelect(symbol)}
                      >
                        {getSymbolName(symbol)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedSymbols.length > 0 && (
            <>
              <Separator className="my-4 bg-stone-800" />
              <div className="flex justify-center">
                <Button 
                  onClick={generateReading}
                  disabled={isGenerating}
                  className="bg-amber-800 hover:bg-amber-700 text-stone-100 flex items-center gap-2 px-6 py-3"
                >
                  {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Coffee className="h-5 w-5" />}
                  {t('coffee.generateReading')}
                </Button>
              </div>
            </>
          )}

          {readingResult && (
            <div className="mt-6">
              <ReadingPanel title="Je lezing" body={readingResult} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoffeeReadingWithUpload;