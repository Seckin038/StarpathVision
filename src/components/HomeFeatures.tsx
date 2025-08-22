import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Coffee, Eye, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: <BookOpen className="h-8 w-8 text-blue-400" />,
    titleKey: "features.tarot.title",
    descriptionKey: "features.tarot.description",
    badgeKey: "features.tarot.badge",
  },
  {
    icon: <Coffee className="h-8 w-8 text-amber-400" />,
    titleKey: "features.coffee.title",
    descriptionKey: "features.coffee.description",
  },
  {
    icon: <Eye className="h-8 w-8 text-indigo-400" />,
    titleKey: "features.dream.title",
    descriptionKey: "features.dream.description",
  },
  {
    icon: <Star className="h-8 w-8 text-yellow-400" />,
    titleKey: "features.numerology.title",
    descriptionKey: "features.numerology.description",
  },
];

const HomeFeatures = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-serif text-amber-200">
          {t('features.title', 'Ontdek de Werelden Binnenin')}
        </h2>
        <p className="mt-2 text-stone-400 max-w-2xl mx-auto">
          {t('features.subtitle', 'Na registratie krijg je toegang tot een reeks mystieke tools om je pad te verlichten. Ontdek wat de sterren voor jou in petto hebben.')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="bg-stone-900/50 backdrop-blur-sm border-stone-800 text-center hover:border-amber-700 transition-all">
            <CardHeader>
              <div className="mx-auto bg-stone-800/50 border border-stone-700 rounded-full p-4 w-fit mb-4">
                {feature.icon}
              </div>
              <CardTitle className="text-amber-300">{t(feature.titleKey)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-400 text-sm mb-4 h-24">{t(feature.descriptionKey)}</p>
              {feature.badgeKey && <Badge variant="outline" className="border-emerald-700 text-emerald-300">{t(feature.badgeKey)}</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default HomeFeatures;