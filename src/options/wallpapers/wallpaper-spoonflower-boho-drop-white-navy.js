// Spoonflower design 10023646 "Jumbo stripy boho drop white on navy"
// (juliaschumacher): large stippled drops of white dashes on navy, on a
// centred (half-drop) lattice, printed to order on 24" panels, 22"
// vertical repeat; the swatch puts one drop column across each 24" panel.
// Spoonflower only serves a 400 px swatch, so the texture is one
// rectangular repeat (24" x 22" = 0.6096 x 0.5588 m) completed from the
// swatch and its centring copy, its white mask upscaled 4x; see
// assets/source/wallpapers/SOURCES.md and tools/make_textures.py
// tex_wallpaper_spoonflower_boho_drop_white_navy().
// Finish: modelled on the Vinyl type (satin, leather-textured grain).
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_spoonflower_boho_drop_white_navy';
const REPEAT_M = [0.6096, 0.5588];

export default {
  id: 'wallpaper-spoonflower-boho-drop-white-navy',
  name: 'Spoonflower Jumbo Stripy Boho Drop, White on Navy (wallpaper)',
  kind: 'wallpaper',
  order: 59.8,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#2d3d4c',
  description: 'Spoonflower 10023646 Jumbo Stripy Boho Drop, White on Navy (juliaschumacher): printed to order, 24 in wide, '
    + '1-27 ft lengths, 22 in vertical repeat (page); 24 in across from the swatch lattice; white dash drops on navy '
    + '(#2D3D4C, darker than Hale Navy #434B56). Shown as the Vinyl type ("subtle, leather-textured vinyl", paste, '
    + 'listed for bathrooms); also Peel and Stick, Pre-Pasted, Traditional, PVC-Free Type II, Grasscloth, Gold and '
    + 'Silver Metallic. Rebuilt 4x from a 400 px swatch. $96.75 per 2 ft x 12 ft (25% off $129.00, peel and stick '
    + 'and vinyl) seen 2026-10-05. spoonflower.com/en/wallpaper/10023646',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x2d3d4c, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.58;
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
