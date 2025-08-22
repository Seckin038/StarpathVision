import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UploadCloud, CheckCircle, XCircle } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useTranslation } from "react-i18next";
import { uploadTarotCardImage } from "@/lib/upload";

type TarotCard = {
  id: string;
  name: Record<string, string>;
  number: number;
  arcana: string;
  suit: string | null;
  image_url: string | null;
  meaning_up: Record<string, string> | null;
  meaning_rev: Record<string, string> | null;
  keywords: string[] | null;
};

export default function AdminCards() {
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TarotCard | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const singleFileRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation('admin');
  const locale = i18n.language;

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
      showSuccess(`${editing.name[locale] || editing.id} opgeslagen.`);
      setEditing(null);
      fetchCards();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !editing) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
        const newUrl = await uploadTarotCardImage(file, editing.id);
        const { error } = await supabase.from("tarot_cards").update({ image_url: newUrl }).eq("id", editing.id);
        if (error) throw error;
        setEditing({ ...editing, image_url: newUrl });
        showSuccess("Afbeelding succesvol bijgewerkt.");
        fetchCards(); // Refresh the main list
    } catch (err: any) {
        showError(err.message || "Kon afbeelding niet uploaden.");
    } finally {
        setIsUploading(false);
        if (singleFileRef.current) singleFileRef.current.value = "";
    }
  };

  const handleImageRemove = async () => {
      if (!editing || !editing.image_url) return;
      if (!window.confirm("Weet je zeker dat je deze afbeelding wilt verwijderen?")) return;

      try {
          const path = editing.image_url.split('/tarot-cards/')[1];
          if (path) {
              await supabase.storage.from("tarot-cards").remove([path]);
          }
          const { error: dbError } = await supabase.from("tarot_cards").update({ image_url: null }).eq("id", editing.id);
          if (dbError) throw dbError;

          setEditing({ ...editing, image_url: null });
          showSuccess("Afbeelding succesvol verwijderd.");
          fetchCards(); // Refresh the main list
      } catch (err: any) {
          showError(err.message || "Kon afbeelding niet verwijderen.");
      }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-200">{t('cards.importTitle')}</CardTitle>
          <CardDescription>{t('cards.importDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FileImporter onDone={fetchCards} />
        </CardContent>
      </Card>

      <h2 className="text-xl font-serif text-stone-300">{t('cards.editListTitle')}</h2>
      <p className="text-stone-400 -mt-4">{t('cards.editListDesc')}</p>
      
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
              <CardHeader className="p-3"><CardTitle className="text-amber-300 text-sm truncate">{c.name[locale] || c.name['nl'] || c.id}</CardTitle></CardHeader>
              <CardContent className="p-3">
                <img src={c.image_url || "/tarot/back.svg"} alt={c.name[locale] || c.id} className="w-full aspect-[2/3] object-cover rounded-md bg-stone-900 mb-2" />
                <div className="text-[11px] text-stone-400">{c.image_url ? "✔ afbeelding gekoppeld" : "• nog geen afbeelding"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(isOpen) => !isOpen && setEditing(null)}>
        <DialogContent className="max-w-3xl bg-stone-950 border-stone-800 text-stone-200">
          <DialogHeader>
            <DialogTitle className="text-amber-200">{t('cards.editTitle', { name: editing?.name[locale] || editing?.id })}</DialogTitle>
            <DialogDescription>{t('cards.editDesc')}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-3 gap-6 py-4">
              <div className="col-span-1 space-y-2">
                <img src={editing.image_url || "/tarot/back.svg"} alt={editing.name[locale] || editing.id} className="w-full aspect-[2/3] object-cover rounded-md bg-stone-900" />
                <input type="file" accept="image/*" ref={singleFileRef} className="hidden" onChange={handleImageChange} />
                <Button variant="outline" className="w-full" onClick={() => singleFileRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Afbeelding wijzigen'}
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleImageRemove} disabled={!editing.image_url}>
                    Afbeelding verwijderen
                </Button>
              </div>
              <div className="col-span-2">
                <Tabs defaultValue="nl" className="w-full">
                  <TabsList>
                    <TabsTrigger value="nl">Nederlands</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="tr">Türkçe</TabsTrigger>
                  </TabsList>
                  {(['nl', 'en', 'tr'] as const).map(lang => (
                    <TabsContent key={lang} value={lang} className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor={`name_${lang}`}>{t('cards.name')}</Label>
                        <Input id={`name_${lang}`} value={editing.name?.[lang] || ""} onChange={e => setEditing({ ...editing, name: {...editing.name, [lang]: e.target.value} })} />
                      </div>
                      <div>
                        <Label htmlFor={`meaning_up_${lang}`}>{t('cards.meaningUp')}</Label>
                        <Textarea id={`meaning_up_${lang}`} rows={3} value={editing.meaning_up?.[lang] || ""} onChange={e => setEditing({ ...editing, meaning_up: {...editing.meaning_up, [lang]: e.target.value} })} />
                      </div>
                      <div>
                        <Label htmlFor={`meaning_rev_${lang}`}>{t('cards.meaningRev')}</Label>
                        <Textarea id={`meaning_rev_${lang}`} rows={3} value={editing.meaning_rev?.[lang] || ""} onChange={e => setEditing({ ...editing, meaning_rev: {...editing.meaning_rev, [lang]: e.target.value} })} />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                 <div className="mt-4">
                  <Label htmlFor="keywords">{t('cards.keywords')}</Label>
                  <Input id="keywords" value={(editing.keywords || []).join(", ")} onChange={e => setEditing({ ...editing, keywords: e.target.value.split(",").map(k => k.trim()) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t('common:cancel', 'Annuleren')}</Button>
            <Button onClick={handleSave}>{t('common:save', 'Opslaan')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Item = { file: File; status: "pending"|"uploading"|"processing"|"done"|"error"; message?: string };

function FileImporter({ onDone }: { onDone: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation('admin');

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setItems(files.map((f) => ({ file: f, status: "pending" })));

    for (const [idx, file] of files.entries()) {
      try {
        setItems((prev) => prev.map((it, i) => i === idx ? { ...it, status: "uploading", message: t('cards.importer.uploading') } : it));

        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const tmpPath = `admin/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage.from("tarot-card-uploads").upload(tmpPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/*",
        });
        if (uploadError) throw uploadError;

        setItems((prev) => prev.map((it, i) => i === idx ? { ...it, status: "processing", message: t('cards.importer.processing') } : it));

        const { data, error: invokeError } = await supabase.functions.invoke("process-tarot-upload", {
          body: { filePath: tmpPath },
        });
        if (invokeError) throw invokeError;

        setItems((prev) =>
          prev.map((it, i) =>
            i === idx ? { ...it, status: "done", message: data?.message ?? t('cards.importer.success') } : it
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it, i) =>
            i === idx ? { ...it, status: "error", message: String(err?.message ?? t('cards.importer.unknownError')) } : it
          )
        );
      }
    }
    onDone();
  };

  return (
    <div className="space-y-3 pt-4">
      <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={onFiles} />
      <Button onClick={() => inputRef.current?.click()}><UploadCloud className="h-4 w-4 mr-2" /> {t('cards.chooseFiles')}</Button>

      {items.length > 0 && (
        <div className="border border-stone-800 rounded-md p-2 max-h-64 overflow-auto text-sm">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              {it.status === "pending" && <Loader2 className="h-4 w-4 text-stone-500 animate-pulse" />}
              {it.status === "uploading" && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
              {it.status === "processing" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
              {it.status === "done" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {it.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
              <span className="flex-1 truncate">{it.file.name}</span>
              <span className="text-stone-400">{it.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}