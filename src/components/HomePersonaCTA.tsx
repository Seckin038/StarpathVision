import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, Wand2, ChevronRight, Users } from 'lucide-react'
import { usePersona } from '@/contexts/PersonaContext'
import { PersonaBadge } from '@/components/PersonaBadge'
import { PersonaPicker } from '@/components/PersonaPicker'
import { useTranslation } from 'react-i18next'

export default function HomePersonaCTA() {
  const nav = useNavigate()
  const [showPicker, setShowPicker] = React.useState(false)
  const { t } = useTranslation();

  const startThreeCard = () => nav('/readings/tarot/spread/ppf-3')

  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl md:text-3xl font-serif text-amber-200 flex items-center gap-3">
            <Sparkles className="h-6 w-6" /> {t('home.yourGuide')}
          </h2>
          <PersonaBadge onClick={() => setShowPicker(true)} />
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <p className="text-stone-300/90 max-w-3xl">
            {t('home.seerDescription')}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-600/40 bg-amber-500/10 px-4 py-2 text-amber-200 hover:bg-amber-500/20"
              aria-label={t('home.chooseSeer')}
            >
              <Users className="h-4 w-4" /> {t('home.chooseSeer')}
            </button>

            <Link to="/readings/tarot/spread/ppf-3">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600/90 px-5 py-2 text-black hover:bg-amber-500"
                aria-label={t('home.do3CardReading')}
              >
                <Wand2 className="h-4 w-4" /> {t('home.do3CardReading')} <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Modal Picker */}
        {showPicker && (
          <div className="fixed inset-0 z-20 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-stone-950 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif text-amber-200">{t('home.chooseSeer')}</h3>
                <button onClick={() => setShowPicker(false)} className="text-stone-300 hover:text-amber-200">{t('common.close')}</button>
              </div>
              <PersonaPicker method="tarot" onPicked={() => setShowPicker(false)} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}