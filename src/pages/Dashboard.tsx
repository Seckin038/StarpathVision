import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Coffee, 
  Sparkles, 
  BookOpen, 
  Eye,
  Settings,
  Loader2,
  BookMarked,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminRoleSwitch from "@/components/AdminRoleSwitch";
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

  const newReadingActions = [
    { title: t("dashboard.tarot.title"), description: t("dashboard.tarot.description"), icon: <BookOpen className="h-6 w-6 text-purple-400" />, path: "/readings/tarot" },
    { title: t("dashboard.coffee.title"), description: t("dashboard.coffee.description"), icon: <Coffee className="h-6 w-6 text-amber-400" />, path: "/readings/coffee" },
    { title: t("dashboard.dream.title"), description: t("dashboard.dream.description"), icon: <Eye className="h-6 w-6 text-indigo-400" />, path: "/readings/dream" },
    { title: t("dashboard.numerology.title"), description: t("dashboard.numerology.description"), icon: <Star className="h-6 w-6 text-cyan-400" />, path: "/readings/numerology" }
  ];

  const methodIcons: Record<string, React.ReactNode> = {
    tarot: <BookOpen className="h-5 w-5 text-purple-400" />,
    coffee: <Coffee className="h-5 w-5 text-amber-400" />,
    dream: <Eye className="h-5 w-5 text-indigo-400" />,
    numerology: <Star className="h-5 w-5 text-cyan-400" />,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-amber-200 tracking-wider">{t('dashboard.welcomeMessage', { name: user?.email?.split('@')[0] || "Zoeker" })}</h1>
          <p className="text-stone-400">{t('dashboard.welcomeSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminRoleSwitch />
          <Link to="/profile"><Button variant="outline" size="icon" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Settings className="h-4 w-4" /></Button></Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Card */}
          <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
            <CardHeader>
              <CardTitle className="text-amber-300 flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5" /> {t('dashboard.dailyCardTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {deckLoading || !dailyCard ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
              ) : (
                <div className="flex items-center gap-6">
                  <img src={dailyCard.imageUrl || '/tarot/back.svg'} alt={dailyCard.name} className="w-24 h-auto rounded-lg border border-stone-700" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-stone-100">{dailyCard.name}</h3>
                    <p className="text-stone-400 mt-2 text-sm line-clamp-3">{dailyCard.meaning_up}</p>
                    <Button variant="outline" className="mt-4 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">{t('dashboard.viewDetails')}</Button>
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
            <CardContent className="flex-grow">
              {loadingReadings ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
              ) : recentReadings.length === 0 ? (
                <p className="text-stone-400 text-center py-12 px-4">{t('dashboard.noReadings')}</p>
              ) : (
                <ul className="space-y-3">
                  {recentReadings.map((reading) => (
                    <li key={reading.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-900 border border-stone-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-stone-800 rounded-full">{methodIcons[reading.method] || <Sparkles className="h-5 w-5 text-stone-400" />}</div>
                        <div>
                          <h4 className="font-medium text-stone-200">{reading.title || reading.method}</h4>
                          <p className="text-sm text-stone-400">{new Date(reading.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <Link to={`/reading/${reading.id}`}>
                        <Button variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">Bekijk</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            {recentReadings.length > 0 && (
              <CardFooter className="p-4 mt-auto">
                <Link to="/archive" className="w-full">
                  <Button variant="ghost" className="w-full text-amber-300 hover:bg-stone-800 hover:text-amber-200">
                    {t('common.viewAll')}
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
            <CardHeader>
              <CardTitle className="text-amber-300 text-xl">{t('dashboard.startNewReadingTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {newReadingActions.map((action) => (
                  <Link to={action.path} key={action.title}>
                    <div className="p-4 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-700 transition-all cursor-pointer group h-full flex flex-col items-center text-center">
                      <div className="p-3 rounded-full mb-3 bg-stone-800 border border-stone-700 group-hover:border-amber-700 transition-all">{action.icon}</div>
                      <h4 className="font-bold text-stone-200 text-sm">{action.title}</h4>
                      <p className="text-xs text-stone-400 mt-1">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;