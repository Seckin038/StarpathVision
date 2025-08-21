import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Eye, Star, User, Calendar } from "lucide-react";

const ReadingInputSummary = ({ reading }: { reading: any }) => {
  const renderContent = () => {
    switch (reading.method) {
      case "koffiedik":
      case "coffee":
        return (
          <>
            <CardTitle className="text-amber-300 flex items-center gap-2"><Coffee className="h-5 w-5" /> Geselecteerde Symbolen</CardTitle>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {reading.payload?.symbols?.map((s: any) => (
                  <Badge key={s.symbol_name_nl} variant="outline">{s.symbol_name_nl}</Badge>
                ))}
              </div>
            </CardContent>
          </>
        );
      case "dromen":
      case "dream":
        return (
          <>
            <CardTitle className="text-amber-300 flex items-center gap-2"><Eye className="h-5 w-5" /> Jouw Droom</CardTitle>
            <CardContent className="pt-4">
              <blockquote className="border-l-2 border-stone-700 pl-4 italic text-stone-400">
                {reading.payload?.userQuestion}
              </blockquote>
            </CardContent>
          </>
        );
      case "numerologie":
      case "numerology":
        return (
          <>
            <CardTitle className="text-amber-300 flex items-center gap-2"><Star className="h-5 w-5" /> Jouw Gegevens</CardTitle>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-stone-500" /><span>{reading.payload?.numerologyData?.fullName}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-stone-500" /><span>{reading.payload?.numerologyData?.birthDate}</span></div>
            </CardContent>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
      <CardHeader>
        {renderContent()}
      </CardHeader>
    </Card>
  );
};

export default ReadingInputSummary;