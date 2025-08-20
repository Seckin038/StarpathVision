import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Coffee, 
  Sparkles, 
  Star, 
  User, 
  Heart, 
  Eye,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";
import FancyButton from "@/components/FancyButton";
import Card3D from "@/components/Card3D";

const Index = () => {
  const { t } = useTranslation();

  const readingMethods = [
    { 
      title: t('tarot'), 
      icon: <BookOpen className="h-6 w-6 text-purple-400" />,
      description: t('tarot_desc'),
      path: "/readings/tarot",
    },
    { 
      title: t('coffee'), 
      icon: <Coffee className="h-6 w-6 text-amber-400" />,
      description: t('coffee_desc'),
      path: "/readings/coffee",
    },
    { 
      title: t('numerology'), 
      icon: <Star className="h-6 w-6 text-blue-400" />,
      description: t('numerology_desc'),
      path: "/readings/numerology",
    },
    { 
      title: t('dream'), 
      icon: <Eye className="h-6 w-6 text-indigo-400" />,
      description: t('dream_desc'),
      path: "/readings/dream",
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5" />
              {t('welcome_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-stone-300 mb-6">
              {t('welcome_text')}
            </p>
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="outline" className="text-stone-300 border-stone-700">
                <Zap className="h-3 w-3 mr-1" />
                Authentiek
              </Badge>
              <Badge variant="outline" className="text-stone-300 border-stone-700">
                <Heart className="h-3 w-3 mr-1" />
                Spiritueel
              </Badge>
              <Badge variant="outline" className="text-stone-300 border-stone-700">
                <User className="h-3 w-3 mr-1" />
                Persoonlijk
              </Badge>
            </div>
            <Link to="/register">
              <FancyButton className="w-full font-bold tracking-wider">
                {t('start_journey')}
              </FancyButton>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5" />
              Tarot van de Dag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-stone-100">De Waag</p>
                <p className="text-stone-400">Evenwicht en beslissing</p>
              </div>
              <div className="bg-stone-800/50 p-3 rounded-full border border-stone-700">
                <BookOpen className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <p className="mt-4 text-stone-300">
              Vandaag staat in het teken van balans. Vertrouw op je intuïtie bij belangrijke beslissingen.
            </p>
            <Link to="/readings/tarot/spread/ppf-3">
              <FancyButton className="w-full mt-6">
                Ontvang je lezing
              </FancyButton>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold text-amber-200 mb-6 text-center tracking-wider">{t('choose_path')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {readingMethods.map((method, index) => (
            <Link to={method.path} key={index}>
              <Card3D className="h-full">
                <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800 hover:border-amber-700 transition-all cursor-pointer group h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="p-4 rounded-full mb-4 bg-stone-800/50 border border-stone-700 group-hover:border-amber-700 transition-all">
                      {method.icon}
                    </div>
                    <h3 className="font-bold text-stone-200 text-lg">{method.title}</h3>
                    <p className="text-xs text-stone-400 mt-1">{method.description}</p>
                  </CardContent>
                </Card>
              </Card3D>
            </Link>
          ))}
        </div>
      </div>

      <footer className="text-center mt-12">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;