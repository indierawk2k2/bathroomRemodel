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
// `makeMaterial` are tiles (kind 'tile'), wallpapers (kind 'wallpaper') or
// paint colours (kind 'paint').
import * as self from './index.js';
import { registerTile, registerLight } from './registry.js';

// ---- tiles --------------------------------------------------------------
export { default as sageFan } from './tiles/sage-fan.js';
export { default as whiteGlassSubwayStacked } from './tiles/white-glass-subway-stacked.js';
export { default as whiteCeramicSubwayOffset } from './tiles/white-ceramic-subway-offset.js';
// fan / fish-scale tiles (tiles/fanTile.js factory; br-s42): navy group, then teal / green
export { default as revaliaRadiantBlueFan } from './tiles/revalia-radiant-blue-fan.js';
export { default as mercurySlateFishScaleMedium } from './tiles/mercury-slate-fish-scale-medium.js';
export { default as mercurySlateFishScaleLarge } from './tiles/mercury-slate-fish-scale-large.js';
export { default as mercuryDenimFishScaleLarge } from './tiles/mercury-denim-fish-scale-large.js';
export { default as fireclayNavyOgeeDrop } from './tiles/fireclay-navy-ogee-drop.js';
export { default as nabiMidnightBlueFishscale } from './tiles/nabi-midnight-blue-fishscale.js';
export { default as miramoReefFan } from './tiles/miramo-reef-fan.js';
export { default as miramoHorizonFan } from './tiles/miramo-horizon-fan.js';
export { default as mercuryCanopyFishScaleLarge } from './tiles/mercury-canopy-fish-scale-large.js';
export { default as fireclayEvergreenOgeeDrop } from './tiles/fireclay-evergreen-ogee-drop.js';

// ---- wallpapers (kind:'wallpaper', thicknessMm 0) ------------------------
export { default as wallpaperSample } from './wallpapers/wallpaper-sample.js';
export { default as wallpaperColeSonFeatherFanSoftOlive } from './wallpapers/wallpaper-cole-son-feather-fan-soft-olive.js';
export { default as wallpaperRebelWallsRippleBlue } from './wallpapers/wallpaper-rebel-walls-ripple-blue.js';
export { default as wallpaperDebonaCrystalTrellisBlueSilver } from './wallpapers/wallpaper-debona-crystal-trellis-blue-silver.js';
export { default as wallpaperWowMetroPrismEmeraldGold } from './wallpapers/wallpaper-wow-metro-prism-emerald-gold.js';
export { default as wallpaperHeroadGoldChevronDarkGreen } from './wallpapers/wallpaper-heroad-gold-chevron-dark-green.js';
export { default as wallpaperChesapeakeQuelalaRingOgeeNavy } from './wallpapers/wallpaper-chesapeake-quelala-ring-ogee-navy.js';
export { default as wallpaperSchumacherImperialTrellisIiIvoryNavy } from './wallpapers/wallpaper-schumacher-imperial-trellis-ii-ivory-navy.js';
export { default as wallpaperSpoonflowerGeometricTrellisWhiteNavy } from './wallpapers/wallpaper-spoonflower-geometric-trellis-white-navy.js';
export { default as wallpaperArthouseOrsonNavyTrellis } from './wallpapers/wallpaper-arthouse-orson-navy-trellis.js';
export { default as wallpaperYorkGracefulGeoNavySilver } from './wallpapers/wallpaper-york-graceful-geo-navy-silver.js';
export { default as wallpaperAStreetLiviaDarkBlueTrellis } from './wallpapers/wallpaper-a-street-livia-dark-blue-trellis.js';
export { default as wallpaperChesapeakeTapRootDarkBlue } from './wallpapers/wallpaper-chesapeake-tap-root-dark-blue.js';

// ---- paint colours (kind:'paint'; src/options/paints/paint.js) ----------
// Ordered by hue: teal, green, navy, plum, terracotta.  Colours saved from
// the panel's colour chooser are registered at startup by paints/custom.js.
export { default as paintVardo } from './paints/vardo.js';
export { default as paintHuntClub } from './paints/hunt-club.js';
export { default as paintHaleNavy } from './paints/hale-navy.js';
export { default as paintBrinjal } from './paints/brinjal.js';
export { default as paintCavernClay } from './paints/cavern-clay.js';

// ---- lights -------------------------------------------------------------
export { default as rattanLinear } from './lights/rattan-linear.js';
export { default as monteauxPendant } from './lights/monteaux-pendant.js';
export { default as harlanSconces } from './lights/harlan-sconces.js';
export { default as andersPendants } from './lights/anders-pendants.js';
export { default as claxyRodPendants } from './lights/claxy-rod-pendants.js';
// opal-glass sconce pairs, group A (br-d6l)
export { default as rigdonSconces } from './lights/rigdon-sconces.js';
export { default as paoloSconces } from './lights/paolo-sconces.js';

// -------------------------------------------------------------------------
export * from './registry.js';

for (const v of Object.values(self)) {
  if (!v || typeof v !== 'object' || typeof v.id !== 'string') continue;
  if (typeof v.build === 'function') registerLight(v);
  else if (typeof v.makeMaterial === 'function') registerTile(v);
}
