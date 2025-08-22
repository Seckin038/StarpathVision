import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download,
  ChevronLeft,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useTranslation } from "react-i18next";
import RecentSessions from "@/components/RecentSessions"; // Import the new component

const Archive = () => {
  const { t } = useTranslation();

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
          <CardTitle className="text-amber-300 flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5" />{t('archive.historyTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentSessions />
        </CardContent>
      </Card>
    </div>
  );
};

export default Archive;