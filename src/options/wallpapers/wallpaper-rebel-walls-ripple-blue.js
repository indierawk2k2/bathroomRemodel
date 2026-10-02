// Rebel Walls Ripple Blue (R19317, Imperfections collection, Rebel Studio).
// Sold as a "wall mural" printed to the wall's size, but the design repeats
// horizontally and vertically: one pattern tile is 1.00 m x 1.20 m.
// Hand-painted blue wave arches (about 12.5 cm / 4.9" wide) on a worn,
// patinated off-white ground, printed on Rebel Mattic non-woven (matte).
// Rendered like any repeating wallpaper, from the accent's bottom-left corner.
// The texture is the maker's full pattern tile: assets/source/wallpapers/SOURCES.md
// and tools/make_textures.py tex_wallpaper_rebel_walls_ripple_blue().
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_rebel_walls_ripple_blue';
const REPEAT_M = [1.0, 1.2];

export default {
  id: 'wallpaper-rebel-walls-ripple-blue',
  name: 'Rebel Walls Ripple, Blue (wallpaper)',
  kind: 'wallpaper',
  order: 52,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#d9d6d0',
  description: 'Rebel Walls Ripple Blue R19317: printed to wall size in 0.5 m (19.7") panels on Rebel Mattic '
    + 'non-woven (150 g/m², matte); a repeating design, 1.00 x 1.20 m pattern tile. rebelwalls.com/ripple-blue',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x9fb0c8, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.88;
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
