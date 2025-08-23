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

/** Cirkels - now adaptive for large numbers of cards */
export function circlePositions(n:number, opts?:{cx?:number;cy?:number;r?:number;startDeg?:number}): Position[] {
  const cx = opts?.cx ?? 0.5;
  let cy = opts?.cy ?? 0.5;
  let rx = opts?.r ?? 0.36;
  let ry = opts?.r ?? 0.36;
  
  // For larger numbers of cards, switch to an elliptical layout that's higher up to prevent overlap at the bottom.
  if (n > 20) {
    rx = 0.48; // Wider radius to spread cards horizontally
    ry = 0.32; // Shorter radius to prevent vertical overlap
    cy = 0.45; // Move the center of the ellipse up
  }
  if (n > 40) {
    rx = 0.49; // Even wider for very large spreads
    ry = 0.38; // Use a bit more vertical space
    cy = 0.48; // Center it slightly lower than the 20+ case, but still high
  }

  const start = (opts?.startDeg ?? -90) * Math.PI/180;
  
  return Array.from({length:n}, (_,i)=>{
    const t = start + i*2*Math.PI/n;
    return { x: cx + rx*Math.cos(t), y: cy + ry*Math.sin(t) };
  });
}

/** Grid layout */
function gridPositions(rows: number, cols: number): Position[] {
    const positions: Position[] = [];
    const total = rows * cols;
    if (total === 0) return [];

    // Handle single row or column to prevent division by zero
    const divX = cols > 1 ? cols - 1 : 1;
    const divY = rows > 1 ? rows - 1 : 1;

    for (let i = 0; i < total; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = cols === 1 ? 0.5 : 0.05 + col * (0.9 / divX);
        const y = rows === 1 ? 0.5 : 0.05 + row * (0.9 / divY);
        positions.push({ x, y });
    }
    return positions;
}


/** Hexagon layout for the 6-card Star Spread */
export function starOfDavid6(): Position[] {
  const cx = 0.5, cy = 0.5, r = 0.34;
  const base = (deg:number)=>({ x: cx + r*Math.cos(deg*Math.PI/180), y: cy + r*Math.sin(deg*Math.PI/180) });
  // twee gelijkzijdige driehoeken met 60° offset
  return [
    base(-90), base(30), base(150),     // ▲
    base(-30), base(90), base(210)      // ▼
  ];
}

export function pentagram5(): Position[] {
  const cx = 0.5, cy = 0.45, r = 0.38;
  const points = [];
  for (let i = 0; i < 5; i++) {
    const angle = -90 + i * (360 / 5);
    const rad = angle * Math.PI / 180;
    points.push({ x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) });
  }
  return points;
}

export function cross5(): Position[] {
  return [
    { x: 0.5, y: 0.25 }, // top
    { x: 0.25, y: 0.5 }, // left
    { x: 0.75, y: 0.5 }, // right
    { x: 0.5, y: 0.75 }, // bottom
    { x: 0.5, y: 0.5 },  // center
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

export type SpreadKind = 
  "daily-1" | "two-choice-2" | "ppf-3" | "line-3" | "star-6" | "horseshoe-7" | 
  "cross-10" | "year-12" | "pentagram-5" | "cross-5" | "chakra-7" | "planetary-7" | 
  "week-7" | "career-10" | "tree-of-life-10" | "romani-21" | "grand-tableau-36" | 
  "full-deck-78" | "custom";

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
    case "pentagram-5": return pentagram5();
    case "cross-5": return cross5();
    case "chakra-7": return Array.from({ length: 7 }, (_, i) => ({ x: 0.5, y: 0.12 + i * 0.13 }));
    case "planetary-7": return [...circlePositions(6, { r: 0.3 }), { x: 0.5, y: 0.5 }];
    case "week-7": return [...Array.from({ length: 6 }, (_, i) => ({ x: 0.1 + i * 0.16, y: 0.6 })), { x: 0.5, y: 0.25 }];
    case "career-10": return [ { x: 0.5, y: 0.8 }, { x: 0.35, y: 0.6 }, { x: 0.65, y: 0.6 }, { x: 0.2, y: 0.4 }, { x: 0.5, y: 0.4 }, { x: 0.8, y: 0.4 }, { x: 0.1, y: 0.2 }, { x: 0.37, y: 0.2 }, { x: 0.63, y: 0.2 }, { x: 0.9, y: 0.2 }, ];
    case "tree-of-life-10": return [ { x: 0.5, y: 0.1 }, { x: 0.75, y: 0.25 }, { x: 0.25, y: 0.25 }, { x: 0.75, y: 0.45 }, { x: 0.25, y: 0.45 }, { x: 0.5, y: 0.5 }, { x: 0.75, y: 0.65 }, { x: 0.25, y: 0.65 }, { x: 0.5, y: 0.8 }, { x: 0.5, y: 0.9 }, ];
    case "romani-21": return gridPositions(3, 7);
    case "grand-tableau-36": return gridPositions(4, 9);
    case "full-deck-78": return gridPositions(6, 13);
    default: return circlePositions(n);
  }
}