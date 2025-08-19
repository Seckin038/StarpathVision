import React, { useRef } from "react";

export default function Card3D({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current!;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width;
    const dy = (e.clientY - rect.top) / rect.height;
    const rx = (dy - 0.5) * -4; // rotateX
    const ry = (dx - 0.5) * 6;  // rotateY
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  }
  function onLeave() {
    const el = ref.current!;
    el.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)`;
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
        transition-transform duration-200 will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}