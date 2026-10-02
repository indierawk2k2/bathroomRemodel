// Cole & Son Feather Fan (Icons collection), colourway Soft Olive 112/10037.
// This is the paper Perigold sells as QWH8178, colour "Old Olive".  White
// pointillist fans on a sage-olive paper ground.  Roll 0.53 m x 10.05 m,
// pattern repeat 10.6 cm, straight match, 3 fans (17.67 cm each) per roll width.
// The texture is one rectangular repeat (17.67 x 10.6 cm), cut from the
// retailer's flat artwork: assets/source/wallpapers/SOURCES.md and
// tools/make_textures.py tex_wallpaper_cole_son_feather_fan_soft_olive().
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_cole_son_feather_fan_soft_olive';
const REPEAT_M = [0.53 / 3, 0.106];   // used only if the manifest lacks physicalSizeM

export default {
  id: 'wallpaper-cole-son-feather-fan-soft-olive',
  name: 'Cole & Son Feather Fan, Soft Olive (wallpaper)',
  kind: 'wallpaper',
  order: 51,
  thicknessMm: 0,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#c9ccb8',
  description: 'Cole & Son Icons Feather Fan 112/10037 Soft Olive (Perigold QWH8178 "Old Olive"): '
    + 'paper, 21" (0.53 m) x 33\' (10.05 m) roll, 10.6 cm (4.2") repeat, straight match, 7" fans. '
    + 'perigold.com/decor/pdp/cole-sons-qwh8178.html',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0xd9dbce, roughness: 1, metalness: 0 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.82;
    m.name = NAME;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
