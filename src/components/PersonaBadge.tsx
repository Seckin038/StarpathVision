import React from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { PERSONAE } from '@/lib/persona-registry';
import { useTranslation } from 'react-i18next';

export function PersonaBadge({ onClick }: { onClick?: () => void }) {
  const { personaId } = usePersona();
  const { i18n } = useTranslation();
  const locale = i18n.language as 'nl' | 'en' | 'tr';
  
  const p = PERSONAE[personaId];
  if (!p) return null;

  const displayName = p.display?.[locale] || p.display?.['nl'] || personaId;

  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-amber-600/40 bg-amber-500/10 px-3 py-1 text-amber-200 hover:bg-amber-500/20">
      <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
      <span className="font-medium">{displayName}</span>
    </button>
  );
}