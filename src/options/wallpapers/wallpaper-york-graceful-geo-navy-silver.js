// York Graceful Geo, Navy / Silver MD7174 (Antonina Vella Modern Metals
// Second Edition).  Weathered metallic-silver recurve ribbons and diamonds
// on navy, non-woven, 27" roll, 25.2" repeat, straight match.  One
// texture = the maker's flat = one roll width x one repeat
// (0.6858 x 0.6401 m); see assets/source/wallpapers/SOURCES.md and
// tools/make_textures.py tex_wallpaper_york_graceful_geo_navy_silver().
// Sheen: roughness in G, metalness in B of the roughness PNG: partly
// metallic satin silver (weathered flecks rougher), matte ground.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_york_graceful_geo_navy_silver';
const REPEAT_M = [0.6858, 0.6401];

export default {
  id: 'wallpaper-york-graceful-geo-navy-silver',
  name: 'York Graceful Geo, Navy / Silver (wallpaper)',
  kind: 'wallpaper',
  order: 59,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#394a5e',
  description: 'York Graceful Geo MD7174, Navy / Silver: 27 in x 26.9 ft double roll, 25.2 in repeat, straight match; '
    + '"burnished, weathered" deep silver metallic ogee trellis on navy (#394A5E, close to Hale Navy #434B56, a touch bluer), '
    + 'unpasted non-woven, "washable and strippable". $290 per double roll seen 2026-10-02. '
    + 'yorkwallcoverings.com/products/graceful-geo-wallpaper',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0x394a5e, roughness: 1, metalness: 0 });
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
