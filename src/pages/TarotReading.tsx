import TarotDeck from "@/components/TarotDeck";
import MysticalBackground from "@/components/MysticalBackground";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function TarotReadingPage() {
  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles+sigils" intensity="low" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
            <Link to="/dashboard">
                <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
                    <ChevronLeft className="h-4 w-4" /> Terug
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-serif tracking-wide text-amber-200">Tarot Lezing</h1>
                <p className="text-stone-400 text-right">Schud het lot en trek een kaart…</p>
            </div>
        </div>

        <TarotDeck locale="nl" maxVisible={28} />
      </div>
    </div>
  );
}