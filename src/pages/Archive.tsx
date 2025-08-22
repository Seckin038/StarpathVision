import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Coffee, 
  Sparkles, 
  Calendar, 
  Search,
  Download,
  Trash2,
  ChevronLeft,
  Loader2,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { downloadJSON } from "@/utils/exports";
import { useTranslation } from "react-i18next";

interface Reading {
  id: string;
  created_at: string;
  method: string;
  title: string | null;
  interpretation: any;
  payload: any;
  locale: string | null;
}

const READINGS_PER_PAGE = 25;

const Archive = () => {
  const { t } = useTranslation();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<Reading[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(READINGS_PER_PAGE);

  const getReadingSummary = (reading: Reading): string => {
    if (!reading.interpretation) return t('archive.summary.none');
    if (reading.method === 'tarot') {
      return reading.interpretation.story || reading.interpretation.advice || t('archive.summary.tarot');
    }
    return reading.interpretation.reading || t('archive.summary.default');
  };

  useEffect(() => {
    const fetchReadings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("readings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        showError("Kon lezingen niet ophalen.");
        console.error(error);
      } else {
        setReadings(data as Reading[]);
      }
      setLoading(false);
    };
    fetchReadings();
  }, []);

  useEffect(() => {
    let result = readings;
    if (searchTerm) {
      result = result.filter(r => {
        const interpretationText = JSON.stringify(r.interpretation || {});
        const titleText = r.title || '';
        return interpretationText.toLowerCase().includes(searchTerm.toLowerCase()) ||
               titleText.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    if (filterMethod !== "all") {
      result = result.filter(r => r.method === filterMethod);
    }
    setFilteredReadings(result);
    setVisibleCount(READINGS_PER_PAGE); // Reset pagination on filter change
  }, [searchTerm, filterMethod, readings]);

  const deleteReading = async (id: string) => {
    if (window.confirm("Weet je zeker dat je deze lezing wilt verwijderen?")) {
      const { error } = await supabase.from("readings").delete().eq("id", id);
      if (error) {
        showError("Kon lezing niet verwijderen.");
      } else {
        setReadings(readings.filter(r => r.id !== id));
      }
    }
  };

  const downloadSingleReading = (reading: Reading) => {
    downloadJSON(`starpathvision_lezing_${reading.id}.json`, reading);
  };

  const downloadAllData = async () => {
    const toastId = showLoading("Bezig met exporteren...");
    try {
        const { data, error } = await supabase.functions.invoke('export-user-data');
        if (error) throw error;
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `starpathvision_data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        dismissToast(toastId);
        showSuccess("Gegevens succesvol geëxporteerd.");
    } catch (err: any) {
        dismissToast(toastId);
        showError(`Export mislukt: ${err.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
        <h1 className="text-2xl font-bold text-amber-200 tracking-wider">{t('archive.title')}</h1>
        <div className="w-32 flex justify-end">
          <Button onClick={downloadAllData} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Download className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-amber-300 flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5" />{t('archive.historyTitle')}</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                <Input placeholder={t('archive.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-stone-900 border-stone-700 focus:ring-amber-500" />
              </div>
              <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="border border-stone-700 rounded-md px-3 py-2 bg-stone-900 text-stone-300 focus:ring-amber-500 focus:border-amber-500">
                <option value="all">{t('archive.filter.all')}</option>
                <option value="tarot">{t('archive.filter.tarot')}</option>
                <option value="numerologie">{t('archive.filter.numerology')}</option>
                <option value="koffiedik">{t('archive.filter.coffee')}</option>
                <option value="dromen">{t('archive.filter.dreams')}</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 flex justify-center items-center gap-2">
              <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
              <p className="text-stone-400">Lezingen worden geladen...</p>
            </div>
          ) : filteredReadings.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="font-semibold text-amber-200 mb-2">{t('archive.noResults.title')}</h3>
              <p className="text-stone-400 mb-4">{t('archive.noResults.body')}</p>
              <Button onClick={() => { setSearchTerm(""); setFilterMethod("all"); }} className="bg-amber-800 hover:bg-amber-700 text-stone-100">{t('archive.noResults.reset')}</Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-4 pr-4">
                  {filteredReadings.slice(0, visibleCount).map((reading) => (
                    <Card key={reading.id} className="bg-stone-900 border-stone-800">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-stone-200">{reading.title || t('archive.readingOf', { date: formatDate(reading.created_at) })}</h3>
                              <Badge variant="outline" className="text-stone-300 border-stone-700">{reading.method}</Badge>
                              {reading.locale && (
                                <Badge variant="outline" className="text-stone-300 border-stone-700 flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {reading.locale.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-stone-400 mb-3">
                              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{formatDate(reading.created_at)}</span></div>
                            </div>
                            <p className="text-stone-300 text-sm line-clamp-2">{getReadingSummary(reading)}</p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button onClick={() => downloadSingleReading(reading)} variant="outline" size="sm" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Download className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => deleteReading(reading.id)} className="border-red-900/50 text-red-400 hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              {visibleCount < filteredReadings.length && (
                <div className="mt-4 text-center">
                  <Button 
                    onClick={() => setVisibleCount(prev => prev + READINGS_PER_PAGE)}
                    variant="outline"
                  >
                    Laad meer ({filteredReadings.length - visibleCount} resterend)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Archive;