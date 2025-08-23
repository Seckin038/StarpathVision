import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type Metrics = {
  total_users: number;
  total_readings: number;
  today_readings: number;
  last7: { day:string; cnt:number }[];
  top_spreads: { spread_id:string; cnt:number }[];
  langs: { locale:string; cnt:number }[];
};

export default function AdminHome() {
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('admin');

  useEffect(()=>{ 
    const load = async () => {
      const { data, error } = await supabase.rpc("admin_get_metrics");
      if (error) {
        setError(error.message);
      } else {
        setM(data as Metrics);
      }
    };
    load(); 
  },[]);

  if (error) return <div className="p-6 text-red-400">{t('home.loading_error', { error })}</div>;
  if (!m) return <div className="p-6 text-stone-400 flex items-center gap-2"><Loader2 className="animate-spin h-5 w-5" />{t('home.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title={t('home.users')} value={m.total_users} />
        <StatCard title={t('home.readings_total')} value={m.total_readings} />
        <StatCard title={t('home.readings_today')} value={m.today_readings} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-amber-200">{t('home.last7_days')}</h3>
            <ul className="text-sm space-y-1">
              {m.last7.map(r => (
                <li key={r.day} className="flex justify-between">
                  <span className="opacity-70">{r.day}</span>
                  <span>{r.cnt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-amber-200">{t('home.top_spreads')}</h3>
            <ul className="text-sm space-y-1">
              {m.top_spreads.map(r => (
                <li key={r.spread_id} className="flex justify-between">
                  <span className="opacity-70">{r.spread_id}</span>
                  <span>{r.cnt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/60 border-stone-800 lg:col-span-2">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-amber-200">{t('home.language_distribution')}</h3>
            <ul className="text-sm flex flex-wrap gap-4">
              {m.langs.map(r => (
                <li key={r.locale} className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700">
                    {r.locale}
                  </span>
                  <span className="opacity-80">{r.cnt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }:{ title:string; value:number }) {
  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider opacity-60">{title}</div>
        <div className="text-3xl font-semibold text-amber-200">{value}</div>
      </CardContent>
    </Card>
  );
}