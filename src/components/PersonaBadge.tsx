import React from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export function PersonaBadge({ onClick }: { onClick?: () => void }) {
  const { personaId, getPersonaById, loading } = usePersona();
  const { i18n } = useTranslation();
  const locale = i18n.language as 'nl' | 'en' | 'tr';
  
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-800/50 px-3 py-1 text-stone-400">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const p = getPersonaById(personaId);
  if (!p) return null;

  const displayName = p.display_name?.[locale] || p.display_name?.['nl'] || personaId;

  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-amber-600/40 bg-amber-500/10 px-3 py-1 text-amber-200 hover:bg-amber-500/20">
      <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
      <span className="font-medium">{displayName}</span>
    </button>
  );
}