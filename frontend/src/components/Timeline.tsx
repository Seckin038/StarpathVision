export type TimelineSession = {
  id: string;
  date: string;
  summary?: string;
  comparison?: string;
};

export default function Timeline({
  sessions,
}: {
  sessions: TimelineSession[];
}) {
  if (!sessions || sessions.length === 0) {
    return <p>Geen sessies beschikbaar.</p>;
  }
  return (
    <ul className="space-y-6">
      {sessions.map((s) => (
        <li key={s.id} className="relative pl-6">
          <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-indigo-500" />
          <div className="card p-4">
            <p className="font-semibold">
              {new Date(s.date).toLocaleDateString()}
            </p>
            {s.summary && <p className="mt-1">{s.summary}</p>}
            {s.comparison && (
              <p className="mt-2 text-sm opacity-80">{s.comparison}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

