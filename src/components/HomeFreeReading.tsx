import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const HomeFreeReading = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16">
      <Card className="bg-gradient-to-br from-amber-900/20 via-stone-900/50 to-stone-950 border-amber-800/50">
        <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-serif text-amber-200">
              {t('freeReading.title', 'Probeer een Gratis Tarot Legging')}
            </h2>
            <p className="mt-2 text-stone-300 max-w-2xl">
              {t('freeReading.subtitle', 'Krijg direct inzicht in je verleden, heden en toekomst met onze populaire 3-kaart legging. Geen registratie nodig.')}
            </p>
          </div>
          <div className="md:ml-auto flex-shrink-0">
            <Button asChild size="lg" className="bg-amber-600 text-black hover:bg-amber-500 text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-900/50 transition-transform hover:scale-105">
              <Link to="/readings/tarot/spread/ppf-3">
                <Sparkles className="mr-2 h-5 w-5" />
                {t('freeReading.cta', 'Start Je Gratis Legging')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default HomeFreeReading;