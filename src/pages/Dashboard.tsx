import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coffee, 
  Sparkles, 
  BookOpen, 
  User, 
  Eye,
  Settings,
  Loader2,
  BookMarked
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
  const { user, signOut } = useAuth();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;

  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [dailyCard, setDailyCard] = useState<TarotDeckCard | null>(null);

  const { deck, loading: deckLoading } = useTarotDeck(locale);

  // Effect for Daily Card
  useEffect(() => {
    if (deckLoading || deck.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const storedCardJSON = localStorage.getItem('dailyTarotCard');
    let storedCard = null;
    if (storedCardJSON) {
      try { storedCard = JSON.parse(storedCardJSON); } catch (e) { /* ignore */ }
    }

    if (storedCard && storedCard.date === today) {
      const cardData = deck.find(c => c.id === storedCard.cardId);
      setDailyCard(cardData || null);
    } else {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const newCard = deck[randomIndex];
      setDailyCard(newCard);
      localStorage.setItem('dailyTarotCard', JSON.stringify({ cardId: newCard.id, date: today }));
    }
  }, [deck, deckLoading]);

  // Effect for Recent Readings
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

  const quickActions = [
    { title: "3-Kaart Legging", icon: <Sparkles className="h-5 w-5 text-purple-400" />, path: "/readings/tarot/spread/ppf-3" },
    { title: "Koffielezing", icon: <Coffee className="h-5 w-5 text-amber-400" />, path: "/readings/coffee" },
    { title: "Tarot Leggingen", icon: <BookOpen className="h-5 w-5 text-blue-400" />, path: "/readings/tarot" },
    { title: "Droomduiding", icon: <Eye className="h-5 w-5 text-indigo-400" />, path: "/readings/dream" }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-amber-200 tracking-wider">Welkom terug, {user?.email?.split('@')[0] || "Zoeker"}</h1>
          <p className="text-stone-400">Wat wil je vandaag ontdekken?</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminRoleSwitch />
          <Link to="/profile"><Button variant="outline" size="icon" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Settings className="h-4 w-4" /></Button></Link>
          <Button onClick={signOut} variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">Uitloggen</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5" /> Energie van de Dag</CardTitle>
          </CardHeader>
          <CardContent>
            {deckLoading || !dailyCard ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-stone-100">{dailyCard.name}</p>
                    <p className="text-stone-400">Jouw kaart voor vandaag</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded-full border border-stone-700">
                    <img src={dailyCard.imageUrl || '/tarot/back.svg'} alt={dailyCard.name} className="h-8 w-auto" />
                  </div>
                </div>
                <p className="mt-4 text-stone-300">{dailyCard.meaning_up}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2 text-xl"><BookMarked className="h-5 w-5" /> Recente Lezingen</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingReadings ? (
              <div className="flex justify-center items-center h-32"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : recentReadings.length === 0 ? (
              <p className="text-stone-400 text-center py-12">Je hebt nog geen lezingen gedaan.</p>
            ) : (
              recentReadings.map((reading, index) => (
                <Link to={`/reading/${reading.id}`} key={reading.id}>
                  {index > 0 && <Separator className="bg-stone-800" />}
                  <div className="p-4 hover:bg-stone-800/50 transition-colors flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-stone-200">{reading.title || reading.method}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-stone-300 border-stone-700 text-xs">{reading.method}</Badge>
                      </div>
                    </div>
                    <div className="text-right"><p className="text-sm text-stone-400">{new Date(reading.created_at).toLocaleDateString('nl-NL')}</p></div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold text-amber-200 mb-6 text-center tracking-wider">Kies Je Pad</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link to={action.path} key={index}>
              <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800 hover:border-amber-700 transition-all cursor-pointer group">
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