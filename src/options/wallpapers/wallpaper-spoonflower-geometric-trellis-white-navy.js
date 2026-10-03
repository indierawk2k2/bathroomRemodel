// Spoonflower design 15299902 "Traditional Geometric Trellis White on
// Navy Blue" (allisonrichardson), printed to order on 24" panels, 6"
// repeat.  Spoonflower only serves a 400 px swatch, so the texture is that
// swatch's single 262 px repeat, its white-line mask upscaled 4x and
// re-thresholded (0.1524 m square); see assets/source/wallpapers/SOURCES.md
// and tools/make_textures.py tex_wallpaper_spoonflower_geometric_trellis_white_navy().
// Finish: modelled on the vinyl substrate (satin, fine grain).
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_spoonflower_geometric_trellis_white_navy';
const REPEAT_M = [0.1524, 0.1524];

export default {
  id: 'wallpaper-spoonflower-geometric-trellis-white-navy',
  name: 'Spoonflower Traditional Geometric Trellis, White on Navy (wallpaper)',
  kind: 'wallpaper',
  order: 58,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#3b5272',
  description: 'Spoonflower 15299902 Traditional Geometric Trellis, White on Navy Blue (allisonrichardson): printed to order, '
    + '24 in wide panels, 6 in repeat; white interlaced trellis on navy (#3B5272, bluer and a little lighter than '
    + 'Hale Navy #434B56); shown as the vinyl substrate, the one listed for bathrooms. Rebuilt 4x from a 400 px swatch. '
    + '$96.75 per panel (peel and stick, default size, 25% off $129) seen 2026-10-02. spoonflower.com/en/wallpaper/15299902',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x3b5272, roughness: 1, metalness: 0 });
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
