import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coffee, 
  Sparkles, 
  Star, 
  BookOpen, 
  User, 
  Heart, 
  Eye,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const userPreferences = {
    name: "Zoeker",
    interests: ["Tarot", "Koffiedik", "Numerologie"],
    preferredPersona: "Falya"
  };

  const quickActions = [
    { 
      title: "Kaart van de Dag", 
      icon: <Sparkles className="h-5 w-5 text-purple-400" />,
      path: "/readings/tarot/daily",
    },
    { 
      title: "Koffielezing", 
      icon: <Coffee className="h-5 w-5 text-amber-400" />,
      path: "/readings/coffee",
    },
    { 
      title: "Numerologie", 
      icon: <Star className="h-5 w-5 text-blue-400" />,
      path: "/readings/numerology",
    },
    { 
      title: "Droomduiding", 
      icon: <Eye className="h-5 w-5 text-indigo-400" />,
      path: "/readings/dream",
    }
  ];

  const recentReadings = [
    { id: 1, title: "Dagkaart - 15 juni", type: "Tarot", persona: "Falya", date: "2023-06-15" },
    { id: 2, title: "Levenspad Numerologie", type: "Numerologie", persona: "Selvara", date: "2023-06-10" },
    { id: 3, title: "Koffielezing", type: "Koffiedik", persona: "Falya", date: "2023-06-05" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-black to-stone-950 text-stone-200 p-4 font-serif">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-amber-200 tracking-wider">Welkom terug, {userPreferences.name}</h1>
            <p className="text-stone-400">Wat wil je vandaag ontdekken?</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-amber-300 border-amber-700">
              <Zap className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
              <CardHeader>
                <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5" />
                  Energie van de Dag
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
                <Button variant="outline" className="w-full mt-6 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
                  Lees meer
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
              <CardHeader>
                <CardTitle className="text-amber-300 flex items-center gap-2 text-xl">
                  <Heart className="h-5 w-5" />
                  Persoonlijke Inzichten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-stone-400">Levenspad</span><Badge variant="outline" className="text-stone-300 border-stone-700">7</Badge></div>
                  <div className="flex items-center justify-between"><span className="text-stone-400">Bestemmingsgetal</span><Badge variant="outline" className="text-stone-300 border-stone-700">3</Badge></div>
                  <div className="flex items-center justify-between"><span className="text-stone-400">Zielsverlangen</span><Badge variant="outline" className="text-stone-300 border-stone-700">5</Badge></div>
                </div>
                <Button variant="outline" className="w-full mt-6 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
                  Bekijk volledige numerologie
                </Button>
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
                      <div className="p-4 rounded-full mb-4 bg-stone-800/50 border border-stone-700 group-hover:border-amber-700 transition-all">
                        {action.icon}
                      </div>
                      <h3 className="font-bold text-stone-200 text-lg">{action.title}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-amber-200 tracking-wider">Recente Lezingen</h2>
              <Link to="/archive">
                <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
                  Bekijk alles
                </Button>
              </Link>
            </div>
            <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
              <CardContent className="p-0">
                {recentReadings.map((reading, index) => (
                  <div key={reading.id}>
                    {index > 0 && <Separator className="bg-stone-800" />}
                    <div className="p-4 hover:bg-stone-800/50 transition-colors flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-stone-200">{reading.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-stone-300 border-stone-700 text-xs">{reading.type}</Badge>
                          <span className="text-xs text-stone-400 flex items-center"><User className="h-3 w-3 mr-1" />{reading.persona}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-stone-400">{reading.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;