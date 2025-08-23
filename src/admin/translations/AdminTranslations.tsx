import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Loader2, UploadCloud } from "lucide-react";

const BUCKET = "config";
const FILE_PREFIX = "locales";

export default function AdminTranslations() {
  const [locale, setLocale] = useState("nl");
  const [namespace, setNamespace] = useState("translation");
  const [jsonText, setJsonText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const filePath = `${FILE_PREFIX}/${locale}/${namespace}.json`;

  const loadTranslation = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
    
    if (error) {
      const errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error);
      // Don't show an error toast if the file simply doesn't exist yet (Not Found).
      if (!errorMessage.includes('Not Found')) {
        showError(`Fout bij laden: ${errorMessage}`);
      }
      setJsonText("{}");
    } else {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text);
        setJsonText(JSON.stringify(parsed, null, 2));
      } catch {
        showError("Gedownload bestand is geen geldige JSON.");
        setJsonText(text);
      }
    }
    setIsLoading(false);
  };

  const saveTranslation = async () => {
    try {
      JSON.parse(jsonText);
    } catch (e) {
      showError("De tekst is geen geldige JSON. Opslaan geannuleerd.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, new Blob([jsonText], { type: "application/json" }), {
        upsert: true,
      });

    if (error) {
      showError(`Opslaan mislukt: ${error.message}`);
    } else {
      showSuccess(`Vertaling voor ${locale}/${namespace} succesvol opgeslagen.`);
      await supabase.from("audit_logs").insert({ action: "save_translation", meta: { locale, namespace } });
    }
    setIsLoading(false);
  };

  const seedInitialFiles = async () => {
    const toastId = showLoading("Bezig met uploaden van lokale bestanden...");
    try {
      const localesToSeed = ['nl', 'en', 'tr'];
      const namespacesToSeed = ['translation', 'admin'];
      for (const loc of localesToSeed) {
        for (const ns of namespacesToSeed) {
          const localPath = `/locales/${loc}/${ns}.json`;
          const remotePath = `locales/${loc}/${ns}.json`;
          
          const response = await fetch(localPath);
          if (!response.ok) {
            console.warn(`Kon ${localPath} niet vinden, wordt overgeslagen.`);
            continue;
          }
          const content = await response.text();
          
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(remotePath, new Blob([content], { type: "application/json" }), {
              upsert: true,
            });
          if (error) throw new Error(`Uploaden van ${remotePath} mislukt: ${error.message}`);
        }
      }
      dismissToast(toastId);
      showSuccess("Alle lokale vertaalbestanden zijn succesvol geüpload!");
      loadTranslation(); // Herlaad de huidige weergave
    } catch (err: any) {
      dismissToast(toastId);
      showError(`Fout bij uploaden: ${err.message}`);
    }
  };

  useEffect(() => {
    loadTranslation();
  }, [locale, namespace]);

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader>
        <CardTitle className="text-amber-200">Vertalingen Beheren (JSON)</CardTitle>
        <CardDescription>
          Beheer hier de teksten voor de website. Als dit de eerste keer is, gebruik de 'Seed' knop om de basisbestanden te uploaden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-48">
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nl">Nederlands (nl)</SelectItem>
                <SelectItem value="en">English (en)</SelectItem>
                <SelectItem value="tr">Türkçe (tr)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={namespace} onValueChange={setNamespace}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="translation">Algemeen (translation)</SelectItem>
                <SelectItem value="admin">Beheer (admin)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveTranslation} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            Opslaan
          </Button>
          <Button onClick={loadTranslation} variant="outline" disabled={isLoading}>
            Herladen
          </Button>
          <div className="ml-auto">
            <Button onClick={seedInitialFiles} variant="secondary">
              <UploadCloud className="mr-2 h-4 w-4" /> Seed Lokale Bestanden
            </Button>
          </div>
        </div>
        <p className="text-sm text-stone-400">
          Je bewerkt nu: <code className="bg-stone-800 px-1 rounded">{filePath}</code> in bucket <code className="bg-stone-800 px-1 rounded">{BUCKET}</code>.
        </p>
        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={25}
          className="font-mono bg-stone-950 border-stone-700"
          placeholder="JSON inhoud..."
          disabled={isLoading}
        />
      </CardContent>
    </Card>
  );
}