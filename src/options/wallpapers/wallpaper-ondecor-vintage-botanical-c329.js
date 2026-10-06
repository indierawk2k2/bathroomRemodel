// Ondecor C329 "Floral Wallpaper with a Vintage Botanical Motif in Blue,
// Beige, and Teal": blue-grey, beige, cream and teal botanicals on a
// near-black charcoal ground, printed to order (USA, Canon UVgel) on 24"
// rolls, 24" x 24" repeat ("A full 24" pattern repeats once in a 24" wide
// roll").  Ondecor offers no flat image, so the texture is one repeat
// (0.6096 m square) averaged from the bench mock-up C329_04 and graded to
// the flat pattern detail on the product's info card; see
// assets/source/wallpapers/SOURCES.md and tools/make_textures.py
// tex_wallpaper_ondecor_vintage_botanical_c329().
// Finish: matte (smooth / canvas paper), flat inks, no metal.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_ondecor_vintage_botanical_c329';
const REPEAT_M = [0.6096, 0.6096];

export default {
  id: 'wallpaper-ondecor-vintage-botanical-c329',
  name: 'Ondecor Vintage Botanical C329, Blue / Beige / Teal (wallpaper)',
  kind: 'wallpaper',
  order: 59.7,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#3e3e42',
  description: 'Ondecor C329 Floral Wallpaper with a Vintage Botanical Motif in Blue, Beige, and Teal: printed to order, '
    + '24 in wide rolls 76-148 in long, 24 in x 24 in repeat (one repeat per roll width); botanicals on a near-black '
    + 'charcoal ground (#3E3E42). Smooth, canvas or fabric peel and stick, or smooth / canvas traditional (paste). '
    + 'Ondecor says "water-resistant, fade-resistant, and scratch-resistant"; not labelled for bathrooms. '
    + '$51.00-$119.00 per roll by length and material seen 2026-10-05. Built from a room mock-up (no flat offered). '
    + 'ondecor.com/products/floral-wallpaper-vintage-botanical-motif-blue-beige-teal-c329',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x3e3e42, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.80;
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
