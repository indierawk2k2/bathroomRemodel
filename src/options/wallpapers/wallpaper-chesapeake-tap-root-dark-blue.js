// Chesapeake Tap Root Dark Blue Floral Damask 4169-27600 (Oak & Moss).
// Arched wildflower scallops in aqua, beige, sky blue, taupe and cream on a
// linen-textured dark blue ground, unpasted non-woven, 20.5" roll, 10.25"
// repeat, straight match.  One texture = half the roll width x one repeat
// (0.2603 x 0.2603 m), from Brewster's flat artwork; see
// assets/source/wallpapers/SOURCES.md and tools/make_textures.py
// tex_wallpaper_chesapeake_tap_root_dark_blue().
// Finish: matte non-woven, flat inks, no metal.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_chesapeake_tap_root_dark_blue';
const REPEAT_M = [0.2603, 0.2603];

export default {
  id: 'wallpaper-chesapeake-tap-root-dark-blue',
  name: 'Chesapeake Tap Root Dark Blue Floral Damask (wallpaper)',
  kind: 'wallpaper',
  order: 59.6,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#364656',
  description: 'Chesapeake (Brewster) Tap Root 4169-27600, Dark Blue, book Oak & Moss: 20.5 in x 33 ft roll, 10.25 in repeat '
    + '(Brewster; Total Wallcovering lists 20.86 in, the artwork agrees with 10.25), straight match; wildflower scallop damask '
    + 'on a linen-look dark blue ground (#364656, darker and bluer than Hale Navy #434B56), unpasted non-woven, '
    + '"Washable", "Strippable". $102.00 sale ($120.00 regular) per roll seen 2026-10-02. '
    + 'totalwallcovering.com/p122666/tap-root-dark-blue-floral-damask-wallpaper.aspx',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x364656, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.87;
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
