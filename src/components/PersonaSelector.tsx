import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PersonaBadge } from '@/components/PersonaBadge';
import { PersonaPicker, ReadingMethod } from '@/components/PersonaPicker';

type PersonaSelectorProps = {
  method: ReadingMethod;
};

export default function PersonaSelector({ method }: PersonaSelectorProps) {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <div className="flex justify-center items-center gap-4 mb-6 text-center text-stone-300">
        <p>{t('tarotReading.chooseSeer')}</p>
        <PersonaBadge onClick={() => setShowPicker(true)} />
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowPicker(false)}>
          <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-stone-950 p-6 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-serif text-amber-200">{t('personaPicker.title')}</h3>
                <p className="text-stone-400 mt-1">{t('personaPicker.subtitle')}</p>
              </div>
              <button onClick={() => setShowPicker(false)} className="text-stone-400 hover:text-amber-300 transition-colors flex-shrink-0 ml-4">
                {t('common.close')}
              </button>
            </div>
            <PersonaPicker method={method} onPicked={() => setShowPicker(false)} />
          </div>
        </div>
      )}
    </>
  );
}