// Heroad peel-and-stick "Dark Green and Gold Geometric" contact paper
// (Amazon B0CF5HCQ69; the owners' eBay listing 168714908980).  Columns of
// four nested gold chevrons on a dark green PVC ground, alternate columns
// dropped half a repeat.  17.3" x 78.7" self-adhesive roll.  The maker
// publishes no repeat and no flat image: the texture is the repeat measured
// in a front-on room scene, and its size (0.22 x 0.142 m, two repeats per
// 44 cm roll width, chevrons ~3.5 cm apart) is an estimate from the backing's
// cutting grid and a sofa; see assets/source/wallpapers/SOURCES.md and
// tools/make_textures.py tex_wallpaper_heroad_gold_chevron_dark_green().
// Sheen: roughness in G and metalness in B of the roughness PNG, as for the
// other metallic papers: satin, partly metallic gold lines, embossed PVC.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_heroad_gold_chevron_dark_green';
const REPEAT_M = [0.22, 0.142];

export default {
  id: 'wallpaper-heroad-gold-chevron-dark-green',
  name: 'Heroad peel & stick Gold Chevron, Dark Green (wallpaper)',
  kind: 'wallpaper',
  order: 56,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#0f2321',
  description: 'Heroad peel-and-stick gold chevron on dark green: 17.3" x 78.7" (44 x 200 cm) self-adhesive '
    + 'PVC roll, 9.36 sq ft; gold lines with a slight luster on an embossed vinyl ground; waterproof but '
    + '"not for bathroom use" per the seller. Repeat not published: shown at an estimated 14.2 cm. '
    + 'ebay.com/itm/168714908980 (Amazon B0CF5HCQ69)',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x0f2321, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) {
      m.roughnessMap = repeatClone(THREE, r, false);   // G = roughness
      m.metalnessMap = m.roughnessMap;                 // B = metalness
      m.metalness = 1;
      m.userData.noProbe = true;                       // generic environment, like the other papers
    } else {
      m.roughness = 0.7;
    }
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
