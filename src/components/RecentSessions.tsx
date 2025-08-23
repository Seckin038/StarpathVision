import { useEffect, useState } from "react";
import { fetchReadingsPage, Reading } from "@/lib/readings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, BookOpen, Coffee, Star, Eye as DreamIcon } from "lucide-react";

const METHODS = [
  { value: "all", label: "Alles" },
  { value: "tarot", label: "Tarot" },
  { value: "coffee", label: "Koffiedik" },
  { value: "dream", label: "Dromen" },
  { value: "numerology", label: "Numerologie" },
] as const;

const methodMeta: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  tarot: { label: "Tarot", icon: <BookOpen className="h-5 w-5 text-purple-400" />, className: "bg-purple-900/50 border-purple-700 text-purple-300" },
  coffee: { label: "Koffiedik", icon: <Coffee className="h-5 w-5 text-amber-400" />, className: "bg-amber-900/50 border-amber-700 text-amber-300" },
  dream: { label: "Dromen", icon: <DreamIcon className="h-5 w-5 text-indigo-400" />, className: "bg-indigo-900/50 border-indigo-700 text-indigo-300" },
  numerology: { label: "Numerologie", icon: <Star className="h-5 w-5 text-cyan-400" />, className: "bg-cyan-900/50 border-cyan-700 text-cyan-300" },
};

type MethodValue = typeof METHODS[number]['value'];

export default function RecentSessions() {
  const [method, setMethod] = useState<MethodValue>("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Reading[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const PER_PAGE = 25;

  const fetchAndSetReadings = async () => {
    setLoading(true);
    const { items, total } = await fetchReadingsPage({ method, page, perPage: PER_PAGE });
    setRows(items);
    setTotal(total);
    setLoading(false);
  };

  useEffect(() => {
    fetchAndSetReadings();
  }, [method, page]);

  const handleDelete = async (readingId: string) => {
    if (!window.confirm("Weet je zeker dat je deze lezing wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
      return;
    }
    const { error } = await supabase.from("readings").delete().eq("id", readingId);
    if (error) {
      showError(`Verwijderen mislukt: ${error.message}`);
    } else {
      showSuccess("Lezing succesvol verwijderd.");
      fetchAndSetReadings();
    }
  };

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {METHODS.map(m => (
          <Button
            key={m.value}
            size="sm"
            variant={method === m.value ? "default" : "outline"}
            onClick={() => { setMethod(m.value); setPage(1); }}
            className="capitalize"
          >
            {m.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-stone-400">Laden...</div>
      ) : (
        <>
          <ul className="space-y-2">
            {rows.map(r => {
              const meta = methodMeta[r.method] || { label: r.method, icon: <></>, className: "" };
              return (
                <li key={r.id} className="flex items-center justify-between rounded-lg border border-stone-800 p-3 bg-stone-900/50">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-md bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt="Preview" className="w-full h-full object-cover rounded-md" />
                      ) : (
                        meta.icon
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-stone-100 font-medium truncate">{r.title ?? meta.label}</span>
                        <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                      </div>
                      <div className="text-xs text-stone-400">{new Date(r.created_at).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(' ', ', ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/reading/${r.id}`}>View</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/reading/${r.id}?download=pdf`} target="_blank" rel="noopener noreferrer">Download</Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="text-stone-400 italic text-center py-8">Geen sessies gevonden voor dit filter.</li>
            )}
          </ul>

          {total > PER_PAGE && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-stone-400">
                Totaal: {total} • Pagina {page} / {pages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Vorige</Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Volgende</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}