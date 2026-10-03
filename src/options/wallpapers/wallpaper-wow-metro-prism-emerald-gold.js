// World of Wallpaper Metro Prism geometric triangle, Emerald Green / Gold
// (WOW037; B&Q 3294270361047).  Thin metallic-gold lines on a matte emerald
// ground, drawn on a 6.6 x 4.4 cm grid with star nodes; 17.6 cm repeat,
// offset match (the half drop is inside the artwork, so the roll width is a
// whole number of motifs).  One texture = half a roll width x one repeat
// (0.265 x 0.1767 m), from the retailer's flat artwork; see
// assets/source/wallpapers/SOURCES.md and tools/make_textures.py
// tex_wallpaper_wow_metro_prism_emerald_gold().
// Sheen: the roughness PNG carries roughness in G and metalness in B (the
// channels Three.js reads), so the same texture feeds both maps: partial,
// satin metal on the gold lines, matte paper ground.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_wow_metro_prism_emerald_gold';
const REPEAT_M = [0.265, 0.1767];

export default {
  id: 'wallpaper-wow-metro-prism-emerald-gold',
  name: 'World of Wallpaper Metro Prism, Emerald Green & Gold (wallpaper)',
  kind: 'wallpaper',
  order: 55,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#3a5954',
  description: 'World of Wallpaper Metro Prism WOW037, Emerald Green / Gold: 0.53 x 10.05 m roll, 17.6 cm repeat, '
    + 'offset match; metallic gold geometric triangles on a matte emerald ground, paste-the-paper, spongeable '
    + '(B&Q lists it as not for bathrooms or kitchens). '
    + 'worldofwallpaper.com/metro-prism-geometric-triangle-wallpaper-emerald-green-and-gold-wow037.html',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x3a5954, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) {
      m.roughnessMap = repeatClone(THREE, r, false);   // G = roughness
      m.metalnessMap = m.roughnessMap;                 // B = metalness
      m.metalness = 1;
      // Generic environment like the other wall finishes (see the Debona
      // option): the room probe would also feed the matte ground's ambient.
      m.userData.noProbe = true;
    } else {
      m.roughness = 0.8;
    }
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
