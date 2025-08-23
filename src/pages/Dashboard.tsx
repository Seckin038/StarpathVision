import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Coffee, 
  Sparkles, 
  BookOpen, 
  Eye,
  Loader2,
  BookMarked,
  Star,
  Moon,
  Gem
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { useTarotDeck, TarotDeckCard } from "@/hooks/useTarotDeck";
import { useTranslation } from "react-i18next";
import { Locale } from "@/types/tarot";

type Reading = {
  id: string;
  title: string | null;
  method: string;
  created_at: string;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const locale = i18n.language as Locale;

  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [dailyCard, setDailyCard] = useState<TarotDeckCard | null>(null);

  const { deck, loading: deckLoading } = useTarotDeck(locale);

  useEffect(() => {
    if (deckLoading || deck.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const storageKey = 'dailyTarotCard';
    const storedCardJSON = localStorage.getItem(storageKey);
    let storedCardInfo = null;
    if (storedCardJSON) {
      try { storedCardInfo = JSON.parse(storedCardJSON); } catch (e) { /* ignore */ }
    }
    if (storedCardInfo && storedCardInfo.date === today && typeof storedCardInfo.cardIndex === 'number') {
      const cardData = deck[storedCardInfo.cardIndex];
      setDailyCard(cardData || null);
    } else {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const newCard = deck[randomIndex];
      setDailyCard(newCard);
      localStorage.setItem(storageKey, JSON.stringify({ cardIndex: randomIndex, date: today }));
    }
  }, [deck, deckLoading]);

  useEffect(() => {
    const fetchRecentReadings = async () => {
      if (!user) return;
      setLoadingReadings(true);
      const { data, error } = await supabase
        .from('readings')
        .select('id, title, method, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) {
        showError("Kon recente lezingen niet ophalen.");
      } else {
        setRecentReadings(data || []);
      }
      setLoadingReadings(false);
    };
    fetchRecentReadings();
  }, [user]);

  const choosePathActions = [
    { title: t("dashboard.path.3card"), icon: <Gem className="h-6 w-6 text-purple-400" />, path: "/readings/tarot/spread/ppf-3" },
    { title: t("dashboard.path.coffee"), icon: <Coffee className="h-6 w-6 text-amber-400" />, path: "/readings/coffee" },
    { title: t("dashboard.path.tarot"), icon: <BookOpen className="h-6 w-6 text-blue-400" />, path: "/readings/tarot" },
    { title: t("dashboard.path.dream"), icon: <Moon className="h-6 w-6 text-indigo-400" />, path: "/readings/dream" },
    { title: t("dashboard.path.numerology"), icon: <Star className="h-6 w-6 text-yellow-400" />, path: "/readings/numerology" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-amber-200 tracking-wider">{t('dashboard.welcomeMessage', { name: user?.email?.split('@')[0] || "Zoeker" })}</h1>
        <p className="text-stone-400">{t('dashboard.welcomeSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Card */}
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5" /> {t('dashboard.dailyCardTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {deckLoading || !dailyCard ? (
              <div className="flex items-center justify-center h-full min-h-[160px]"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : (
              <div className="flex items-center gap-6">
                <img src={(dailyCard as any).image_url || dailyCard.imageUrl || '/tarot/back.svg'} alt={dailyCard.name} className="w-24 h-auto rounded-lg border border-stone-700" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-stone-100">{dailyCard.name}</h3>
                  <p className="text-stone-400 mt-2 text-sm line-clamp-4">{dailyCard.meaning_up || t('dashboard.noMeaningAvailable')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Readings */}
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800 flex flex-col">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2 text-xl"><BookMarked className="h-5 w-5" /> {t('dashboard.recentReadingsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
            {loadingReadings ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : recentReadings.length === 0 ? (
              <p className="text-stone-400 text-center py-8 px-4">{t('dashboard.noReadings')}</p>
            ) : (
              recentReadings.map((reading) => (
                <div key={reading.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-900 border border-stone-800">
                  <div>
                    <h4 className="font-medium text-stone-200">{reading.title || reading.method}</h4>
                    <p className="text-sm text-stone-400 capitalize">{reading.method} - {new Date(reading.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  </div>
                  <Link to={`/reading/${reading.id}`}>
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700">
                      {t('dashboard.view')}
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
          {recentReadings.length > 0 && (
            <CardFooter className="p-4 mt-auto">
              <Link to="/archive" className="w-full">
                <Button variant="outline" className="w-full border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700">
                  {t('common.viewAll')}
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-amber-200 mb-6 text-center tracking-wider">{t('dashboard.choosePath')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {choosePathActions.map((action) => (
            <Link to={action.path} key={action.title}>
              <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800 hover:border-amber-700 transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-4 rounded-full mb-4 bg-stone-800/50 border border-stone-700 group-hover:border-amber-700 transition-all">{action.icon}</div>
                  <h3 className="font-bold text-stone-200 text-lg">{action.title}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;