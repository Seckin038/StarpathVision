import React, { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type Mode = "gradient" | "particles" | "none";

interface Props {
  mode?: Mode;
  intensity?: "low" | "medium" | "high"; // regelt density/speed
  className?: string; // extra styling vanuit pagina
}

export default function MysticalBackground({
  mode = "gradient",
  intensity = "low",
  className = "",
}: Props) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) mode = mode === "none" ? "none" : "gradient"; // fallback

  return (
    <div className={`pointer-events-none fixed inset-0 -z-10 ${className}`}>
      {mode === "gradient" && <AnimatedGradient />}
      {mode === "particles" && <ParticlesCanvas intensity={intensity} />}
    </div>
  );
}

// --- Animated CSS Gradient (super licht) ---
function AnimatedGradient() {
  return (
    <div
      className="absolute inset-0 bg-noise"
      aria-hidden
    >
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

// --- Canvas Particles (subtiele "sterrenstof") ---
function ParticlesCanvas({ intensity }: { intensity: "low" | "medium" | "high" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reqRef = useRef<number | null>(null);
  const lastTs = useRef<number>(0);
  const hidden = useRef<boolean>(false);

  const config = useMemo(() => {
    const map: Record<string, { count: number; speed: number; size: [number, number] }> = {
      low: { count: 60,  speed: 0.02, size: [0.5, 1.4] },
      medium: { count: 100, speed: 0.03, size: [0.6, 1.8] },
      high: { count: 160, speed: 0.04, size: [0.6, 2.0] },
    };
    return map[intensity] || map.low;
  }, [intensity]);

  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d", { alpha: true })!;
    let w = (cvs.width = window.innerWidth);
    let h = (cvs.height = window.innerHeight);

    const particles = Array.from({ length: config.count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(config.size[0], config.size[1]),
      a: Math.random() * Math.PI * 2,
      s: config.speed * rand(0.6, 1.4), // speed
      glow: rand(0.25, 0.6),
    }));

    const onResize = () => {
      w = cvs.width = window.innerWidth;
      h = cvs.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const onVis = () => {
      hidden.current = document.hidden;
      if (!hidden.current && reqRef.current === null) loop(0); // resume
    };
    document.addEventListener("visibilitychange", onVis);

    function loop(ts: number) {
      if (hidden.current) {
        reqRef.current = null;
        return; // pause when hidden
      }
      const dt = Math.min(33, ts - lastTs.current || 16); // cap delta
      lastTs.current = ts;

      ctx.clearRect(0, 0, w, h);
      
      for (const p of particles) {
        p.x += Math.cos(p.a) * p.s * dt;
        p.y += Math.sin(p.a) * p.s * dt;
        // wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // draw glow
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(167,139,250,${0.12 * p.glow})`); // violettint
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = `rgba(236, 233, 255, ${0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      reqRef.current = requestAnimationFrame(loop);
    }

    const loopId = requestAnimationFrame(loop);
    reqRef.current = loopId;

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [config]);

  return <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}