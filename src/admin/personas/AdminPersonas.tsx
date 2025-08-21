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
  usage_stats: any;
  example_answers: any;
  prompt_template: string;
  is_premium: boolean;
  quality_of_service: number;
};

export default function AdminPersonas() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Persona | null>(null);

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
      usage_stats: {},
      example_answers: {},
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
          <CardTitle className="text-amber-200">{editing.id ? `Bewerk: ${editing.id}` : "Nieuwe Persona"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="ID" value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} />
          {/* Add more fields for editing here */}
          <Textarea 
            placeholder="Prompt Template" 
            value={editing.prompt_template} 
            onChange={e => setEditing({ ...editing, prompt_template: e.target.value })}
            rows={5}
          />
          <div className="flex items-center space-x-2">
            <Switch id="is_premium" checked={editing.is_premium} onCheckedChange={c => setEditing({...editing, is_premium: c})} />
            <Label htmlFor="is_premium">Premium</Label>
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
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-amber-200">Personas Beheren</CardTitle>
        <Button onClick={handleAddNew}>+ Nieuwe Persona</Button>
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
                  <Button variant="outline" onClick={() => setEditing(p)}>Bewerken</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}