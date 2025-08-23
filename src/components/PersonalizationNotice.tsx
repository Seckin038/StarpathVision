import React from 'react';

type Props = {
  context: {
    focus_areas?: string[];
  } | null;
};

export const PersonalizationNotice = ({ context }: Props) => {
  if (!context?.focus_areas?.length) return null;
  
  const focusMap: Record<string, string> = {
    love: 'Liefde & Relaties',
    career: 'Carrière & Werk',
    growth: 'Persoonlijke Groei',
    health: 'Gezondheid & Welzijn',
    spirituality: 'Spiritualiteit',
    finance: 'Financiën',
  };

  const translatedFocuses = context.focus_areas.map(f => focusMap[f] || f);

  return (
    <div className="p-3 text-sm bg-stone-900 border border-amber-800/50 rounded-lg text-amber-200">
      Deze lezing is speciaal afgestemd op jouw focus op: <strong>{translatedFocuses.join(', ')}</strong>.
    </div>
  );
};

export default PersonalizationNotice;