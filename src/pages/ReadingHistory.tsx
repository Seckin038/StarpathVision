import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Coffee, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";

const ReadingHistory = () => {
  const [readings, setReadings] = useState<any[]>([]);

  useEffect(() => {
    const mockReadings = [
      { id: 1, date: "2023-06-15", persona: "Falya", symbols: ["EILAND", "BOOM", "VLAM"], reading: "Je staat op het punt een onverwachte kans te krijgen." },
      { id: 2, date: "2023-05-22", persona: "Selvara", symbols: ["GEZIN", "SCHORPIOEN"], reading: "Blij nieuws komt je kant op, mogelijk gerelateerd aan je gezin." }
    ];
    setReadings(mockReadings);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-black to-stone-950 text-stone-200 p-4 font-serif">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-amber-200 tracking-wider">Mijn Lezingen</h1>
          <Link to="/readings/coffee">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <Coffee className="h-4 w-4" />
              Nieuwe lezing
            </Button>
          </Link>
        </div>

        {readings.length === 0 ? (
          <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
            <CardContent className="pt-6 text-center">
              <Coffee className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="font-semibold text-amber-200 mb-2">Nog geen lezingen</h3>
              <p className="text-stone-400 mb-4">Je hebt nog geen koffielezingen ontvangen.</p>
              <Link to="/readings/coffee">
                <Button className="bg-amber-800 hover:bg-amber-700 text-stone-100">Koffielezing starten</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="space-y-4 pb-4">
              {readings.map((reading) => (
                <Card key={reading.id} className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-amber-300 flex items-center gap-2">
                          <Coffee className="h-5 w-5" />
                          Lezing van {reading.date}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-stone-400">
                          <User className="h-4 w-4" />
                          <span>{reading.persona}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-stone-300 border-stone-700">
                        <Calendar className="h-3 w-3 mr-1" />
                        {reading.date}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold text-amber-200 mb-2">Geselecteerde symbolen:</h4>
                      <div className="flex flex-wrap gap-2">
                        {reading.symbols.map((symbol: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-stone-300 border-stone-700">{symbol}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="bg-stone-900 p-4 rounded-lg border border-stone-800">
                      <h4 className="font-semibold text-amber-200 mb-2">Lezing:</h4>
                      <p className="text-stone-300 whitespace-pre-line">{reading.reading}</p>
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