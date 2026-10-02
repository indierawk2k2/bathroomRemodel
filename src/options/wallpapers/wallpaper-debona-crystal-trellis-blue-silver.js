// Debona Crystal Trellis, Blue / Silver 8894 (World of Wallpaper DEB052).
// A metallic-silver ogee / lantern trellis on a crinkled midnight-blue
// ground with glitter: lanterns 13.25 cm (5.2") wide, 16 cm (6.3") repeat,
// four lanterns per 53 cm roll width.  One texture = one roll width x four
// repeats (0.53 x 0.64 m), from the maker's flat artwork; see
// assets/source/wallpapers/SOURCES.md and tools/make_textures.py
// tex_wallpaper_debona_crystal_trellis_blue_silver().
// Sheen: the roughness PNG carries roughness in G and metalness in B (the
// channels Three.js reads), so the same texture feeds both maps: satin metal
// on the trellis, matte ground with sparse glitter flecks.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_debona_crystal_trellis_blue_silver';
const REPEAT_M = [0.53, 0.64];

export default {
  id: 'wallpaper-debona-crystal-trellis-blue-silver',
  name: 'Debona Crystal Trellis, Blue / Silver (wallpaper)',
  kind: 'wallpaper',
  order: 54,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#1c2541',
  description: 'Debona Crystal Trellis 8894, Blue / Silver: 0.53 x 10.05 m roll, 16 cm repeat, offset match; '
    + 'metallic silver trellis on a textured midnight-blue ground with glitter, paste-the-paper, washable '
    + '(B&Q lists it as not for bathrooms). worldofwallpaper.com/us/crystal-trellis-wallpaper-blue-silver-debona-8894.html',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x1c2541, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) {
      m.roughnessMap = repeatClone(THREE, r, false);   // G = roughness
      m.metalnessMap = m.roughnessMap;                 // B = metalness
      m.metalness = 1;
      // Stay on the generic environment like the other wall finishes: the
      // room probe (src/envProbe.js) is for whole-metal fixtures and would
      // also feed the matte ground's diffuse ambient, turning the navy brown.
      m.userData.noProbe = true;
    } else {
      m.roughness = 0.7;
    }
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
