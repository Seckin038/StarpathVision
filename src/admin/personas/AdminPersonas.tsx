import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type Persona = {
  id: string;
  display_name: any;
  gender: string;
  age: number;
  cultures: string[];
  background: any;
  methods: string[];
  limitations: string[];
  style: any;
  symbols: string[];
  rules: string[];
  archetypes: string[];
  prompt_template: string;
  is_premium: boolean;
  quality_of_service: number;
};

// Helper to convert array to comma-separated string and back
const arrayToString = (arr: string[] | null | undefined) => (arr || []).join(", ");
const stringToArray = (str: string) => str.split(",").map(s => s.trim()).filter(Boolean);

export default function AdminPersonas() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Persona | null>(null);
  const { t } = useTranslation('admin');

  const fetchPersonas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("personas").select("*").order("id");
    if (error) {
      showError("Kon personas niet laden.");
    } else {
      setPersonas(data as Persona[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    const { error } = await supabase.from("personas").upsert(editing);
    if (error) {
      showError(`Opslaan mislukt: ${error.message}`);
    } else {
      showSuccess("Persona opgeslagen.");
      setEditing(null);
      fetchPersonas();
    }
  };

  const handleAddNew = () => {
    setEditing({
      id: "",
      display_name: { nl: "", en: "", tr: "" },
      gender: "",
      age: 30,
      cultures: [],
      background: { nl: "", en: "", tr: "" },
      methods: [],
      limitations: [],
      style: { nl: [], en: [], tr: [] },
      symbols: [],
      rules: [],
      archetypes: [],
      prompt_template: "",
      is_premium: false,
      quality_of_service: 3,
    });
  };

  if (loading && !editing) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-amber-400" /></div>;
  }

  if (editing) {
    return (
      <Card className="bg-stone-900/60 border-stone-800">
        <CardHeader>
          <CardTitle className="text-amber-200">{editing.id ? t('personas.edit_title', { id: editing.id }) : t('personas.new_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input placeholder="ID (uniek, bv. 'falya')" value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Gender" value={editing.gender} onChange={e => setEditing({ ...editing, gender: e.target.value })} />
                <Input type="number" placeholder="Leeftijd" value={editing.age} onChange={e => setEditing({ ...editing, age: parseInt(e.target.value) || 0 })} />
              </div>
              <Label>Display Naam</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="nl" value={editing.display_name?.nl || ""} onChange={e => setEditing({ ...editing, display_name: {...editing.display_name, nl: e.target.value} })} />
                <Input placeholder="en" value={editing.display_name?.en || ""} onChange={e => setEditing({ ...editing, display_name: {...editing.display_name, en: e.target.value} })} />
                <Input placeholder="tr" value={editing.display_name?.tr || ""} onChange={e => setEditing({ ...editing, display_name: {...editing.display_name, tr: e.target.value} })} />
              </div>
              <Label>Achtergrond</Label>
              <Textarea placeholder="nl" value={editing.background?.nl || ""} onChange={e => setEditing({ ...editing, background: {...editing.background, nl: e.target.value} })} />
              <Label>Methodes (komma-gescheiden)</Label>
              <Textarea value={arrayToString(editing.methods)} onChange={e => setEditing({ ...editing, methods: stringToArray(e.target.value) })} />
            </div>
            <div className="space-y-4">
              <Label>Stijl (1 per regel per taal)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Textarea placeholder="nl" value={(editing.style?.nl || []).join('\n')} onChange={e => setEditing({ ...editing, style: {...editing.style, nl: e.target.value.split('\n')} })} />
                <Textarea placeholder="en" value={(editing.style?.en || []).join('\n')} onChange={e => setEditing({ ...editing, style: {...editing.style, en: e.target.value.split('\n')} })} />
                <Textarea placeholder="tr" value={(editing.style?.tr || []).join('\n')} onChange={e => setEditing({ ...editing, style: {...editing.style, tr: e.target.value.split('\n')} })} />
              </div>
              <Label>Prompt Template</Label>
              <Textarea value={editing.prompt_template} onChange={e => setEditing({ ...editing, prompt_template: e.target.value })} rows={8} />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="is_premium" checked={editing.is_premium} onCheckedChange={c => setEditing({...editing, is_premium: c})} />
                  <Label htmlFor="is_premium">Premium</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>QoS</Label>
                  <Input type="number" min="1" max="5" className="w-20" value={editing.quality_of_service} onChange={e => setEditing({ ...editing, quality_of_service: parseInt(e.target.value) || 3 })} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-stone-800">
            <Button onClick={handleSave}>{t('personas.save')}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>{t('personas.cancel')}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-amber-200">{t('personas.title')}</CardTitle>
        <Button onClick={handleAddNew}>{t('personas.new')}</Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(p => (
            <Card key={p.id} className="bg-stone-950/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-amber-300">{p.display_name?.nl || p.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-400 h-16 overflow-hidden">{p.background?.nl}</p>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setEditing(p)}>{t('personas.edit')}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}