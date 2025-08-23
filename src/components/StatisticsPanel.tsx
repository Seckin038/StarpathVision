import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Coffee, Eye, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

type Stat = {
  method: string;
  count: number;
};

const methodMap: Record<string, { label: string; icon: React.ReactNode }> = {
  tarot: { label: "Tarot", icon: <BookOpen className="h-6 w-6 text-blue-400" /> },
  coffee: { label: "Koffiedik", icon: <Coffee className="h-6 w-6 text-amber-400" /> },
  dream: { label: "Dromen", icon: <Eye className="h-6 w-6 text-indigo-400" /> },
  numerology: { label: "Numerologie", icon: <Star className="h-6 w-6 text-yellow-400" /> },
};

const StatisticsPanel = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_my_reading_stats");
      if (error) {
        console.error("Error fetching reading stats:", error);
      } else {
        setStats(data || []);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const allMethods = ['tarot', 'numerology', 'coffee', 'dream'];
  const displayStats = allMethods.map(methodKey => {
    const stat = stats.find(s => s.method === methodKey);
    return {
      ...methodMap[methodKey],
      count: stat ? stat.count : 0,
    };
  });

  return (
    <Card className="bg-stone-950/60 border-white/10">
      <CardHeader>
        <CardTitle className="text-amber-200">{t('profile.statistics')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {displayStats.map(stat => (
              <div key={stat.label}>
                <div className="mx-auto bg-stone-800/50 border border-stone-700 rounded-full p-3 w-fit mb-2">
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-stone-100">{stat.count}</p>
                <p className="text-xs text-stone-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticsPanel;