import React, { useEffect, useMemo, useRef } from "react";

type Mode = "gradient" | "particles" | "sigils" | "particles+sigils" | "none";
type Intensity = "low" | "medium" | "high";

interface Props {
  mode?: Mode;
  intensity?: Intensity;     // regelt density/speed
  className?: string;        // extra styling
}

export default function MysticalBackground({
  mode = "gradient",
  intensity = "low",
  className = "",
}: Props) {
  return (
    <div className={`pointer-events-none fixed inset-0 -z-10 ${className}`}>
      {/* Gradient laag is altijd veilig en licht */}
      {(mode === "gradient" || mode === "particles" || mode === "sigils" || mode === "particles+sigils") && (
        <AnimatedGradient />
      )}

      {/* Particles laag */}
      {(mode === "particles" || mode === "particles+sigils") && (
        <ParticlesCanvas intensity={intensity} />
      )}

      {/* Sigils laag */}
      {(mode === "sigils" || mode === "particles+sigils") && (
        <SigilsLayer intensity={intensity} />
      )}
    </div>
  );
}

/** Animated CSS gradient + film grain */
function AnimatedGradient() {
  return (
    <div className="absolute inset-0 bg-noise" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 800px at 10% 20%, rgba(99,102,241,0.18), transparent 60%),\
             radial-gradient(900px 600px at 80% 30%, rgba(16,185,129,0.14), transparent 55%),\
             radial-gradient(1000px 700px at 50% 80%, rgba(56,189,248,0.12), transparent 60%),\
             linear-gradient(180deg, rgba(10,10,20,1) 0%, rgba(8,8,15,1) 100%)",
          animation: "slow-pan 18s ease-in-out infinite",
          willChange: "transform",
        }}
      />
    </div>
  );
}

/** Canvas sterrenstof/energie-orbs (licht en subtiel) */
function ParticlesCanvas({ intensity }: { intensity: Intensity }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reqRef = useRef<number | null>(null);
  const last = useRef<number>(0);
  const hidden = useRef<boolean>(false);

  const cfg = useMemo(() => {
    const map: Record<Intensity, { count: number; speed: number; size: [number, number] }> = {
      low:    { count: 60,  speed: 0.02, size: [0.6, 1.6] },
      medium: { count: 100, speed: 0.03, size: [0.6, 2.0] },
      high:   { count: 160, speed: 0.04, size: [0.8, 2.2] },
    };
    return map[intensity];
  }, [intensity]);

  useEffect(() => {
    const cvs = ref.current!;
    const ctx = cvs.getContext("2d", { alpha: true })!;
    let w = (cvs.width = window.innerWidth);
    let h = (cvs.height = window.innerHeight);

    const P = Array.from({ length: cfg.count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(cfg.size[0], cfg.size[1]),
      a: Math.random() * Math.PI * 2,
      s: cfg.speed * rand(0.6, 1.4),
      glow: rand(0.25, 0.6),
    }));

    const onResize = () => {
      w = cvs.width = window.innerWidth;
      h = cvs.height = window.innerHeight;
    };
    const onVis = () => {
      hidden.current = document.hidden;
      if (!hidden.current && reqRef.current === null) loop(0);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    function loop(ts: number) {
      if (hidden.current) { reqRef.current = null; return; }
      const dt = Math.min(33, ts - last.current || 16);
      last.current = ts;

      ctx.clearRect(0, 0, w, h);

      for (const p of P) {
        p.x += Math.cos(p.a) * p.s * dt;
        p.y += Math.sin(p.a) * p.s * dt;

        // wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // outer glow
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(167,139,250,${0.12 * p.glow})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = `rgba(236,233,255,0.75)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      reqRef.current = requestAnimationFrame(loop);
    }

    reqRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [cfg]);

  return <canvas ref={ref} className="absolute inset-0" aria-hidden />;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/** Sigils: heksen/waarzeg-symbolen (SVG) zweven subtiel */
function SigilsLayer({ intensity }: { intensity: Intensity }) {
  const count = intensity === "high" ? 14 : intensity === "medium" ? 10 : 6;

  // mini SVG’s: maan, pentakel, oog, kristalbol, tarot kaart, kaars
  const icons = [
    // Crescent Moon
    (props: any) => (
      <svg viewBox="0 0 24 24" {...props}><path fill="currentColor"
        d="M12 2c-1.3 0-2.6.3-3.7.9A9 9 0 1 0 21 15.7C19.9 16 18.7 16 17.6 16a7 7 0 0 1-5.6-14Z"/></svg>
    ),
    // Pentacle (ster in cirkel)
    (props: any) => (
      <svg viewBox="0 0 24 24" {...props}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M12 4l2.4 6.9H21l-5.4 3.9L17.8 22 12 17.8 6.2 22l2.2-7.2L3 10.9h6.6L12 4z"
          fill="none" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    ),
    // All-seeing Eye
    (props: any) => (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
      </svg>
    ),
    // Crystal Ball
    (props: any) => (
      <svg viewBox="0 0 24 24" {...props}>
        <circle cx="12" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="7" y="16" width="10" height="2.5" rx="1.2" fill="currentColor" opacity=".12"/>
        <rect x="6" y="19" width="12" height="2" rx="1" fill="currentColor" opacity=".12"/>
      </svg>
    ),
    // Tarot Card
    (props: any) => (
      <svg viewBox="0 0 24 24" {...props}>
        <rect x="7" y="3" width="10" height="18" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M9 7h6M9 10h6M9 13h6" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
    // Candle
    (props: any) => (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M10 4c0-1.1 1-2 2-2s2 .9 2 2c0 1-1.2 2.1-2 3-1-1-2-2-2-3Z" fill="currentColor"/>
        <rect x="9" y="8" width="6" height="10" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8" y="18" width="8" height="2.5" rx="1" fill="currentColor" opacity=".15"/>
      </svg>
    ),
  ];

  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const Icon = icons[i % icons.length];
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 6;  // desynchroniseer
      const dur = 10 + Math.random() * 10;
      const size = 16 + Math.random() * 20; // px
      const opacity = 0.06 + Math.random() * 0.12;
      const hue = [260, 200, 160][Math.floor(Math.random()*3)]; // violet -> teal -> goud
      return { Icon, left, top, delay, dur, size, opacity, hue };
    });
  }, [count]);

  return (
    <div className="absolute inset-0" aria-hidden>
      {items.map((it, idx) => (
        <div
          key={idx}
          className="absolute"
          style={{
            left: `${it.left}%`,
            top: `${it.top}%`,
            animation: `floatY ${it.dur}s ease-in-out ${it.delay}s infinite`,
            transformOrigin: "50% 50%",
            willChange: "transform, opacity",
            opacity: it.opacity,
            color: `hsl(${it.hue} 70% 70%)`
          }}
        >
          <it.Icon width={it.size} height={it.size} />
        </div>
      ))}
    </div>
  );
}