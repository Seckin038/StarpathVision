import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Corrected import path
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Spread = {
  id: string;
  name: Record<string,string>;
  cards_required: number;
  allow_reversals: boolean;
  ui_copy: any; // {nl:{subtitle}, en:{}, tr:{}}
};

type Pos = {
  spread_id: string;
  idx: number;
  slot_key: string;
  title: Record<string,string>;
  upright_copy: Record<string,string>;
  reversed_copy: Record<string,string>;
  x: number; y: number; rot: number;
};

const BUCKET = "config"; // upload naar /tarot/spread-library.json

export default function AdminSpreads(){
  const [rows,setRows] = useState<Spread[]>([]);
  const [q,setQ] = useState("");
  const [editing, setEditing] = useState<Spread|null>(null);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [locale, setLocale] = useState<"nl"|"en"|"tr">("nl");

  const load = async () => {
    const { data } = await supabase.from("spreads").select("*").order("id");
    setRows((data||[]) as Spread[]);
  };
  useEffect(()=>{ load(); },[]);

  const open = async (s:Spread) => {
    setEditing(s);
    const { data } = await supabase.from("spread_positions").select("*").eq("spread_id", s.id).order("idx");
    setPositions((data||[]) as Pos[]);
  };

  const addNew = () => {
    const s:Spread = {
      id: "", name:{nl:"",en:"",tr:""},
      cards_required: 3, allow_reversals: true,
      ui_copy:{nl:{subtitle:""}, en:{subtitle:""}, tr:{subtitle:""}}
    };
    setEditing(s); setPositions([]);
  };

  const saveSpread = async () => {
    if(!editing) return;
    if(!editing.id){ alert("Vul een ID in (bv. ppf-3)."); return; }
    const up = { ...editing };
    const exists = rows.some(r=>r.id===editing.id);
    if (exists) await supabase.from("spreads").update(up).eq("id",editing.id);
    else await supabase.from("spreads").insert(up);
    await supabase.from("audit_logs").insert({action:"save_spread", meta:{id:editing.id}});
    await load();
  };

  const addPos = () => {
    if(!editing) return;
    const nextIdx = (positions.at(-1)?.idx ?? 0)+1;
    setPositions(p=>[...p, {
      spread_id: editing.id || "",
      idx: nextIdx, slot_key: `slot_${nextIdx}`,
      title:{nl:`Positie ${nextIdx}`,en:`Position ${nextIdx}`,tr:`Pozisyon ${nextIdx}`},
      upright_copy:{nl:"",en:"",tr:""}, reversed_copy:{nl:"",en:"",tr:""},
      x:0.5,y:0.5,rot:0
    }]);
  };

  const savePositions = async () => {
    if(!editing) return;
    // wis en schrijf opnieuw (klein & simpel)
    await supabase.from("spread_positions").delete().eq("spread_id", editing.id);
    if(positions.length){
      const rows = positions.map((p,i)=>({...p, idx:i+1, spread_id: editing.id}));
      await supabase.from("spread_positions").insert(rows);
    }
    await supabase.from("audit_logs").insert({action:"save_positions", meta:{id:editing.id, count:positions.length}});
    open(editing);
  };

  const removeSpread = async (id:string) => {
    await supabase.from("spreads").delete().eq("id",id);
    await supabase.from("audit_logs").insert({action:"delete_spread", meta:{id}});
    setEditing(null); setPositions([]);
    await load();
  };

  const filtered = useMemo(()=> rows.filter(r=>{
    const t=(q||"").toLowerCase();
    const inName = Object.values(r.name||{}).join("|").toLowerCase();
    return !q || r.id.includes(t) || inName.includes(t);
  }),[rows,q]);

  const exportLibrary = async () => {
    // bouw je oude library-structuur na uit DB
    const { data: allSpreads } = await supabase.from("spreads").select("*").order("id");
    const entries:any[] = [];
    for(const s of (allSpreads||[])){
      const { data: pos } = await supabase.from("spread_positions").select("*").eq("spread_id",s.id).order("idx");
      entries.push({
        id: s.id,
        cards_required: s.cards_required,
        allow_reversals: s.allow_reversals,
        name: s.name,
        ui_copy: s.ui_copy,
        positions: (pos||[]).map((p:any)=>({
          slot_key: p.slot_key,
          idx: p.idx,
          x: Number(p.x), y: Number(p.y), rot: Number(p.rot),
          title: p.title,
          upright_copy: p.upright_copy,
          reversed_copy: p.reversed_copy
        }))
      });
    }
    const json = JSON.stringify({ spreads: entries }, null, 2);
    await supabase.storage.from(BUCKET).upload("tarot/spread-library.json", new Blob([json],{type:"application/json"}), { upsert:true });
    await supabase.from("audit_logs").insert({action:"export_spread_library", meta:{count: entries.length}});
    alert("spread-library.json is geüpdatet.");
  };

  return (
    <div className="space-y-4">
      <Card className="bg-stone-900/60 border-stone-800">
        <CardContent className="pt-6 flex gap-3 items-center">
          <Input placeholder="Zoek op id/naam…" value={q} onChange={e=>setQ(e.target.value)} />
          <Button onClick={addNew}>+ Nieuwe spread</Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={exportLibrary}>Export → spread-library.json</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s=>(
          <Card key={s.id} className="bg-stone-900/60 border-stone-800">
            <CardContent className="pt-4 space-y-2">
              <div className="font-semibold">{s.id}</div>
              <div className="text-sm opacity-80">{s.name?.[locale]||"—"}</div>
              <div className="text-xs opacity-70">cards: {s.cards_required} · reversals: {String(s.allow_reversals)}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={()=>open(s)}>Bewerken</Button>
                <Button variant="destructive" onClick={()=>removeSpread(s.id)}>Verwijderen</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <EditorModal
          spread={editing}
          setSpread={setEditing}
          positions={positions}
          setPositions={setPositions}
          locale={locale}
          setLocale={setLocale}
          onSaveSpread={saveSpread}
          onSavePositions={savePositions}
          onAddPos={addPos}
          onClose={()=>{ setEditing(null); setPositions([]); }}
        />
      )}
    </div>
  );
}

