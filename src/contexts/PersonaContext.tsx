import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type PersonaContextValue = {
  personaId: string;
  setPersonaId: (id: string) => void;
};

const PersonaContext = createContext<PersonaContextValue | undefined>(undefined);

const LS_KEY = 'sv.personaId';

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaId] = useState<string>(() => localStorage.getItem(LS_KEY) || 'selvara');

  useEffect(() => {
    localStorage.setItem(LS_KEY, personaId);
  }, [personaId]);

  const value = useMemo(() => ({ personaId, setPersonaId }), [personaId]);
  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider');
  return ctx;
}