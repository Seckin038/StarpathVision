import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast";

type Profile = {
  user_id: string;
  name: string | null;
  locale: string;
  timezone: string | null;
  birth_date: string | null;
  birth_place: string | null;
  persona_gender: "auto" | "fem" | "masc";
  marketing_opt_in: boolean;
  analytics_opt_in: boolean;
  ai_training_opt_in: boolean;
  notify_email: boolean;
  notify_push: boolean;
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          toast.error("Kon profiel niet laden.");
          console.error(error);
        }
        setP(data as Profile);
        setLoading(false);
      });
  }, [user]);

  async function save() {
    if (!p || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...p, user_id: undefined })
      .eq("user_id", user.id);
    
    if (error) {
      toast.error(`Fout bij opslaan: ${error.message}`);
    } else {
      toast.success("Profiel opgeslagen.");
    }
    setSaving(false);
  }

  async function handleDownload() {
    const toastId = showLoading("Gegevens worden verzameld...");
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `starpathvision_data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      dismissToast(toastId);
      showSuccess("Je gegevens zijn gedownload.");
    } catch (err: any) {
      dismissToast(toastId);
      showError(`Downloaden mislukt: ${err.message}`);
    }
  }

  async function handleDeleteAccount() {
    const toastId = showLoading("Account wordt verwijderd...");
    try {
      const { error } = await supabase.functions.invoke('delete-user-account');
      if (error) throw error;
      
      dismissToast(toastId);
      showSuccess("Je account is succesvol verwijderd.");
      
      await signOut();
      navigate("/");
    } catch (err: any) {
      dismissToast(toastId);
      showError(`Verwijderen mislukt: ${err.message}`);
    }
  }

  if (loading) return <div className="p-6 text-stone-400">Profiel laden...</div>;
  if (!p) return <div className="p-6 text-stone-400">Geen profiel gevonden.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 font-serif">
      <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-200 tracking-wider">Mijn Gegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-stone-300">Naam</Label><Input className="bg-stone-900 border-stone-700" value={p.name ?? ""} onChange={e => setP({ ...p, name: e.target.value })} /></div>
            <div className="space-y-2"><Label className="text-stone-300">Taal</Label><Select value={p.locale} onValueChange={(value: string) => setP({ ...p, locale: value })}><SelectTrigger className="w-full bg-stone-900 border-stone-700"><SelectValue /></SelectTrigger><SelectContent className="bg-stone-900 border-stone-700 text-stone-200"><SelectItem value="nl">Nederlands</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="tr">Türkçe</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-stone-300">Geboortedatum</Label><Input className="bg-stone-900 border-stone-700" type="date" value={p.birth_date ?? ""} onChange={e => setP({ ...p, birth_date: e.target.value })} /></div>
            <div className="space-y-2"><Label className="text-stone-300">Geboorteplaats</Label><Input className="bg-stone-900 border-stone-700" value={p.birth_place ?? ""} onChange={e => setP({ ...p, birth_place: e.target.value })} /></div>
          </div>
          <div className="space-y-4"><h3 className="text-lg font-semibold text-amber-300">Voorkeuren & Toestemming</h3><div className="space-y-3"><div className="flex items-center justify-between"><Label>Marketing e-mails</Label><Switch checked={p.marketing_opt_in} onCheckedChange={c => setP({ ...p, marketing_opt_in: c })} /></div><div className="flex items-center justify-between"><Label>Analyse van gebruik</Label><Switch checked={p.analytics_opt_in} onCheckedChange={c => setP({ ...p, analytics_opt_in: c })} /></div><div className="flex items-center justify-between"><Label>Gebruik data voor AI-training</Label><Switch checked={p.ai_training_opt_in} onCheckedChange={c => setP({ ...p, ai_training_opt_in: c })} /></div></div></div>
          <div className="flex justify-end"><Button onClick={save} disabled={saving} className="bg-amber-800 hover:bg-amber-700 text-stone-100">{saving ? "Opslaan..." : "Opslaan"}</Button></div>
        </CardContent>
      </Card>

      <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800 mt-6">
        <CardHeader><CardTitle className="text-xl font-bold text-amber-300 tracking-wider">Accountbeheer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-stone-900 rounded-lg border border-stone-800">
            <div><h4 className="font-semibold text-stone-200">Download mijn gegevens</h4><p className="text-sm text-stone-400">Download een kopie van al je profielgegevens en lezingen.</p></div>
            <Button onClick={handleDownload} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800"><Download className="h-4 w-4 mr-2" />Download</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-800/50">
            <div><h4 className="font-semibold text-red-300">Verwijder mijn account</h4><p className="text-sm text-red-400">Dit kan niet ongedaan worden gemaakt. Al je gegevens worden permanent verwijderd.</p></div>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Verwijder</Button></AlertDialogTrigger><AlertDialogContent className="bg-stone-900 border-stone-700"><AlertDialogHeader><AlertDialogTitle className="text-amber-200">Weet je het zeker?</AlertDialogTitle><AlertDialogDescription className="text-stone-400">Deze actie kan niet ongedaan worden gemaakt. Dit zal je account en al je opgeslagen lezingen permanent verwijderen.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-stone-700 text-stone-300 hover:bg-stone-800">Annuleren</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white">Ja, verwijder mijn account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}