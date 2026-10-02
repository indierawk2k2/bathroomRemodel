// Classic white ceramic subway, 3" x 6", running bond (half offset), long
// edge horizontal, 1/4" (6 mm) thick, light grey 1/16" grout.  Procedural:
// no image needed.  Added by following docs/ADDING_OPTIONS.md "procedural
// tile" step by step (br-uio) to prove the recipe.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, hash2, smoothstep, tileMaterial } from '../procedural.js';

const IN = 0.0254;
const NAME = 'tile_white_ceramic_subway_offset';   // texture-pack name, if one is ever made
const TW = 6, TH = 3, NX = 4, NY = 8;              // 4 x 8 tiles = 24" x 24" (even rows: offset repeats)
const REPEAT_M = [NX * TW * IN, NY * TH * IN];

function make(THREE) {
  const PPI = 40;                                  // 960 x 960
  const w = NX * TW * PPI, h = NY * TH * PPI;
  const tw = TW * PPI, th = TH * PPI, g = (1 / 32) * PPI; // half grout = 1/32"
  const albedo = new Float32Array(w * h * 3), height = new Float32Array(w * h);
  const rough = new Float32Array(w * h), coat = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = Math.floor(y / th), ly = y - row * th;
    const off = (row & 1) ? tw / 2 : 0;            // running bond
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const xs = (x + off) % w;
      const col = Math.floor(xs / tw), lx = xs - col * tw;
      const e = Math.min(lx, tw - lx, ly, th - ly); // px to the grout centre line
      if (e < g) {
        const n = fbm(x, y, w, h, 48, 2, 5) * 0.05;
        albedo[i * 3] = 0.80 - n; albedo[i * 3 + 1] = 0.80 - n; albedo[i * 3 + 2] = 0.79 - n;
        height[i] = 0; rough[i] = 0.9; coat[i] = 0;
        continue;
      }
      const bevel = smoothstep(0, 0.12 * PPI, e - g);       // soft cushion edge
      const rnd = hash2(col, row, 77);
      const wave = fbm(x, y, w, h, 8, 3, 13);               // gentle glaze ripple
      height[i] = 0.1 + 0.85 * Math.sqrt(bevel) + 0.04 * wave;
      const v = 0.91 + (rnd - 0.5) * 0.025 + (wave - 0.5) * 0.015;
      albedo[i * 3] = v; albedo[i * 3 + 1] = v; albedo[i * 3 + 2] = v - 0.006;
      rough[i] = 0.2; coat[i] = 1;
    }
  }
  return buildMaps(THREE, { w, h, albedo, height, rough, coat }, { normalStrength: 5 });
}

export default {
  id: 'white-ceramic-subway-offset',
  name: 'White ceramic subway 3x6, offset',
  kind: 'tile',
  order: 25,
  thicknessMm: 6,
  textureName: NAME,
  repeatM: REPEAT_M,
  groutColor: '#cdcdca',
  edgeColor: '#ecebe6',
  description: '3" x 6" glossy white ceramic, running bond, 1/4" thick',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    return tileMaterial(ctx, {
      textureName: NAME,
      repeatClone,
      texLookup: { map: tex(ctx, NAME), normal: texCompanion(ctx, NAME, 'normal'), roughness: texCompanion(ctx, NAME, 'roughness') },
      procedural: () => cached(THREE, 'white-ceramic-subway-offset', () => make(THREE)),
      params: { color: 0xffffff, roughness: 1, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.08, normalScale: 1 },
    });
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
