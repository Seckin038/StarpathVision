import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Loader2, UploadCloud } from "lucide-react";
import { uploadTarotCardImage } from "@/lib/upload";

type TarotCard = {
  id: string;
  name: string;
  number: number;
  arcana: string;
  suit: string | null;
  meaning_up: string;
  meaning_rev: string;
  image_url: string | null;
  // Add other fields as needed
};

export default function AdminCards() {
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TarotCard | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleImport = async () => {
    if (!window.confirm("Weet je zeker dat je de 78 tarotkaarten wilt importeren vanuit de lokale JSON-bestanden? Bestaande kaarten worden overschreven.")) return;
    
    const toastId = showLoading("Bezig met importeren...");
    try {
      const res = await fetch('/tarot/cards.nl.json');
      const nlCards = await res.json();

      const cardsToInsert = nlCards.map((card: any) => ({
        id: card.id,
        number: card.number,
        name: card.name,
        arcana: card.arcana,
        suit: card.suit,
        meaning_up: card.meaning_up,
        meaning_rev: card.meaning_rev,
        keywords: card.keywords,
        element: card.element,
        astrology: card.astrology,
        numerology: card.numerology,
        image_url: `/tarot/${card.image}`, // Tijdelijke URL
      }));

      // Upsert all cards in one go
      const { error } = await supabase.from("tarot_cards").upsert(cardsToInsert, { onConflict: 'id' });

      if (error) throw error;

      dismissToast(toastId);
      showSuccess("78 kaarten succesvol geïmporteerd in de database!");
      fetchCards();
    } catch (err: any) {
      dismissToast(toastId);
      showError(`Import mislukt: ${err.message}`);
    }
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editing) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const publicUrl = await uploadTarotCardImage(file, editing.id);
      setEditing({ ...editing, image_url: publicUrl });
      showSuccess("Afbeelding geüpload!");
    } catch (err: any) {
      showError(`Upload mislukt: ${err.message}`);
    } finally {
      setUploading(false);
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Afbeelding</Label>
              {editing.image_url && <img src={editing.image_url} alt={editing.name} className="w-full rounded-md my-2 border border-stone-700" />}
              <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <div className="text-sm text-stone-400 mt-1 flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Bezig met uploaden...</div>}
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="card-name">Naam</Label>
                <Input id="card-name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="card-meaning-up">Betekenis (rechtop)</Label>
                <Textarea id="card-meaning-up" value={editing.meaning_up} onChange={e => setEditing({ ...editing, meaning_up: e.target.value })} rows={6} />
              </div>
              <div>
                <Label htmlFor="card-meaning-rev">Betekenis (omgekeerd)</Label>
                <Textarea id="card-meaning-rev" value={editing.meaning_rev} onChange={e => setEditing({ ...editing, meaning_rev: e.target.value })} rows={6} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={uploading}>Opslaan</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuleren</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-amber-200">Tarotkaarten Beheren</CardTitle>
        {cards.length === 0 && (
          <Button onClick={handleImport}>Importeer 78 Kaarten</Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cards.map(card => (
            <Card key={card.id} className="bg-stone-950/50 border-stone-800">
              <CardHeader className="p-3">
                <CardTitle className="text-amber-300 text-sm">{card.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <img src={card.image_url || '/tarot/back.svg'} alt={card.name} className="w-full rounded-md mb-3 aspect-[2/3] object-cover bg-stone-900" />
                <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing(card)}>Bewerken</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}