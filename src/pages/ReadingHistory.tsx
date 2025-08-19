import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Coffee, Calendar, User } from "lucide-react";

const ReadingHistory = () => {
  const [readings, setReadings] = useState<any[]>([]);

  // In a real app, this would come from Supabase
  useEffect(() => {
    // Mock data
    const mockReadings = [
      {
        id: 1,
        date: "2023-06-15",
        persona: "Falya",
        symbols: ["EILAND", "BOOM", "VLAM"],
        reading: "Je staat op het punt een onverwachte kans te krijgen. Een nieuwe fase in je leven begint zich voor te doen, symbolized door de boom die lang leven belooft. Een grote liefde wacht op je, maar wees geduldig."
      },
      {
        id: 2,
        date: "2023-05-22",
        persona: "Selvara",
        symbols: ["GEZIN", "SCHORPIOEN", "GIERVOGEL"],
        reading: "Blij nieuws komt je kant op, mogelijk gerelateerd aan je gezin. Wees alert op mensen in je omgeving die niet zijn wie ze lijken. Vermijd financiële risico's op dit moment."
      }
    ];
    setReadings(mockReadings);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-amber-900">Mijn Lezingen</h1>
          <Button variant="outline" className="flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Nieuwe lezing
          </Button>
        </div>

        {readings.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <Coffee className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="font-semibold text-amber-900 mb-2">Nog geen lezingen</h3>
              <p className="text-amber-700 mb-4">
                Je hebt nog geen koffielezingen ontvangen. Begin met je eerste lezing!
              </p>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Koffielezing starten
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="space-y-4 pb-4">
              {readings.map((reading) => (
                <Card key={reading.id} className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-amber-900 flex items-center gap-2">
                          <Coffee className="h-5 w-5" />
                          Lezing van {reading.date}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <User className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-700">{reading.persona}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Calendar className="h-3 w-3 mr-1" />
                        {reading.date}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold text-amber-900 mb-2">Geselecteerde symbolen:</h4>
                      <div className="flex flex-wrap gap-2">
                        {reading.symbols.map((symbol: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-amber-700 border-amber-300">
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2">Lezing:</h4>
                      <p className="text-amber-800 whitespace-pre-line">{reading.reading}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default ReadingHistory;