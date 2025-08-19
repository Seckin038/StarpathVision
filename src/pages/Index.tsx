import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Coffee, 
  Sparkles, 
  Star, 
  User, 
  Heart, 
  Eye,
  Zap,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const [language, setLanguage] = useState("nl-NL");

  const readingMethods = [
    { 
      title: "Tarot", 
      icon: <BookOpen className="h-6 w-6" />,
      description: "Kaartlezing voor inzicht in je toekomst",
      path: "/readings/tarot/daily",
      color: "bg-purple-900/50 text-purple-300"
    },
    { 
      title: "Koffiedik", 
      icon: <Coffee className="h-6 w-6" />,
      description: "Traditionele lezing uit koffiesymbolen",
      path: "/readings/coffee",
      color: "bg-amber-900/50 text-amber-300"
    },
    { 
      title: "Numerologie", 
      icon: <Star className="h-6 w-6" />,
      description: "Inzicht via je geboortedatum en naam",
      path: "/readings/numerology",
      color: "bg-blue-900/50 text-blue-300"
    },
    { 
      title: "Droomduiding", 
      icon: <Eye className="h-6 w-6" />,
      description: "Betekenis van je dromen ontdekken",
      path: "/readings/dream",
      color: "bg-indigo-900/50 text-indigo-300"
    }
  ];

  const languageOptions = [
    { code: "nl-NL", name: "Nederlands" },
    { code: "en-GB", name: "English" },
    { code: "tr-TR", name: "Türkçe" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-300">Starpath Vision</h1>
            <p className="text-purple-400">Ontdek je toekomst door de kunst van waarzeggen</p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-purple-900/50 border border-purple-700 rounded-md px-2 py-1 text-purple-300"
            >
              {languageOptions.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-gray-800">{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-black/30 backdrop-blur-sm border-purple-800">
            <CardHeader>
              <CardTitle className="text-purple-300 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Welkom bij Starpath Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-400 mb-4">
                Ontdek de geheimen van het universum door traditionele waarzegkunsten. 
                Onze ervaren lezers helpen je bij het vinden van antwoorden op je vragen.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-700">
                  <Zap className="h-3 w-3 mr-1" />
                  Authentic
                </Badge>
                <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-700">
                  <Heart className="h-3 w-3 mr-1" />
                  Spiritueel
                </Badge>
                <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-700">
                  <User className="h-3 w-3 mr-1" />
                  Persoonlijk
                </Badge>
              </div>
              <Link to="/onboarding">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Begin je reis
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-black/30 backdrop-blur-sm border-purple-800">
            <CardHeader>
              <CardTitle className="text-purple-300 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Tarot van de Dag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-purple-200">De Waag</p>
                  <p className="text-purple-400">Evenwicht en beslissing</p>
                </div>
                <div className="bg-purple-900/50 p-3 rounded-full">
                  <BookOpen className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <p className="mt-4 text-purple-400">
                Vandaag staat in het teken van balans. Vertrouw op je intuïtie bij belangrijke beslissingen.
              </p>
              <Link to="/readings/tarot/daily">
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                  Lees meer
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-purple-300 mb-4">Waarzegmethodes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {readingMethods.map((method, index) => (
              <Link to={method.path} key={index}>
                <Card className="bg-black/30 backdrop-blur-sm border-purple-800 hover:border-purple-600 transition-all cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`p-3 rounded-full mb-3 ${method.color}`}>
                      {method.icon}
                    </div>
                    <h3 className="font-medium text-purple-300 text-sm">{method.title}</h3>
                    <p className="text-xs text-purple-500 mt-1">{method.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <Card className="bg-black/30 backdrop-blur-sm border-purple-800 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-300 mb-2">Veelgestelde Vragen</h3>
              <div className="space-y-3 text-left">
                <div>
                  <p className="font-medium text-purple-300">Hoe werkt een tarotlezing?</p>
                  <p className="text-sm text-purple-400">
                    Onze lezers gebruiken traditionele tarotkaarten om inzicht te geven in je situatie. 
                    Elke kaart heeft een unieke betekenis die in relatie wordt gebracht tot jouw vraag.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-purple-300">Wat is koffiediklezen?</p>
                  <p className="text-sm text-purple-400">
                    Na het drinken van je koffie blijven er symbolen achter in de kop. 
                    Onze ervaren lezers interpreteren deze symbolen om inzicht te geven in jouw toekomst.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;