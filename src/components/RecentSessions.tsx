import { useEffect, useState } from "react";
import { fetchReadingsPage, Reading } from "@/lib/readings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const METHODS = [
  { value: "all", label: "Alles" },
  { value: "tarot", label: "Tarot" },
  { value: "koffiedik", label: "Koffiedik" },
  { value: "dromen", label: "Dromen" },
  { value: "numerologie", label: "Numerologie" },
] as const;

type MethodValue = typeof METHODS[number]['value'];

export default function RecentSessions() {
  const [method, setMethod] = useState<MethodValue>("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Reading[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const PER_PAGE = 25;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { items, total } = await fetchReadingsPage({ method, page, perPage: PER_PAGE });
      setRows(items);
      setTotal(total);
      setLoading(false);
    })();
  }, [method, page]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const displayMethod = (methodValue: Reading['method']) => {
    const found = METHODS.find(m => m.value === methodValue);
    return found ? found.label : methodValue;
  };

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
            {rows.map(r => (
              <li key={r.id}>
                <Link to={`/reading/${r.id}`} className="flex items-center justify-between rounded-lg border border-stone-800 p-3 bg-stone-900/50 hover:bg-stone-800/50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-stone-100 truncate">{r.title ?? displayMethod(r.method)}</div>
                    <div className="text-xs text-stone-400">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-xs uppercase text-stone-400 ml-4 shrink-0">{displayMethod(r.method)}</div>
                </Link>
              </li>
            ))}
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