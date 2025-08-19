import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Coffee, 
  Sparkles, 
  Calendar, 
  User, 
  Search,
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

  useEffect(() => {
    const mockReadings = [
      { id: 1, date: "2023-06-15", method: "Tarot", persona: "Falya", title: "Dagkaart - De Waag", symbols: ["De Waag"], reading: "Je staat op het punt een belangrijke beslissing te nemen." },
      { id: 2, date: "2023-06-10", method: "Numerologie", persona: "Selvara", title: "Levenspad 7", symbols: ["7"], reading: "Je Levenspad 7 wijst op een spirituele reis." },
      { id: 3, date: "2023-06-05", method: "Koffiedik", persona: "Falya", title: "Koffielezing", symbols: ["EILAND", "BOOM"], reading: "Je staat op het punt een onverwachte kans te krijgen." },
    ];
    setReadings(mockReadings);
  }, []);

  useEffect(() => {
    let result = readings;
    if (searchTerm) {
      result = result.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.persona.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterMethod !== "all") {
      result = result.filter(r => r.method === filterMethod);
    }
    setFilteredReadings(result);
  }, [searchTerm, filterMethod, readings]);

  const deleteReading = (id: number) => {
    if (window.confirm("Weet je zeker dat je deze lezing wilt verwijderen?")) {
      setReadings(readings.filter(r => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-black to-stone-950 text-stone-200 p-4 font-serif">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" />
              Terug
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-amber-200 tracking-wider">Mijn Lezingen</h1>
          <div className="w-32 flex justify-end">
            <Button variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Download className="h-4 w-4" /></Button>
          </div>
        </div>

        <Card className="mb-6 bg-stone-900/50 backdrop-blur-sm border-stone-800">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-amber-300 flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5" />Lezing Geschiedenis</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                  <Input placeholder="Zoek lezingen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-stone-900 border-stone-700 focus:ring-amber-500" />
                </div>
                <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="border border-stone-700 rounded-md px-3 py-2 bg-stone-900 text-stone-300 focus:ring-amber-500 focus:border-amber-500">
                  <option value="all">Alle methodes</option>
                  <option value="Tarot">Tarot</option>
                  <option value="Numerologie">Numerologie</option>
                  <option value="Koffiedik">Koffiedik</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReadings.length === 0 ? (
              <div className="text-center py-12">
                <Coffee className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="font-semibold text-amber-200 mb-2">Geen lezingen gevonden</h3>
                <p className="text-stone-400 mb-4">Er zijn geen lezingen die voldoen aan je zoekcriteria.</p>
                <Button onClick={() => { setSearchTerm(""); setFilterMethod("all"); }} className="bg-amber-800 hover:bg-amber-700 text-stone-100">Reset filters</Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4 pr-4">
                  {filteredReadings.map((reading) => (
                    <Card key={reading.id} className="bg-stone-900 border-stone-800">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-stone-200">{reading.title}</h3>
                              <Badge variant="outline" className="text-stone-300 border-stone-700">{reading.method}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-stone-400 mb-3">
                              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{reading.date}</span></div>
                              <div className="flex items-center gap-1"><User className="h-4 w-4" /><span>{reading.persona}</span></div>
                            </div>
                            <p className="text-stone-300 text-sm line-clamp-2">{reading.reading}</p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button variant="outline" size="sm" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Download className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => deleteReading(reading.id)} className="border-red-900/50 text-red-400 hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></Button>
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