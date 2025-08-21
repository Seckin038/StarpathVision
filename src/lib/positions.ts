export type Position = { x:number; y:number; r?:number; z?:number; label?:string };

/** Normaliseer allerlei formaten naar 0..1 (percent, px-achtige of 0..1). */
export function normalizePositions(raw: any[] = []): Position[] {
  return raw.map((p,i) => {
    let x = Number(p.x ?? p.cx ?? p.left ?? 0.5);
    let y = Number(p.y ?? p.cy ?? p.top  ?? 0.5);
    const r = Number(p.rot ?? p.r ?? 0) || 0;
    const z = Number(p.z ?? i+1) || (i+1);

    // 0..100 → 0..1
    if (Math.abs(x) > 1 || Math.abs(y) > 1) { x = x/100; y = y/100; }

    // clamp licht (blijf binnen het board)
    x = Math.min(0.98, Math.max(0.02, x));
    y = Math.min(0.98, Math.max(0.02, y));

    return { x, y, r, z, label: p.slot_key || p.label };
  });
}

/** Cirkels */
export function circlePositions(n:number, opts?:{cx?:number;cy?:number;r?:number;startDeg?:number}): Position[] {
  const cx = opts?.cx ?? 0.5, cy = opts?.cy ?? 0.5, r = opts?.r ?? 0.36;
  const start = (opts?.startDeg ?? -90) * Math.PI/180;
  return Array.from({length:n}, (_,i)=>{
    const t = start + i*2*Math.PI/n;
    return { x: cx + r*Math.cos(t), y: cy + r*Math.sin(t) };
  });
}

/** Star of David (6 punten), echte 'Sterlegging' */
export function starOfDavid6(): Position[] {
  const cx = 0.5, cy = 0.5, r = 0.34;
  const base = (deg:number)=>({ x: cx + r*Math.cos(deg*Math.PI/180), y: cy + r*Math.sin(deg*Math.PI/180) });
  // twee gelijkzijdige driehoeken met 60° offset
  return [
    base(-90), base(30), base(150),     // ▲
    base(-30), base(90), base(210)      // ▼
  ];
}

/** Overige ingebouwde vormen */
export function horseshoe7(): Position[] {
  const xs=[0.10,0.23,0.36,0.50,0.64,0.77,0.90], ys=[0.70,0.60,0.50,0.45,0.50,0.60,0.70];
  return xs.map((x,i)=>({x,y:ys[i]}));
}
export function line3(): Position[] { return [{x:0.25,y:0.5},{x:0.5,y:0.5},{x:0.75,y:0.5}]; }
export function twoChoice2(): Position[] { return [{x:0.35,y:0.5},{x:0.65,y:0.5}]; }
export function daily1(): Position[] { return [{x:0.5,y:0.5}]; }
export function celticCross10(): Position[] {
  return [
    {x:0.33,y:0.50,z:2},{x:0.33,y:0.50,r:90,z:3},{x:0.20,y:0.50},
    {x:0.33,y:0.66},{x:0.33,y:0.34},{x:0.46,y:0.50},
    {x:0.70,y:0.65},{x:0.70,y:0.51},{x:0.70,y:0.37},{x:0.70,y:0.23}
  ];
}

export type SpreadKind = "daily-1"|"two-choice-2"|"ppf-3"|"line-3"|"star-6"|"horseshoe-7"|"cross-10"|"year-12"|"custom";

export function positionsFor(kind:SpreadKind, n:number): Position[] {
  switch(kind){
    case "daily-1": return daily1();
    case "two-choice-2": return twoChoice2();
    case "ppf-3":
    case "line-3": return line3();
    case "star-6": return starOfDavid6();
    case "horseshoe-7": return horseshoe7();
    case "cross-10": return celticCross10();
    case "year-12": return circlePositions(12,{r:0.38,startDeg:-90});
    default: return circlePositions(n);
  }
}