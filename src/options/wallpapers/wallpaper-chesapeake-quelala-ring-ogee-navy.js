// Chesapeake (York Wallcoverings) Quelala Ring Ogee, Navy 3122-11002.
// Bold white interlocking rings on a variegated navy ground, prepasted
// acrylic-coated paper.  10.5" repeat, straight match, 20.5" roll: one
// texture = a quarter of the roll width x one repeat (0.131 x 0.2667 m),
// from York's flat artwork; see assets/source/wallpapers/SOURCES.md and
// tools/make_textures.py tex_wallpaper_chesapeake_quelala_ring_ogee_navy().
// Finish: smooth acrylic-coated paper, light satin, no metal.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_chesapeake_quelala_ring_ogee_navy';
const REPEAT_M = [0.131, 0.2667];

export default {
  id: 'wallpaper-chesapeake-quelala-ring-ogee-navy',
  name: 'Chesapeake Quelala Ring Ogee, Navy (wallpaper)',
  kind: 'wallpaper',
  order: 57,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#3c5670',
  description: 'Chesapeake (York) Quelala Ring Ogee 3122-11002, Navy: 20.5 in x 33 ft double roll, 10.5 in repeat, '
    + 'straight match; white ring ogee on a variegated navy ground (#3C5670, bluer and a little lighter than Hale Navy #434B56), '
    + 'prepasted acrylic-coated paper, "washable and strippable". $110 per double roll seen 2026-10-02. '
    + 'yorkwallcoverings.com/products/chesapeake-quelala-ring-ogee-wallpaper',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x3c5670, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.7;
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
