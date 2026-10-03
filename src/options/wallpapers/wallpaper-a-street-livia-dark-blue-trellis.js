// A-Street Prints Livia Dark Blue Trellis 4014-26411 (Seychelles).  White
// fretwork bands with metallic-silver accent lines on deep blue,
// non-woven, 20.5" roll, 10.4" repeat, straight match.  One texture = half
// the roll width x one repeat (0.2603 x 0.2642 m); see
// assets/source/wallpapers/SOURCES.md and tools/make_textures.py
// tex_wallpaper_a_street_livia_dark_blue_trellis().
// Sheen: roughness in G, metalness in B of the roughness PNG: metal only on
// the silver lines; satin white ink, matte ground.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_a_street_livia_dark_blue_trellis';
const REPEAT_M = [0.2603, 0.2642];

export default {
  id: 'wallpaper-a-street-livia-dark-blue-trellis',
  name: 'A-Street Prints Livia Dark Blue Trellis (wallpaper)',
  kind: 'wallpaper',
  order: 59.5,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#33536a',
  description: 'A-Street Prints Livia 4014-26411, Dark Blue: 20.5 in x 33 ft roll, 10.4 in repeat, straight match; white '
    + 'trellis with metallic silver lines on deep blue (#33536A, bluer and more saturated than Hale Navy #434B56), '
    + 'unpasted non-woven, "washable and strippable". $162.00 per roll seen 2026-10-02. '
    + 'wallpaperwarehouse.com/products/livia-dark-blue-trellis-wallpaper',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x33536a, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) {
      m.roughnessMap = repeatClone(THREE, r, false);   // G = roughness
      m.metalnessMap = m.roughnessMap;                 // B = metalness
      m.metalness = 1;
      // Generic environment like the other wall finishes: the room probe
      // would also feed the matte navy ground's ambient (see Debona).
      m.userData.noProbe = true;
    } else {
      m.roughness = 0.8;
    }
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
