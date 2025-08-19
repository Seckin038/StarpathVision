import React from "react";

export default function FancyButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`relative overflow-hidden rounded-xl px-5 py-3 font-medium
        bg-gradient-to-b from-amber-600 to-amber-700 text-black
        shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_10px_30px_rgba(255,200,0,0.15)]
        hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_12px_36px_rgba(255,210,60,0.25)]
        transition-all duration-300
        ${className}`}
    >
      <span className="relative z-10">{children}</span>
      {/* shimmer sweep */}
      <span
        className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/20 blur-sm"
        style={{ animation: "shimmer 1.8s ease-in-out infinite" }}
        aria-hidden
      />
    </button>
  );
}