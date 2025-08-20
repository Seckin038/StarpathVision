import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Trash2, Loader2 } from "lucide-react";
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
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      if (!user) {
        setError("Niet ingelogd.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data, error: fetchError } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create a fallback
        const { data: insertData, error: insertError } = await supabase.from('profiles').insert({ id: user.id }).select().single();
        if (insertError) {
          setError(insertError.message);
        } else if (mounted) {
          setProfile(insertData);
        }
      } else if (fetchError) {
        setError(fetchError.message);
      } else if (mounted) {
        setProfile(data);
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function save() {
    if (!profile || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, avatar_url: profile.avatar_url })
      .eq("id", user.id);
    
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

  if (loading) return <div className="p-6 text-stone-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Profiel laden...</div>;
  if (error) return <div className="p-6 text-red-400">Fout: {error}</div>;
  if (!profile) return <div className="p-6 text-stone-400">Geen profiel gevonden.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 font-serif">
      <Card className="bg-stone-900/50 backdrop-blur-sm border-stone-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-200 tracking-wider">Mijn Profiel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-stone-300">Volledige Naam</Label>
              <Input className="bg-stone-900 border-stone-700" value={profile.full_name ?? ""} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-stone-300">Avatar URL</Label>
              <Input className="bg-stone-900 border-stone-700" value={profile.avatar_url ?? ""} onChange={e => setProfile({ ...profile, avatar_url: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="bg-amber-800 hover:bg-amber-700 text-stone-100">
              {saving ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
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