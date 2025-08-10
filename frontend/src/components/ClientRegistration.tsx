import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';

const schema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
});

type FormData = z.infer<typeof schema>;

export default function ClientRegistration() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: FormData) {
    try {
      const res = await api('/clients', {
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
      <h2 className="text-xl font-semibold mb-4">Registreer Cliënt</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1">Voornaam</label>
          <input
            {...register('first_name')}
            className="w-full border rounded p-2 bg-transparent"
          />
          {errors.first_name && (
            <p className="text-red-500 text-sm">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block mb-1">Achternaam</label>
          <input
            {...register('last_name')}
            className="w-full border rounded p-2 bg-transparent"
          />
          {errors.last_name && (
            <p className="text-red-500 text-sm">{errors.last_name.message}</p>
          )}
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full border rounded p-2 bg-transparent"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Opslaan
        </button>
      </form>
      {result && (
        <p className="mt-4 text-green-600">
          Cliënt aangemaakt met ID: {result.id}
        </p>
      )}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}

