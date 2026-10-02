// Dev-only stand-in for src/units.js (owned by the room/viewer agent).
// Same API: metres internally, readable inches in source.
export const IN = 0.0254;
export const inch = (n) => n * IN;
export const ft = (n) => n * 12 * IN;
export const mm = (n) => n / 1000;
