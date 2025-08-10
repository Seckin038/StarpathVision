import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';

const schema = z.object({
  clientId: z.string().min(1, 'Client ID is verplicht'),
  date: z.string().min(1, 'Datum is verplicht'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SessionCreate() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: FormData) {
    try {
      const res = await api('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setResult(res);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4">Nieuwe Sessie</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1">Client ID</label>
          <input
            {...register('clientId')}
            className="w-full border rounded p-2 bg-transparent"
          />
          {errors.clientId && (
            <p className="text-red-500 text-sm">{errors.clientId.message}</p>
          )}
        </div>
        <div>
          <label className="block mb-1">Datum</label>
          <input
            type="date"
            {...register('date')}
            className="w-full border rounded p-2 bg-transparent"
          />
          {errors.date && (
            <p className="text-red-500 text-sm">{errors.date.message}</p>
          )}
        </div>
        <div>
          <label className="block mb-1">Notities</label>
          <textarea
            {...register('notes')}
            className="w-full border rounded p-2 bg-transparent"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Aanmaken
        </button>
      </form>
      {result && (
        <p className="mt-4 text-green-600">Sessie aangemaakt met ID: {result.id}</p>
      )}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}

