import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, UploadCloud, Link as LinkIcon, CheckCircle, XCircle } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

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

  return (
    <div className="space-y-6">
      {/* --- Bulk Importer --- */}
      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader><CardTitle className="text-amber-200">Tarotkaarten – Afbeeldingen importeren</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="files" className="w-full">
            <TabsList>
              <TabsTrigger value="files"><UploadCloud className="h-4 w-4 mr-1" /> Bestanden</TabsTrigger>
              <TabsTrigger value="urls"><LinkIcon className="h-4 w-4 mr-1" /> URL’s</TabsTrigger>
            </TabsList>
            <TabsContent value="files"><FileImporter onDone={fetchCards} /></TabsContent>
            <TabsContent value="urls"><UrlImporter onDone={fetchCards} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* --- Card Grid --- */}
      <h2 className="text-xl font-serif text-stone-300">Kaarten bewerken (klik op een kaart)</h2>
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

      {/* --- Editing Modal --- */}
      <Dialog open={!!editing} onOpenChange={(isOpen) => !isOpen && setEditing(null)}>
        <DialogContent className="max-w-3xl bg-stone-950 border-stone-800 text-stone-200">
          <DialogHeader>
            <DialogTitle className="text-amber-200">Bewerk: {editing?.name}</DialogTitle>
            <DialogDescription>
              Pas hier de teksten voor de kaart aan. De afbeelding kan je via de bulk-importer wijzigen.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-3 gap-6 py-4">
              <div className="col-span-1">
                <img src={editing.image_url || "/tarot/back.svg"} className="w-full aspect-[2/3] object-cover rounded-md bg-stone-900" />
              </div>
              <div className="col-span-2 space-y-4">
                <div>
                  <Label htmlFor="name">Naam</Label>
                  <Input id="name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="meaning_up">Betekenis (rechtop)</Label>
                  <Textarea id="meaning_up" rows={4} value={editing.meaning_up || ""} onChange={e => setEditing({ ...editing, meaning_up: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="meaning_rev">Betekenis (omgekeerd)</Label>
                  <Textarea id="meaning_rev" rows={4} value={editing.meaning_rev || ""} onChange={e => setEditing({ ...editing, meaning_rev: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="keywords">Keywords (komma-gescheiden)</Label>
                  <Input id="keywords" value={(editing.keywords || []).join(", ")} onChange={e => setEditing({ ...editing, keywords: e.target.value.split(",").map(k => k.trim()) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuleren</Button>
            <Button onClick={handleSave}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Helper Components for Bulk Import ---

function FileImporter({ onDone }: { onDone: () => void }) {
  const [rows, setRows] = useState<{ name: string; status: "pending"|"uploading"|"ok"|"err"; note?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();
  const handle = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const items = Array.from(files).map(f => ({ name: f.name, status: "pending" as const }));
    setRows(items);

    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("files", f);

    const { data, error } = await supabase.functions.invoke("tarot-bulk-import", { body: fd });
    if (error) {
      setRows(items.map(it => ({ ...it, status: "err", note: error.message })));
    } else {
      const out = (data?.results || []) as any[];
      setRows(out.map(r => ({
        name: r.file || r.url || "?",
        status: r.ok ? "ok" : "err",
        note: r.ok ? r.name : r.error
      })));
    }
    onDone();
  };

  return (
    <div className="space-y-3 pt-4">
      <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handle(e.target.files)} />
      <Button onClick={pick}><UploadCloud className="h-4 w-4 mr-2" /> Kies bestanden…</Button>

      {rows.length > 0 && (
        <div className="border border-stone-800 rounded-md p-2 max-h-64 overflow-auto text-sm">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              {r.status === "pending" && <Loader2 className="h-4 w-4 text-stone-500 animate-pulse" />}
              {r.status === "uploading" && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
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

function UrlImporter({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<{ url: string; status: "pending"|"ok"|"err"; note?: string }[]>([]);

  const start = async () => {
    const urls = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!urls.length) return;
    setRows(urls.map(u => ({ url: u, status: "pending" as const })));

    const { data, error } = await supabase.functions.invoke("tarot-bulk-import", { body: { urls } });
    if (error) {
      setRows(urls.map(u => ({ url: u, status: "err", note: error.message })));
    } else {
      const out = (data?.results || []) as any[];
      setRows(out.map(r => ({
        url: r.url,
        status: r.ok ? "ok" : "err",
        note: r.ok ? r.name : r.error
      })));
    }
    onDone();
  };

  return (
    <div className="space-y-3 pt-4">
      <Label htmlFor="urls">Plak hier 1 URL per regel (max rustig 78):</Label>
      <Textarea id="urls" rows={6} value={text} onChange={e => setText(e.target.value)} placeholder="https://....jpg\nhttps://....png" />
      <Button onClick={start}><LinkIcon className="h-4 w-4 mr-2" /> Start import</Button>

      {rows.length > 0 && (
        <div className="border border-stone-800 rounded-md p-2 max-h-64 overflow-auto text-sm mt-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              {r.status === "ok" ? <CheckCircle className="h-4 w-4 text-green-500" /> : r.status === "err" ? <XCircle className="h-4 w-4 text-red-500" /> : <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
              <span className="flex-1 truncate">{r.url}</span>
              <span className="text-stone-400">{r.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}