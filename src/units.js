// Unit helpers. Three.js works in metres; the room is measured in inches.
export const IN = 0.0254;
export const inch = (n) => n * IN;
export const ft = (n) => n * 12 * IN;
export const mm = (n) => n / 1000;
/** metres -> inches (for UI read-outs) */
export const toInch = (m) => m / IN;
