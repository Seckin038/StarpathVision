import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Loader2, UploadCloud, CheckCircle, XCircle } from "lucide-react";

type TarotCard = {
  id: string;
  name: string;
  number: number;
  arcana: string;
  suit: string | null;
  meaning_up: string;
  meaning_rev: string;
  image_url: string | null;
};

type UploadStatus = {
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message: string;
};

function SmartUploader({ onComplete }: { onComplete: () => void }) {
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadQueue(files);
      setUploadStatus(files.map(f => ({ fileName: f.name, status: 'pending', message: 'In de wachtrij' })));
    }
  };

  const startUpload = async () => {
    if (uploadQueue.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < uploadQueue.length; i++) {
      const file = uploadQueue[i];
      
      setUploadStatus(prev => {
        const next = [...prev];
        next[i] = { ...next[i], status: 'uploading', message: 'Bezig met uploaden en herkennen...' };
        return next;
      });

      try {
        const formData = new FormData();
        formData.append('cardImage', file);

        const { data, error } = await supabase.functions.invoke('identify-and-link-tarot-card', {
          body: formData,
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.details);

        setUploadStatus(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: 'success', message: `Herkend als: ${data.cardName}` };
          return next;
        });

      } catch (err: any) {
        setUploadStatus(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: 'error', message: err.message };
          return next;
        });
      }
    }

    setIsUploading(false);
    onComplete();
  };

  return (
    <Card className="bg-stone-950/50 border-stone-800">
      <CardHeader>
        <CardTitle className="text-amber-300 flex items-center gap-2">
          <UploadCloud /> Slimme Kaart Uploader
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-stone-400">Selecteer één of meerdere tarotkaart-afbeeldingen. De AI zal ze automatisch herkennen en koppelen.</p>
        <Input type="file" multiple accept="image/*" onChange={handleFileSelect} ref={fileInputRef} />
        
        {uploadStatus.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-stone-800 rounded-md">
            {uploadStatus.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {s.status === 'pending' && <Loader2 className="h-4 w-4 text-stone-500 animate-pulse" />}
                {s.status === 'uploading' && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
                {s.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {s.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                <span className="flex-1 truncate">{s.fileName}</span>
                <span className="text-stone-400">{s.message}</span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={startUpload} disabled={isUploading || uploadQueue.length === 0}>
          {isUploading ? 'Bezig...' : `Start Upload (${uploadQueue.length})`}
        </Button>
      </CardContent>
    </Card>
  );
}


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
        image_url: null, // Start with no image
      }));

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Afbeelding</Label>
              {editing.image_url ? 
                <img src={editing.image_url} alt={editing.name} className="w-full rounded-md my-2 border border-stone-700" />
                : <div className="w-full aspect-[2/3] bg-stone-800 rounded-md my-2 flex items-center justify-center text-stone-500">Geen afbeelding</div>
              }
              <p className="text-xs text-stone-400">Upload een nieuwe afbeelding via de 'Slimme Uploader'.</p>
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
            <Button onClick={handleSave}>Opslaan</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuleren</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-amber-200">Tarotkaarten Beheren</CardTitle>
          {cards.length === 0 && (
            <Button onClick={handleImport}>Importeer 78 Kaartgegevens</Button>
          )}
        </CardHeader>
        <CardContent>
          <SmartUploader onComplete={fetchCards} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {cards.map(card => (
          <Card key={card.id} className="bg-stone-950/50 border-stone-800">
            <CardHeader className="p-3">
              <CardTitle className="text-amber-300 text-sm truncate">{card.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <img src={card.image_url || '/tarot/back.svg'} alt={card.name} className="w-full rounded-md mb-3 aspect-[2/3] object-cover bg-stone-900" />
              <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing(card)}>Bewerk Tekst</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}