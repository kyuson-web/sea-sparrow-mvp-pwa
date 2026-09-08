export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}
export function waveHeight(x, z, t) {
  return Math.sin(x * 0.018 + t * 0.9) * 0.55
       + Math.sin(z * 0.015 - t * 0.7) * 0.45
       + Math.sin((x + z) * 0.008 + t * 1.4) * 0.30;
}