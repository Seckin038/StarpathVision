import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type Flag = {
  id: number;
  key: string;
  is_enabled: boolean;
  description: string | null;
};

export default function AdminFeatures() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFlag, setNewFlag] = useState({ key: "", description: "" });
  const { t } = useTranslation('admin');

  const fetchFlags = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("feature_flags").select("*").order("key");
    if (error) {
      showError("Kon feature flags niet laden.");
    } else {
      setFlags(data as Flag[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flag: Flag) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ is_enabled: !flag.is_enabled })
      .eq("id", flag.id);

    if (error) {
      showError("Flag updaten mislukt.");
    } else {
      fetchFlags();
    }
  };

  const handleCreate = async () => {
    if (!newFlag.key) {
      showError("Key is verplicht.");
      return;
    }
    const { error } = await supabase.from("feature_flags").insert({
      key: newFlag.key,
      description: newFlag.description,
      is_enabled: false,
    });
    if (error) {
      showError(`Aanmaken mislukt: ${error.message}`);
    } else {
      showSuccess("Feature flag aangemaakt.");
      setNewFlag({ key: "", description: "" });
      fetchFlags();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-amber-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader><CardTitle className="text-amber-200">{t('features.title')}</CardTitle></CardHeader>
        <CardContent>
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between p-2 border-b border-stone-800">
              <div>
                <p className="font-mono text-stone-200">{flag.key}</p>
                <p className="text-sm text-stone-400">{flag.description}</p>
              </div>
              <Switch
                checked={flag.is_enabled}
                onCheckedChange={() => handleToggle(flag)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader><CardTitle className="text-amber-200">{t('features.new_flag_title')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="flag-key (uniek)" value={newFlag.key} onChange={e => setNewFlag({...newFlag, key: e.target.value})} />
          <Input placeholder="Beschrijving" value={newFlag.description} onChange={e => setNewFlag({...newFlag, description: e.target.value})} />
          <Button onClick={handleCreate}>{t('features.create')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}