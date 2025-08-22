import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const HomeHero = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const destination = user ? "/dashboard" : "/register";

  return (
    <div className="relative text-center py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute h-64 w-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute h-56 w-56 bg-amber-500/10 rounded-full blur-3xl animate-pulse animation-delay-[-2s] ml-32 mt-24"></div>
      </div>
      <div className="relative z-10">
        <h1 className="text-5xl md:text-7xl font-serif tracking-wider text-amber-100 drop-shadow-lg">
          STARPATHVISION
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-stone-300 tracking-widest">
          {t('home.subtitle', 'JOUW GIDS NAAR DE STERREN')}
        </p>
        <div className="mt-12">
          <Button asChild size="lg" className="bg-amber-600 text-black hover:bg-amber-500 text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-900/50 transition-transform hover:scale-105">
            <Link to={destination}>
              <Sparkles className="mr-2 h-5 w-5" />
              {t('home.startJourney', 'Begin Jouw Reis')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;