function EditorModal({
  spread, setSpread, positions, setPositions, locale, setLocale,
  onSaveSpread, onSavePositions, onAddPos, onClose
}: any){
  const boxRef = useRef<HTMLDivElement>(null);

  const startDrag = (i:number, e:React.MouseEvent) => {
    const box = boxRef.current; if(!box) return;
    const rect = box.getBoundingClientRect();
    const onMove = (ev:MouseEvent)=>{
      const x = (ev.clientX - rect.left)/rect.width;
      const y = (ev.clientY - rect.top)/rect.height;
      setPositions((ps:Pos[])=>{
        const copy=[...ps]; copy[i]={...copy[i], x:Math.min(1,Math.max(0,x)), y:Math.min(1,Math.max(0,y))}; return copy;
      });
    };
    const onUp = ()=>{ window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); };
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  };

  const update = (i:number, patch:Partial<Pos>) => {
    setPositions((ps:Pos[])=>{ const copy=[...ps]; copy[i]={...copy[i], ...patch}; return copy; });
  };

  const reorder = (i:number, dir:-1|1) => {
    setPositions((ps:Pos[])=>{
      const j=i+dir; if(j<0||j>=ps.length) return ps;
      const copy=[...ps]; const t=copy[i]; copy[i]=copy[j]; copy[j]=t; return copy;
    });
  };

  return (
    <Card className="fixed inset-0 z-50 max-w-6xl mx-auto my-6 bg-stone-950 border-stone-800 overflow-auto">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="font-serif text-xl">Spread bewerken</div>
          <div className="ml-auto flex items-center gap-2">
            <select value={locale} onChange={e=>setLocale(e.target.value)} className="bg-stone-900 border-stone-700 rounded-md px-3 py-2">
              <option value="nl">nl</option><option value="en">en</option><option value="tr">tr</option>
            </select>
            <Button variant="outline" onClick={onSaveSpread}>Spread opslaan</Button>
            <Button onClick={onSavePositions}>Posities opslaan</Button>
            <Button variant="outline" onClick={onClose}>Sluiten</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Spread form */}
          <div className="space-y-3">
            <Input placeholder="id (bv. ppf-3)" value={spread.id} onChange={e=>setSpread({...spread, id:e.target.value})}/>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="name nl" value={spread.name?.nl||""} onChange={e=>setSpread({...spread, name:{...spread.name, nl:e.target.value}})}/>
              <Input placeholder="name en" value={spread.name?.en||""} onChange={e=>setSpread({...spread, name:{...spread.name, en:e.target.value}})}/>
              <Input placeholder="name tr" value={spread.name?.tr||""} onChange={e=>setSpread({...spread, name:{...spread.name, tr:e.target.value}})}/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="cards_required" value={spread.cards_required} onChange={e=>setSpread({...spread, cards_required:+e.target.value||0})}/>
              <select value={String(spread.allow_reversals)} onChange={e=>setSpread({...spread, allow_reversals: e.target.value==="true"})} className="bg-stone-900 border-stone-700 rounded-md px-3 py-2">
                <option value="true">allow_reversals: true</option>
                <option value="false">allow_reversals: false</option>
              </select>
            </div>
            <Input placeholder={`subtitle (${locale})`} value={spread.ui_copy?.[locale]?.subtitle||""}
              onChange={e=>setSpread({...spread, ui_copy:{...spread.ui_copy, [locale]:{...(spread.ui_copy?.[locale]||{}), subtitle:e.target.value}}})}/>
            <Button variant="outline" onClick={onAddPos}>+ Positie</Button>
          </div>

          {/* Visual board */}
          <div>
            <div ref={boxRef} className="relative w-full aspect-[16/10] rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
              {/* grid overlay */}
              <div className="absolute inset-0 opacity-20" style={{backgroundImage:"linear-gradient(0deg,transparent 24%,rgba(255,255,255,.07) 25%,rgba(255,255,255,.07) 26%,transparent 27%,transparent 74%,rgba(255,255,255,.07) 75%,rgba(255,255,255,.07) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(255,255,255,.07) 25%,rgba(255,255,255,.07) 26%,transparent 27%,transparent 74%,rgba(255,255,255,.07) 75%,rgba(255,255,255,.07) 76%,transparent 77%)",backgroundSize:"40px 40px"}} />
              {positions.map((p:Pos,i:number)=>{
                const left = `${(p.x*100).toFixed(2)}%`;
                const top  = `${(p.y*100).toFixed(2)}%`;
                return (
                  <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{left, top}}>
                    <button
                      onMouseDown={(e)=>startDrag(i,e)}
                      className="w-14 h-[88px] rounded-lg border border-amber-400/60 bg-amber-400/20 text-amber-200 text-xs shadow"
                      title={`${p.slot_key}`}
                    >
                      <div className="font-semibold">#{i+1}</div>
                      <div className="truncate">{p.title?.[locale]||p.slot_key}</div>
                      <div className="opacity-70">rot {p.rot}°</div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Positions table */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-stone-400">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">slot_key</th>
                <th className="p-2 text-left">title[{locale}]</th>
                <th className="p-2 text-left">upright[{locale}]</th>
                <th className="p-2 text-left">reversed[{locale}]</th>
                <th className="p-2 text-left">x</th>
                <th className="p-2 text-left">y</th>
                <th className="p-2 text-left">rot</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p:Pos,i:number)=>(
                <tr key={i} className="border-t border-stone-800 align-top">
                  <td className="p-2 whitespace-nowrap">{i+1}</td>
                  <td className="p-2"><Input value={p.slot_key} onChange={e=>update(i,{slot_key:e.target.value})}/></td>
                  <td className="p-2"><Input value={p.title?.[locale]||""} onChange={e=>update(i,{title:{...p.title,[locale]:e.target.value}})}/></td>
                  <td className="p-2"><textarea rows={3} className="w-full bg-stone-900 border-stone-700 rounded-md p-2"
                    value={p.upright_copy?.[locale]||""}
                    onChange={e=>update(i,{upright_copy:{...p.upright_copy,[locale]:e.target.value}})} /></td>
                  <td className="p-2"><textarea rows={3} className="w-full bg-stone-900 border-stone-700 rounded-md p-2"
                    value={p.reversed_copy?.[locale]||""}
                    onChange={e=>update(i,{reversed_copy:{...p.reversed_copy,[locale]:e.target.value}})} /></td>
                  <td className="p-2 w-24"><Input type="number" step="0.01" value={p.x} onChange={e=>update(i,{x: clamp(+e.target.value,0,1)})}/></td>
                  <td className="p-2 w-24"><Input type="number" step="0.01" value={p.y} onChange={e=>update(i,{y: clamp(+e.target.value,0,1)})}/></td>
                  <td className="p-2 w-24"><Input type="number" step="1" value={p.rot} onChange={e=>update(i,{rot: +e.target.value})}/></td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex gap-1">
                      <Button variant="outline" onClick={()=>reorder(i,-1)}>↑</Button>
                      <Button variant="outline" onClick={()=>reorder(i, 1)}>↓</Button>
                      <Button variant="destructive" onClick={()=>setPositions((ps:Pos[])=>ps.filter((_,j)=>j!==i))}>X</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  );
}

function clamp(v:number,lo:number,hi:number){ return Math.max(lo, Math.min(hi, v)); }