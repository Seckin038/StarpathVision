import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  const { t } = useTranslation();

  useEffect(()=>{ 
    const load = async () => {
      const { data, error } = await supabase.rpc("admin_get_metrics");
      if (error) {
        setError(error.message);
      } else {
        // Formatteer de datum voor de grafiek
        const formattedData = (data as Metrics).last7.map(item => ({
          ...item,
          day: new Date(item.day).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })
        }));
        setM({ ...data, last7: formattedData });
      }
    };
    load(); 
  },[]);

  if (error) return <div className="p-6 text-red-400">Fout bij laden: {error}</div>;
  if (!m) return <div className="p-6 text-stone-400 flex items-center gap-2"><Loader2 className="animate-spin h-5 w-5" />Laden…</div>;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title={t('admin.home.users')} value={m.total_users} />
        <StatCard title={t('admin.home.readingsTotal')} value={m.total_readings} />
        <StatCard title={t('admin.home.readingsToday')} value={m.today_readings} />
      </div>

      <Card className="bg-stone-900/60 border-stone-800">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 text-amber-200">{t('admin.home.activity7days')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={m.last7} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="day" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(28, 25, 23, 0.8)',
                  borderColor: '#44403c',
                  color: '#f5f5f4'
                }}
                cursor={{ fill: 'rgba(251, 191, 36, 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <Bar dataKey="cnt" name={t('admin.home.readings')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-amber-200">{t('admin.home.topSpreads')}</h3>
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

        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-amber-200">{t('admin.home.languageDistribution')}</h3>
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