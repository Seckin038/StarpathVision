import { useEffect, useState } from 'react';
import Timeline, { TimelineSession } from '@/components/Timeline';
import { api } from '@/lib/api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<TimelineSession[]>([]);
  useEffect(() => {
    api<TimelineSession[]>('/sessions')
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Sessies</h1>
      <Timeline sessions={sessions} />
    </main>
  );
}

