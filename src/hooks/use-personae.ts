import { useEffect, useState } from "react";

export interface Persona {
  id: string;
  displayName: string;
  gender: string;
  age: number;
  cultures: string[];
  methods: string[];
  locales: string[];
  timezones: string[];
  ageGroups: string[];
  experienceLevels: string[];
  style: {
    tone: string;
    tempo: string;
    keywords: string[];
  };
  premium: boolean;
  qos: number;
  fallbacks?: Record<string, string>;
}

type UsePersonaeResult = {
  data: Persona[];
  error: string | null;
  loading: boolean;
};

export const usePersonae = (): UsePersonaeResult => {
  const [data, setData] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/personae-json/personae.index.json");
        if (!res.ok) {
          throw new Error(`Failed to fetch personae: ${res.status}`);
        }
        const json = await res.json();
        setData(json.personae ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, error, loading };
};

