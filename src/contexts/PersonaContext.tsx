import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type Persona = {
  id: string;
  display_name: Record<string, string>;
  methods: string[];
  style: Record<string, string[]>;
  is_premium: boolean;
  [key: string]: any; // Allow other properties
};

export type PersonaContextValue = {
  personaId: string;
  setPersonaId: (id: string) => void;
  personas: Record<string, Persona>;
  loading: boolean;
  getPersonaById: (id: string) => Persona | undefined;
  gatePersonaMethod: (personaId: string, method: string, locale: string) => string | null;
};

const PersonaContext = createContext<PersonaContextValue | undefined>(undefined);

const LS_KEY = 'sv.personaId';

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaId] = useState<string>(() => localStorage.getItem(LS_KEY) || 'selvara');
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem(LS_KEY, personaId);
  }, [personaId]);

  useEffect(() => {
    const fetchPersonas = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('personas').select('*');
      if (error) {
        console.error("Error loading personas:", error);
        setLoading(false);
        return;
      }
      const personasMap: Record<string, Persona> = {};
      for (const p of data) {
        personasMap[p.id] = p as Persona;
      }
      setPersonas(personasMap);
      setLoading(false);
    };
    fetchPersonas();
  }, []);

  const getPersonaById = (id: string) => personas[id];

  const gatePersonaMethod = (pId: string, method: string, locale: string): string | null => {
    const p = personas[pId];
    if (!p) return "Onbekende waarzegger.";
    
    if (!p.methods || !p.methods.includes(method)) {
      const name = p.display_name?.[locale] || p.display_name?.['nl'] || pId;
      const methodTranslations = {
        nl: { tarot: 'tarot', coffee: 'koffiedik', astrology: 'astrologie', numerology: 'numerologie', dromen: 'droom' },
        en: { tarot: 'tarot', coffee: 'coffee', astrology: 'astrology', numerology: 'numerology', dromen: 'dream' },
        tr: { tarot: 'tarot', coffee: 'kahve', astrology: 'astroloji', numerology: 'numeroloji', dromen: 'rüya' },
      };
      const translatedMethod = (methodTranslations[locale] as any)?.[method] || method;
      
      if (locale === 'nl') return `${name} doet geen ${translatedMethod}-lezingen.`;
      if (locale === 'tr') return `${name} ${translatedMethod} okumaları yapmaz.`;
      return `${name} does not perform ${method} readings.`;
    }
    
    return null;
  };

  const value = useMemo(() => ({
    personaId,
    setPersonaId,
    personas,
    loading,
    getPersonaById,
    gatePersonaMethod,
  }), [personaId, personas, loading]);

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider');
  return ctx;
}