import SessionCreate from '@/components/SessionCreate';

export default function SessionCreatePage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Nieuwe Sessie</h1>
      <SessionCreate />
    </main>
  );
}

