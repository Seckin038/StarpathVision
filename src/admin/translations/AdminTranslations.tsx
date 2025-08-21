import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";

const BUCKET = "config"; // De bucket waar je i18n bestanden staan
const FILE_PREFIX = "locales"; // De map in de bucket

export default function AdminTranslations() {
  const [locale, setLocale] = useState("nl");
  const [jsonText, setJsonText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const filePath = `${FILE_PREFIX}/${locale}/translation.json`;

  const loadTranslation = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
    
    if (error) {
      showError(`Kon vertaling voor ${locale} niet laden: ${error.message}`);
      setJsonText("{}"); // Reset naar een lege JSON
    } else {
      const text = await data.text();
      try {
        // Formatteer de JSON voor betere leesbaarheid
        const parsed = JSON.parse(text);
        setJsonText(JSON.stringify(parsed, null, 2));
      } catch {
        showError("Gedownload bestand is geen geldige JSON.");
        setJsonText(text); // Toon de ruwe tekst
      }
    }
    setIsLoading(false);
  };

  const saveTranslation = async () => {
    try {
      JSON.parse(jsonText); // Valideer JSON voordat we opslaan
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
      showSuccess(`Vertaling voor ${locale} succesvol opgeslagen.`);
      await supabase.from("audit_logs").insert({ action: "save_translation", meta: { locale } });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTranslation();
  }, [locale]);

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader>
        <CardTitle className="text-amber-200">Vertalingen Beheren (JSON)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
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
          <Button onClick={saveTranslation} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            Opslaan
          </Button>
          <Button onClick={loadTranslation} variant="outline" disabled={isLoading}>
            Herladen
          </Button>
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