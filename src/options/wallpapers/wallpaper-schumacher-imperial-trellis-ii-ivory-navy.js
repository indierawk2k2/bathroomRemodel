// Schumacher Imperial Trellis II, Ivory / Navy 5005801 (Print Happy).
// Ivory trellis on navy, matte paper, 27" roll, straight match.  Listed
// repeat 12.625" x 6.75"; the artwork (and the maker's room photo) has a
// 2.05 : 1 cell, so the 12.625" vertical repeat sets the scale and the
// cell is 6.15" across.  One texture = one cell (0.1562 x 0.3207 m); see
// assets/source/wallpapers/SOURCES.md and tools/make_textures.py
// tex_wallpaper_schumacher_imperial_trellis_ii_ivory_navy().
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_schumacher_imperial_trellis_ii_ivory_navy';
const REPEAT_M = [0.1562, 0.3207];

export default {
  id: 'wallpaper-schumacher-imperial-trellis-ii-ivory-navy',
  name: 'Schumacher Imperial Trellis II, Ivory / Navy (wallpaper)',
  kind: 'wallpaper',
  order: 57.5,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#32415e',
  description: 'Schumacher Imperial Trellis II 5005801, Ivory / Navy (Print Happy): 27 in x 4.5 yd roll, paper, pretrimmed, '
    + '12.625 in repeat, straight match (listed 6.75 in across; the artwork measures 6.15 in); ivory on navy '
    + '(#32415E, darker and bluer than Hale Navy #434B56), "washable". Price not shown without a trade login. '
    + 'schumacher.com/catalog/products/5005801',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x32415e, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.85;
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
