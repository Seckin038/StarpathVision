import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coffee, 
  Sparkles, 
  Star, 
  Calendar, 
  BookOpen, 
  User, 
  Heart, 
  Eye,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // In a real app, this would come from user preferences
  const userPreferences = {
    name: "Gebruiker",
    interests: ["Tarot", "Koffiedik", "Numerologie"],
    preferredPersona: "Falya"
  };

  const quickActions = [
    { 
      title: "Kaart van de Dag", 
      icon: <Sparkles className="h-5 w-5" />,
      path: "/readings/tarot/daily",
      color: "bg-purple-100 text-purple-800"
    },
    { 
      title: "Koffielezing", 
      icon: <Coffee className="h-5 w-5" />,
      path: "/readings/coffee",
      color: "bg-amber-100 text-amber-800"
    },
    { 
      title: "Numerologie", 
      icon: <Star className="h-5 w-5" />,
      path: "/readings/numerology",
      color: "bg-blue-100 text-blue-800"
    },
    { 
      title: "Droomduiding", 
      icon: <Eye className="h-5 w-5" />,
      path: "/readings/dream",
      color: "bg-indigo-100 text-indigo-800"
    }
  ];

  const recentReadings = [
    {
      id: 1,
      title: "Dagkaart - 15 juni",
      type: "Tarot",
      persona: "Falya",
      date: "2023-06-15"
    },
    {
      id: 2,
      title: "Levenspad Numerologie",
      type: "Numerologie",
      persona: "Selvara",
      date: "2023-06-10"
    },
    {
      id: 3,
      title: "Koffielezing",
      type: "Koffiedik",
      persona: "Falya",
      date: "2023-06-05"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Welkom terug, {userPreferences.name}!</h1>
            <p className="text-amber-700">Wat wil je vandaag ontdekken?</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Zap className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Energie van de Dag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-amber-900">De Waag</p>
                  <p className="text-amber-700">Evenwicht en beslissing</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <BookOpen className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <p className="mt-4 text-amber-800">
                Vandaag staat in het teken van balans. Vertrouw op je intuïtie bij belangrijke beslissingen.
              </p>
              <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white">
                Lees meer
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Persoonlijke Inzichten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-amber-700">Levenspad</span>
                  <Badge variant="outline" className="text-amber-700 border-amber-300">7</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-700">Destiny Number</span>
                  <Badge variant="outline" className="text-amber-700 border-amber-300">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-700">Soul Urge</span>
                  <Badge variant="outline" className="text-amber-700 border-amber-300">5</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 border-amber-300 text-amber-700 hover:bg-amber-50">
                Bekijk volledige numerologie
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">Snel Starten</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link to={action.path} key={index}>
                <Card className="bg-white/80 backdrop-blur-sm border-amber-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`p-3 rounded-full mb-3 ${action.color}`}>
                      {action.icon}
                    </div>
                    <h3 className="font-medium text-amber-900 text-sm">{action.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-amber-900">Recente Lezingen</h2>
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              Bekijk alles
            </Button>
          </div>
          
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
            <CardContent className="p-0">
              {recentReadings.map((reading, index) => (
                <>
                  {index > 0 && <Separator className="my-0" />}
                  <div key={reading.id} className="p-4 hover:bg-amber-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-amber-900">{reading.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                            {reading.type}
                          </Badge>
                          <span className="text-xs text-amber-600 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {reading.persona}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-amber-700">{reading.date}</p>
                        <Button variant="outline" size="sm" className="mt-2 text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50">
                          Bekijk
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;