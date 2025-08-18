import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Persona {
  id: number;
  name: string;
  [key: string]: unknown;
}

export const usePersonae = () => {
  const [data, setData] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPersonae = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('personae').select('*');
      if (error) {
        setError(error.message);
        setData([]);
      } else {
        setData(data || []);
        setError(null);
      }
      setLoading(false);
    };

    fetchPersonae();
  }, []);

  return { data, error, loading };
};
