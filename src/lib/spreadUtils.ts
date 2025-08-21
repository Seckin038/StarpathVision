export const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max);