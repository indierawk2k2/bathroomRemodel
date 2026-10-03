// 3" x 6" white glass subway, STACKED grid (no stagger), long edge
// horizontal, 5/16" (8 mm) thick, bright white 1/16" grout.
// Uses ctx.textures.tile_white_subway_stacked when present, else a
// procedural 24" x 24" repeat (4 x 8 tiles).
//
// The procedural generator is shared with the coloured "Glazed subway tile"
// paint finish (src/options/paints/paint.js): makeGlassSubway(THREE,
// { tint, grout }) draws the same tiles tinted with an sRGB colour.  Without
// a tint (the white option) the output is exactly the original white glass.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, hash2, smoothstep, tileMaterial } from '../procedural.js';

const IN = 0.0254;
const TW = 6, TH = 3, NX = 4, NY = 8;
export const GLASS_SUBWAY_REPEAT_M = [NX * TW * IN, NY * TH * IN];
const REPEAT_M = GLASS_SUBWAY_REPEAT_M;
const PPI = 48;                         // 1152 x 1152
const W = NX * TW * PPI, H = NY * TH * PPI;
const WHITE_GROUT = [0.93, 0.93, 0.92];

/**
 * Colour-independent part of the generator, per pixel: grout mask + grout
 * noise, bevel (0 at the tile edge .. 1 on the face), per-tile random,
 * pressed-glass ripple, and the height / roughness / clearcoat buffers.
 * Arr = Float64Array keeps every intermediate at full precision (the white
 * option, bit-identical to the pre-refactor generator); the cached tinted
 * fields use Float32Array to halve the memory.
 */
export function subwayFields(Arr = Float32Array) {
  const tw = TW * PPI, th = TH * PPI, g = (1 / 32) * PPI; // half grout = 1/32"
  const n = W * H;
  const grout = new Uint8Array(n), gn = new Arr(n), bevel = new Arr(n);
  const rnd = new Arr(n), wave = new Arr(n);
  const height = new Float32Array(n), rough = new Float32Array(n), coat = new Float32Array(n);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const tx = Math.floor(x / tw), ty = Math.floor(y / th);
      const lx = x - tx * tw, ly = y - ty * th;
      const e = Math.min(lx, tw - lx, ly, th - ly);   // px to tile edge (grout centre)
      if (e < g) {
        grout[i] = 1;
        gn[i] = fbm(x, y, W, H, 48, 2, 3) * 0.04;
        height[i] = 0; rough[i] = 0.85; coat[i] = 0;
        continue;
      }
      const ee = e - g;
      const b = smoothstep(0, 0.09 * PPI, ee);  // eased glass edge
      const wv = fbm(x, y, W, H, 12, 3, 9);       // faint pressed-glass ripple
      bevel[i] = b; rnd[i] = hash2(tx, ty, 41); wave[i] = wv;
      height[i] = 0.15 + 0.8 * Math.sqrt(b) + 0.03 * wv;
      rough[i] = 0.18; coat[i] = 1;
    }
  }
  return { w: W, h: H, grout, gn, bevel, rnd, wave, height, rough, coat };
}

/**
 * Albedo (sRGB 0..1).  tint = null: back-painted white glass (the original
 * look).  tint = [r, g, b]: tinted glass, a little deeper where the glass is
 * thick at the eased edge.  grout = [r, g, b].
 */
export function subwayAlbedo(F, tint, grout) {
  const albedo = new Float32Array(W * H * 3);
  const [gr, gg, gb] = grout;
  for (let i = 0, n = W * H; i < n; i++) {
    if (F.grout[i]) {
      const k = F.gn[i];
      albedo[i * 3] = gr - k; albedo[i * 3 + 1] = gg - k; albedo[i * 3 + 2] = gb - k;
      continue;
    }
    const bevel = F.bevel[i], rnd = F.rnd[i], wave = F.wave[i];
    if (!tint) {
      // Back-painted white glass: near white, a touch of green-blue where
      // the glass is thick at the eased edge.
      const edgeTint = (1 - bevel) * 0.10;
      const base = 0.90 + rnd * 0.035 + (wave - 0.5) * 0.02;
      albedo[i * 3] = base - edgeTint * 1.2;
      albedo[i * 3 + 1] = base - edgeTint * 0.4;
      albedo[i * 3 + 2] = base - edgeTint * 0.5 + 0.01;
    } else {
      // Tinted glass: per-tile batch variation, faint ripple, eased edge
      // slightly darker (more glass in the light path).
      const k = (0.97 + rnd * 0.06 + (wave - 0.5) * 0.04) * (1 - (1 - bevel) * 0.28);
      albedo[i * 3] = Math.min(1, tint[0] * k);
      albedo[i * 3 + 1] = Math.min(1, tint[1] * k);
      albedo[i * 3 + 2] = Math.min(1, tint[2] * k);
    }
  }
  return albedo;
}

function makeSubway(THREE) {
  const F = subwayFields(Float64Array);
  return buildMaps(THREE, { w: W, h: H, albedo: subwayAlbedo(F, null, WHITE_GROUT), height: F.height, rough: F.rough, coat: F.coat },
    { normalStrength: 5 });
}

/**
 * Tinted glass subway maps (stacked 3x6 grid, same geometry as the white
 * option).  The colour-independent fields and the normal / roughness maps
 * are built once; each colour only redraws the albedo.  The last few albedo
 * textures are kept; older ones release their GPU copy.
 *   tint, grout: sRGB [r, g, b] 0..1
 */
const _albedoLru = new Map();
export function makeGlassSubway(THREE, { tint, grout = [0.80, 0.80, 0.79] }) {
  const F = cached(THREE, 'glass-subway-fields', subwayFields);
  const shared = cached(THREE, 'glass-subway-shared', () =>
    buildMaps(THREE, { w: W, h: H, height: F.height, rough: F.rough, coat: F.coat }, { normalStrength: 5 }));
  const key = tint.map((v) => v.toFixed(4)).join(',') + '|' + grout.map((v) => v.toFixed(4)).join(',');
  let map = _albedoLru.get(key);
  if (map) {
    _albedoLru.delete(key);
    _albedoLru.set(key, map);
  } else {
    map = buildMaps(THREE, { w: W, h: H, albedo: subwayAlbedo(F, tint, grout) }).map;
    _albedoLru.set(key, map);
    while (_albedoLru.size > 6) {
      const [k0, t0] = _albedoLru.entries().next().value;
      _albedoLru.delete(k0);
      t0.dispose(); // GPU copy only; re-uploaded if a live material still uses it
    }
  }
  return { map, normalMap: shared.normalMap, roughnessMap: shared.roughnessMap };
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
