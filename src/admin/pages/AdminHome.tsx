import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Metrics = {
  total_users: number;
  total_readings: number;
  today_readings: number;
  last7: { day: string; cnt: number }[];
  top_spreads: { spread_id: string; cnt: number }[];
  langs: { locale: string; cnt: number }[];
};

const COLORS = ["#FFBB28", "#00C49F", "#FF8042", "#0088FE", "#AF19FF"];

export default function AdminHome() {
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('admin');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("admin_get_metrics");
      if (error) {
        setError(error.message);
      } else {
        setM(data as Metrics);
      }
    };
    load();
  }, []);

  if (error) return <div className="p-6 text-red-400">{t('home.loading_error', { error })}</div>;
  if (!m) return <div className="p-6 text-stone-400 flex items-center gap-2"><Loader2 className="animate-spin h-5 w-5" />{t('home.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title={t('home.users')} value={m.total_users} />
        <StatCard title={t('home.readings_total')} value={m.total_readings} />
        <StatCard title={t('home.readings_today')} value={m.today_readings} />
      </div>

      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-200">{t('home.last7_days')}</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={m.last7} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c' }} />
              <Bar dataKey="cnt" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Lezingen" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-stone-900/60 border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200">{t('home.top_spreads')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.top_spreads} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="spread_id" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c' }} />
                <Bar dataKey="cnt" fill="#8884d8" radius={[0, 4, 4, 0]} name="Aantal" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/60 border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200">{t('home.language_distribution')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={m.langs}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cnt"
                  nameKey="locale"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {m.langs.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider opacity-60">{title}</div>
        <div className="text-3xl font-semibold text-amber-200">{value}</div>
      </CardContent>
    </Card>
  );
}