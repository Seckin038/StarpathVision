import React from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

const ORDER = ['orakel', 'falya', 'selvara', 'lyara', 'mireya', 'auron', 'kaelen', 'tharion', 'corvan', 'eryndra', 'vaelor', 'schaduw', 'waker', 'alchemist', 'visionair', 'pelgrim'];

export type ReadingMethod = 'tarot' | 'coffee' | 'dromen' | 'numerology';

export function PersonaPicker({
  method = 'tarot',
  onPicked,
}: {
  method?: ReadingMethod;
  onPicked?: () => void;
}) {
  const {
    personaId,
    setPersonaId,
    personas,
    loading,
    gatePersonaMethod,
  } = usePersona();
  const { i18n } = useTranslation();
  const locale = i18n.language as 'nl' | 'en' | 'tr';

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ORDER.filter(id => personas[id]).map((id) => {
          const p = personas[id];
          const gate = gatePersonaMethod(id, method, locale);
          const disabled = Boolean(gate);
          const active = personaId === id;
          const displayName = p.display_name?.[locale] || p.display_name?.['nl'] || id;
          const stylePoints = p.style?.[locale] || p.style?.['nl'] || [];

          return (
            <button
              key={id}
              disabled={disabled}
              onClick={() => { setPersonaId(id); onPicked?.(); }}
              className={`relative rounded-2xl border p-4 text-left transition ${active ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-amber-100 font-semibold">{displayName}</div>
                {p.is_premium && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/20 border border-amber-600/40 text-amber-300">Premium</span>}
              </div>
              <ul className="text-sm text-amber-200/80 space-y-1 list-disc pl-5">
                {stylePoints.slice(0, 3).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              {disabled && (
                <div className="absolute inset-0 backdrop-blur-[1px] bg-black/40 rounded-2xl grid place-items-center text-amber-200 text-sm p-2 text-center">
                  {gate}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-stone-400 text-sm">Geselecteerd: <span className="text-amber-300 font-medium">{personas[personaId]?.display_name?.[locale] || personas[personaId]?.display_name?.['nl']}</span></div>
    </div>
  );
}