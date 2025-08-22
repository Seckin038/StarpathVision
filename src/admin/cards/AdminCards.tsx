import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, UploadCloud, CheckCircle, XCircle, Database } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useTranslation } from "react-i18next";

type TarotCard = {
  id: string;
  name: string;
  number: number;
  arcana: string;
  suit: string | null;
  image_url: string | null;
  meaning_up: string | null;
  meaning_rev: string | null;
  keywords: string[] | null;
};

export default function AdminCards() {
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TarotCard | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const { t } = useTranslation();

  const fetchCards = async () => {
    setLoading(true);
    const { data } = await supabase.from("tarot_cards").select("*").order("number");
    setCards((data || []) as TarotCard[]);
    setLoading(false);
  };
  useEffect(() => { fetchCards(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    const { id, ...updates } = editing;
    const { error } = await supabase.from("tarot_cards").update(updates).eq("id", id);
    if (error) {
      showError(`Opslaan mislukt: ${error.message}`);
    } else {
      showSuccess(`${editing.name} opgeslagen.`);
      setEditing(null);
      fetchCards();
    }
  };

  const handleSeed = async () => {
    if (!window.confirm("Weet je zeker dat je de 78 basis tarotkaarten wilt importeren? Dit zal bestaande kaarten met dezelfde ID updaten en kan niet ongedaan worden gemaakt.")) return;
    setIsSeeding(true);
    const toastId = showLoading("Bezig met importeren van 78 basiskaarten...");
    const { error } = await supabase.functions.invoke("seed-tarot-cards");
    dismissToast(toastId);
    if (error) {
      showError(`Importeren mislukt: ${error.message}`);
    } else {
      showSuccess("78 kaarten succesvol geïmporteerd/geüpdatet.");
      fetchCards();
    }
    setIsSeeding(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-200">{t('admin.cards.step1Title')}</CardTitle>
          <CardDescription>{t('admin.cards.step1Desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed} disabled={isSeeding}>
            {isSeeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
            {t('admin.cards.importDataBtn')}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-200">{t('admin.cards.step2Title')}</CardTitle>
          <CardDescription>{t('admin.cards.step2Desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FileImporter onDone={fetchCards} />
        </CardContent>
      </Card>

      <h2 className="text-xl font-serif text-stone-300">{t('admin.cards.step3Title')}</h2>
      <p className="text-stone-400 -mt-4">{t('admin.cards.step3Desc')}</p>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cards.map(c => (
            <Card 
              key={c.id} 
              className="bg-stone-950/50 border-stone-800 cursor-pointer hover:border-amber-700 transition-colors"
              onClick={() => setEditing(c)}
            >
              <CardHeader className="p-3"><CardTitle className="text-amber-300 text-sm truncate">{c.name}</CardTitle></CardHeader>
              <CardContent className="p-3">
                <img src={c.image_url || "/tarot/back.svg"} className="w-full aspect-[2/3] object-cover rounded-md bg-stone-900 mb-2" />
                <div className="text-[11px] text-stone-400">{c.image_url ? "✔ afbeelding gekoppeld" : "• nog geen afbeelding"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(isOpen) => !isOpen && setEditing(null)}>
        <DialogContent className="max-w-3xl bg-stone-950 border-stone-800 text-stone-200">
          <DialogHeader>
            <DialogTitle className="text-amber-200">{t('admin.cards.editTitle', { name: editing?.name })}</DialogTitle>
            <DialogDescription>{t('admin.cards.editDesc')}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-3 gap-6 py-4">
              <div className="col-span-1">
                <img src={editing.image_url || "/tarot/back.svg"} className="w-full aspect-[2/3] object-cover rounded-md bg-stone-900" />
              </div>
              <div className="col-span-2 space-y-4">
                <div>
                  <Label htmlFor="name">{t('admin.cards.name')}</Label>
                  <Input id="name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="meaning_up">{t('admin.cards.meaningUp')}</Label>
                  <Textarea id="meaning_up" rows={4} value={editing.meaning_up || ""} onChange={e => setEditing({ ...editing, meaning_up: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="meaning_rev">{t('admin.cards.meaningRev')}</Label>
                  <Textarea id="meaning_rev" rows={4} value={editing.meaning_rev || ""} onChange={e => setEditing({ ...editing, meaning_rev: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="keywords">{t('admin.cards.keywords')}</Label>
                  <Input id="keywords" value={(editing.keywords || []).join(", ")} onChange={e => setEditing({ ...editing, keywords: e.target.value.split(",").map(k => k.trim()) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type RowStatus = "pending" | "uploading" | "processing" | "ok" | "err";
type Row = { name: string; status: RowStatus; note?: string };

function FileImporter({ onDone }: { onDone: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileSelection = async (files: FileList | null) => {
    if (!files || !files.length) return;
    
    const initialRows = Array.from(files).map(f => ({ name: f.name, status: "pending" as const }));
    setRows(initialRows);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const updateRow = (status: RowStatus, note?: string) => {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status, note } : r));
      };

      try {
        updateRow("uploading", "Bezig met uploaden...");
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${crypto.randomUUID()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('tarot-card-uploads')
          .upload(filePath, file);

        if (uploadError) throw new Error(`Upload mislukt: ${uploadError.message}`);

        updateRow("processing", "AI analyse gestart...");

        // Manual fetch instead of invoke for robustness
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("Kon gebruikerssessie niet ophalen.");

        const SUPABASE_URL = "https://dmsrsgecdvoswxopylfm.supabase.co";
        const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc3JzZ2VjZHZvc3d4b3B5bGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODg2NTMsImV4cCI6MjA3MTA2NDY1M30._S7NgAKdoVNZSYx6kcJhRrRbUuxXPrR0bdKqHCjOjxk";

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/process-tarot-upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': ANON_KEY
            },
            body: JSON.stringify({ filePath }),
          }
        );

        if (!response.ok) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
            const errorBody = await response.json();
            errorMsg = errorBody.error || errorBody.details || errorMsg;
          } catch (e) { /* Ignore if response is not JSON */ }
          throw new Error(`Verwerking mislukt: ${errorMsg}`);
        }

        updateRow("ok", "Succesvol verwerkt!");

      } catch (err) {
        updateRow("err", err instanceof Error ? err.message : "Onbekende fout");
      }
    }
    onDone();
  };

  return (
    <div className="space-y-3 pt-4">
      <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileSelection(e.target.files)} />
      <Button onClick={() => inputRef.current?.click()}><UploadCloud className="h-4 w-4 mr-2" /> {t('admin.cards.chooseFiles')}</Button>

      {rows.length > 0 && (
        <div className="border border-stone-800 rounded-md p-2 max-h-64 overflow-auto text-sm">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              {r.status === "pending" && <Loader2 className="h-4 w-4 text-stone-500 animate-pulse" />}
              {r.status === "uploading" && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
              {r.status === "processing" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
              {r.status === "ok" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {r.status === "err" && <XCircle className="h-4 w-4 text-red-500" />}
              <span className="flex-1 truncate">{r.name}</span>
              <span className="text-stone-400">{r.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}