// Imports every option file and registers it.
//
// Adding an option = create ONE file under tiles/, wallpapers/ or lights/
// and add ONE `export { default as ... } from` line in the matching block
// below.  Nothing else.  (See docs/ADDING_OPTIONS.md.)  UI order comes from
// each option's optional `order` number (then name), because a module
// namespace lists its exports alphabetically.
//
// How: this module imports its own namespace, then registers every export
// that looks like an option: objects with `build` are lights, objects with
// `makeMaterial` are tiles (kind 'tile') or wallpapers (kind 'wallpaper').
import * as self from './index.js';
import { registerTile, registerLight } from './registry.js';

// ---- tiles --------------------------------------------------------------
export { default as sageFan } from './tiles/sage-fan.js';
export { default as whiteGlassSubwayStacked } from './tiles/white-glass-subway-stacked.js';
export { default as whiteCeramicSubwayOffset } from './tiles/white-ceramic-subway-offset.js';

// ---- wallpapers (kind:'wallpaper', thicknessMm 0) ------------------------
export { default as wallpaperSample } from './wallpapers/wallpaper-sample.js';
export { default as wallpaperColeSonFeatherFanSoftOlive } from './wallpapers/wallpaper-cole-son-feather-fan-soft-olive.js';
export { default as wallpaperRebelWallsRippleBlue } from './wallpapers/wallpaper-rebel-walls-ripple-blue.js';
export { default as wallpaperDebonaCrystalTrellisBlueSilver } from './wallpapers/wallpaper-debona-crystal-trellis-blue-silver.js';

// ---- lights -------------------------------------------------------------
export { default as rattanLinear } from './lights/rattan-linear.js';
export { default as monteauxPendant } from './lights/monteaux-pendant.js';
export { default as harlanSconces } from './lights/harlan-sconces.js';
export { default as andersPendants } from './lights/anders-pendants.js';
export { default as claxyRodPendants } from './lights/claxy-rod-pendants.js';

// -------------------------------------------------------------------------
export * from './registry.js';

for (const v of Object.values(self)) {
  if (!v || typeof v !== 'object' || typeof v.id !== 'string') continue;
  if (typeof v.build === 'function') registerLight(v);
  else if (typeof v.makeMaterial === 'function') registerTile(v);
}
