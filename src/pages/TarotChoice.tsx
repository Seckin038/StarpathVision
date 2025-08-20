import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, ChevronLeft, BookOpen } from "lucide-react";
import MysticalBackground from "@/components/MysticalBackground";
import { useTranslation } from "react-i18next";
import { Spread, Locale } from "@/types/tarot";

const TarotChoice = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;

  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpreads = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/config/tarot/spread-library.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        setSpreads(data.spreads);

      } catch (err: any) {
        console.error("Fout bij het laden van de tarot leggingen:", err);
        setError(err.message || "Kon de tarot leggingen niet laden.");
      } finally {
        setLoading(false);
      }
    };

    fetchSpreads();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-stone-400">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
          <p>Leggingen worden geladen...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-8">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Er is iets misgegaan</h2>
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spreads.map(spread => (
          <Link to={`/readings/tarot/spread/${spread.id}`} key={spread.id}>
            <Card className="h-full bg-stone-900/50 backdrop-blur-sm border-stone-800 hover:border-amber-700 transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-amber-300 flex items-center gap-3">
                  <BookOpen className="h-5 w-5" />
                  {spread.name[locale]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-400 text-sm mb-4 h-20 overflow-hidden">{spread.ui_copy[locale].subtitle}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-stone-500">{spread.cards_required} kaarten</span>
                  <Button variant="outline" size="sm" className="border-amber-800 text-amber-300 group-hover:bg-amber-900/50 group-hover:text-amber-200">
                    Start legging
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles" intensity="low" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" /> Terug
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-serif tracking-wide text-amber-200">
              Kies een Tarot Legging
            </h1>
            <p className="text-stone-400">
              Selecteer een legging die resoneert met je vraag.
            </p>
          </div>
          <div className="w-32"></div>
        </header>
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default TarotChoice;