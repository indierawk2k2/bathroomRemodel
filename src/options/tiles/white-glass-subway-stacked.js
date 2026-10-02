// 3" x 6" white glass subway, STACKED grid (no stagger), long edge
// horizontal, 5/16" (8 mm) thick, bright white 1/16" grout.
// Uses ctx.textures.tile_white_subway_stacked when present, else a
// procedural 24" x 24" repeat (4 x 8 tiles).
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, hash2, smoothstep, tileMaterial } from '../procedural.js';

const IN = 0.0254;
const TW = 6, TH = 3, NX = 4, NY = 8;
const REPEAT_M = [NX * TW * IN, NY * TH * IN];

function makeSubway(THREE) {
  const PPI = 48;                         // 1152 x 1152
  const w = NX * TW * PPI, h = NY * TH * PPI;
  const tw = TW * PPI, th = TH * PPI, g = (1 / 32) * PPI; // half grout = 1/32"
  const albedo = new Float32Array(w * h * 3), height = new Float32Array(w * h);
  const rough = new Float32Array(w * h), coat = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const tx = Math.floor(x / tw), ty = Math.floor(y / th);
      const lx = x - tx * tw, ly = y - ty * th;
      const e = Math.min(lx, tw - lx, ly, th - ly);   // px to tile edge (grout centre)
      if (e < g) {
        const n = fbm(x, y, w, h, 48, 2, 3) * 0.04;
        albedo[i * 3] = 0.93 - n; albedo[i * 3 + 1] = 0.93 - n; albedo[i * 3 + 2] = 0.92 - n;
        height[i] = 0; rough[i] = 0.85; coat[i] = 0;
        continue;
      }
      const ee = e - g;
      const bevel = smoothstep(0, 0.09 * PPI, ee);  // eased glass edge
      const rnd = hash2(tx, ty, 41);
      const wave = fbm(x, y, w, h, 12, 3, 9);          // faint pressed-glass ripple
      height[i] = 0.15 + 0.8 * Math.sqrt(bevel) + 0.03 * wave;
      // Back-painted white glass: near white, a touch of green-blue where
      // the glass is thick at the eased edge.
      const edgeTint = (1 - bevel) * 0.10;
      const base = 0.90 + rnd * 0.035 + (wave - 0.5) * 0.02;
      albedo[i * 3] = base - edgeTint * 1.2;
      albedo[i * 3 + 1] = base - edgeTint * 0.4;
      albedo[i * 3 + 2] = base - edgeTint * 0.5 + 0.01;
      rough[i] = 0.18; coat[i] = 1;
    }
  }
  return buildMaps(THREE, { w, h, albedo, height, rough, coat }, { normalStrength: 5 });
}

export default {
  id: 'white-glass-subway-stacked',
  name: 'White glass subway 3x6, stacked',
  kind: 'tile',
  order: 20,
  thicknessMm: 8,
  textureName: 'tile_white_subway_stacked',
  repeatM: REPEAT_M,
  groutColor: '#f3f3f1',
  edgeColor: '#dfe7e3',
  description: '3" x 6" white glass, stacked grid, 5/16" thick',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    return tileMaterial(ctx, {
      textureName: 'tile_white_subway_stacked',
      repeatClone,
      texLookup: {
        map: tex(ctx, 'tile_white_subway_stacked'),
        normal: texCompanion(ctx, 'tile_white_subway_stacked', 'normal'),
        roughness: texCompanion(ctx, 'tile_white_subway_stacked', 'roughness'),
      },
      procedural: () => cached(THREE, 'white-subway', () => makeSubway(THREE)),
      params: {
        // Glass look without real transmission: glossy clearcoat over a
        // slightly sheened, high-specular base.
        color: 0xffffff, roughness: 1.0, metalness: 0,
        clearcoat: 1.0, clearcoatRoughness: 0.03,
        specularIntensity: 1.0, ior: 1.52,
        sheen: 0.25, sheenColor: 0xd8ece6, sheenRoughness: 0.3,
        normalScale: 1.0,
      },
    });
  },
  repeatFor(ctx) { return physicalSize(ctx, 'tile_white_subway_stacked', REPEAT_M); },
};
