import React from "react";
import TarotGridDisplay from "@/components/TarotGridDisplay";
import { Link } from "react-router-dom";
import MysticalBackground from "@/components/MysticalBackground";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function TarotDailyReadingPage() {
  const [picked, setPicked] = React.useState<number[]>([]);

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles+sigils" intensity="medium" />
      <div className="relative z-10 max-w-full px-4 lg:max-w-7xl lg:px-8 mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <ChevronLeft className="h-4 w-4" /> Terug
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-serif tracking-wide text-amber-200">
              Drie Kaart Legging
            </h1>
            <p className="text-stone-400">
              Kies 3 kaarten die je aanspreken.
            </p>
          </div>
          <div className="w-32"></div>
        </header>

        <main>
          <TarotGridDisplay
            totalCards={78}
            rows={6}
            cols={13}
            maxSelect={3}
            selected={picked}
            onChange={setPicked}
          />

          <div className="mt-8 flex justify-center">
            <Button
              disabled={picked.length !== 3}
              className="bg-amber-700 hover:bg-amber-600 text-white text-lg px-8 py-6 disabled:opacity-40"
              onClick={() => {
                alert(`Gekozen kaarten: ${picked.map((x) => x + 1).join(", ")}`);
              }}
            >
              ✨ Onthul mijn lezing ( {picked.length}/3 )
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}