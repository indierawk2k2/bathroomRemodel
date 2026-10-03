// Arthouse Orson Navy Trellis AH909702 (Brewster).  Thin pale lines in an
// elongated-hexagon trellis on navy, paper, 20.9" roll, 20.9" repeat,
// straight match.  The artwork repeats every 3.48" x 6.97" (6 x 3 per
// repeat), so one texture = one of those cells (0.0885 x 0.177 m); see
// assets/source/wallpapers/SOURCES.md and tools/make_textures.py
// tex_wallpaper_arthouse_orson_navy_trellis().
// Sheen: the roughness PNG carries roughness in G and metalness in B; the
// lines are lightly metallic (0.25), the paper ground matte.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_arthouse_orson_navy_trellis';
const REPEAT_M = [0.0885, 0.177];

export default {
  id: 'wallpaper-arthouse-orson-navy-trellis',
  name: 'Arthouse Orson Navy Trellis (wallpaper)',
  kind: 'wallpaper',
  order: 58.5,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#3a495c',
  description: 'Arthouse Orson Navy Trellis AH909702: 20.9 in x 33 ft roll, 20.9 in repeat, straight match; pale '
    + 'elongated-hexagon linework on navy (#3A495C, very close to Hale Navy #434B56, a touch bluer), unpasted paper, '
    + '"spongeable and wet removable"; lines shown lightly metallic (the retailer calls them white). '
    + '$25.00 per roll seen 2026-10-02. wallpaperwarehouse.com/products/brewster-orson-navy-trellis-wallpaper-ah909702',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x3a495c, roughness: 1, metalness: 0 });
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
