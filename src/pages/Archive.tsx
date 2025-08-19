import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Coffee, 
  Sparkles, 
  Star, 
  Calendar, 
  User, 
  Search,
  Filter,
  Download,
  Trash2,
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";

const Archive = () => {
  const [readings, setReadings] = useState<any[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");

  // In a real app, this would come from Supabase
  useEffect(() => {
    // Mock data
    const mockReadings = [
      {
        id: 1,
        date: "2023-06-15",
        method: "Tarot",
        persona: "Falya",
        title: "Dagkaart - De Waag",
        symbols: ["De Waag"],
        reading: "Je staat op het punt een belangrijke beslissing te nemen. De Waag wijst op evenwicht en rechtvaardigheid. Vertrouw op je intuïtie bij deze keuze."
      },
      {
        id: 2,
        date: "2023-06-10",
        method: "Numerologie",
        persona: "Selvara",
        title: "Levenspad 7",
        symbols: ["7"],
        reading: "Je Levenspad 7 wijst op een spirituele reis en innerlijke wijsheid. Dit is een tijd voor introspectie en zelfontdekking."
      },
      {
        id: 3,
        date: "2023-06-05",
        method: "Koffiedik",
        persona: "Falya",
        title: "Koffielezing",
        symbols: ["EILAND", "BOOM", "VLAM"],
        reading: "Je staat op het punt een onverwachte kans te krijgen. Een nieuwe fase in je leven begint zich voor te doen, symbolized door de boom die lang leven belooft. Een grote liefde wacht op je, maar wees geduldig."
      },
      {
        id: 4,
        date: "2023-05-28",
        method: "Droomduiding",
        persona: "Lyara",
        title: "Droom van Vliegen",
        symbols: ["Vliegen", "Lucht"],
        reading: "Dromen over vliegen wijzen op vrijheid en loslaten. Je voelt je beperkt in je huidige situatie en verlangt naar meer autonomie."
      },
      {
        id: 5,
        date: "2023-05-22",
        method: "Tarot",
        persona: "Selvara",
        title: "Verleden-Heden-Toekomst",
        symbols: ["De Gek", "De Ster", "De Keizer"],
        reading: "Je verleden was een tijd van avontuur en nieuwe beginnens. Het heden brengt hoop en inspiratie. De toekomst belooft stabiliteit en autoriteit."
      }
    ];
    setReadings(mockReadings);
    setFilteredReadings(mockReadings);
  }, []);

  useEffect(() => {
    let result = readings;
    
    if (searchTerm) {
      result = result.filter(reading => 
        reading.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reading.persona.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reading.symbols.some((symbol: string) => 
          symbol.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    if (filterMethod !== "all") {
      result = result.filter(reading => reading.method === filterMethod);
    }
    
    setFilteredReadings(result);
  }, [searchTerm, filterMethod, readings]);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "Tarot": return "bg-purple-100 text-purple-800";
      case "Numerologie": return "bg-blue-100 text-blue-800";
      case "Koffiedik": return "bg-amber-100 text-amber-800";
      case "Droomduiding": return "bg-indigo-100 text-indigo-800";
      case "Aura/Chakra": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const exportReading = (id: number) => {
    // In a real app, this would generate a PDF
    alert(`Exporteren van lezing ${id} als PDF...`);
  };

  const deleteReading = (id: number) => {
    if (window.confirm("Weet je zeker dat je deze lezing wilt verwijderen?")) {
      setReadings(readings.filter(reading => reading.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
              <ChevronLeft className="h-4 w-4" />
              Terug naar dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-amber-900">Mijn Lezingen</h1>
          <div className="w-32 flex justify-end">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-amber-200">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Lezing Geschiedenis
              </CardTitle>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                  <Input
                    placeholder="Zoek lezingen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-amber-300 focus:ring-amber-500"
                  />
                </div>
                
                <div>
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="border border-amber-300 rounded-md px-3 py-2 text-amber-900 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="all">Alle methodes</option>
                    <option value="Tarot">Tarot</option>
                    <option value="Numerologie">Numerologie</option>
                    <option value="Koffiedik">Koffiedik</option>
                    <option value="Droomduiding">Droomduiding</option>
                    <option value="Aura/Chakra">Aura/Chakra</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReadings.length === 0 ? (
              <div className="text-center py-12">
                <Coffee className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                <h3 className="font-semibold text-amber-900 mb-2">Geen lezingen gevonden</h3>
                <p className="text-amber-700 mb-4">
                  Er zijn geen lezingen die voldoen aan je zoekcriteria.
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterMethod("all");
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-4 pb-4">
                  {filteredReadings.map((reading) => (
                    <Card key={reading.id} className="bg-white/80 backdrop-blur-sm border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-amber-900">{reading.title}</h3>
                              <Badge variant="secondary" className={getMethodColor(reading.method)}>
                                {reading.method}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-amber-700 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{reading.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{reading.persona}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {reading.symbols.map((symbol: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-amber-700 border-amber-300">
                                  {symbol}
                                </Badge>
                              ))}
                            </div>
                            
                            <p className="text-amber-800 text-sm line-clamp-2">
                              {reading.reading}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => exportReading(reading.id)}
                              className="border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteReading(reading.id)}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Archive;