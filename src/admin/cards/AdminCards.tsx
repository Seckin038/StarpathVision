import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2 } from "lucide-react";

type TarotCard = {
  id: string;
  name: string;
  meaning_up: string;
  meaning_rev: string;
  image_url: string;
  // Add other fields as needed
};

export default function AdminCards() {
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TarotCard | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tarot_cards").select("*").order("number");
    if (error) {
      showError("Kon tarotkaarten niet laden.");
    } else {
      setCards(data as TarotCard[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    const { error } = await supabase.from("tarot_cards").update({
      name: editing.name,
      meaning_up: editing.meaning_up,
      meaning_rev: editing.meaning_rev,
      image_url: editing.image_url,
    }).eq("id", editing.id);

    if (error) {
      showError(`Opslaan mislukt: ${error.message}`);
    } else {
      showSuccess("Kaart opgeslagen.");
      setEditing(null);
      fetchCards();
    }
  };

  if (loading && !editing) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-amber-400" /></div>;
  }

  if (editing) {
    return (
      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-200">Bewerk: {editing.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="card-name">Naam</Label>
            <Input id="card-name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="card-image-url">Afbeelding URL</Label>
            <Input id="card-image-url" value={editing.image_url} onChange={e => setEditing({ ...editing, image_url: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="card-meaning-up">Betekenis (rechtop)</Label>
            <Textarea id="card-meaning-up" value={editing.meaning_up} onChange={e => setEditing({ ...editing, meaning_up: e.target.value })} rows={4} />
          </div>
          <div>
            <Label htmlFor="card-meaning-rev">Betekenis (omgekeerd)</Label>
            <Textarea id="card-meaning-rev" value={editing.meaning_rev} onChange={e => setEditing({ ...editing, meaning_rev: e.target.value })} rows={4} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Opslaan</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuleren</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader><CardTitle className="text-amber-200">Tarotkaarten Beheren</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <Card key={card.id} className="bg-stone-950/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-amber-300 text-base">{card.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={card.image_url || '/tarot/back.svg'} alt={card.name} className="w-full rounded-md mb-4" />
                <Button variant="outline" className="w-full" onClick={() => setEditing(card)}>Bewerken</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}