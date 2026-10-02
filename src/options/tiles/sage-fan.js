// Daltile Handcrafted Sage Fan (photo 01): ~4" fan / fish-scale mosaic,
// muted sage-green glossy glaze with handmade variation, 10 mm thick,
// light grey grout.  Uses ctx.textures.tile_sage_fan when present; otherwise
// draws the scallops procedurally (periodic 16" x 20" repeat).
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, hash2, smoothstep, hexToRgb, tileMaterial } from '../procedural.js';

const IN = 0.0254;
const COLS = 4, ROWS = 8;           // scales per repeat
const SCALE_W = 4, PITCH = 2.5;     // inches: fan width, row pitch
const REPEAT_M = [COLS * SCALE_W * IN, ROWS * PITCH * IN]; // 16" x 20"

function makeSageFan(THREE) {
  const PPI = 56;                      // px per inch -> 896 x 1120
  const w = COLS * SCALE_W * PPI, h = ROWS * PITCH * PPI;
  const r = SCALE_W * PPI / 2, p = PITCH * PPI, grout = 0.07 * PPI; // ~1/16" half-width grout
  const albedo = new Float32Array(w * h * 3), height = new Float32Array(w * h);
  const rough = new Float32Array(w * h), coat = new Float32Array(w * h);
  const glazeA = hexToRgb('#7d8b78'), glazeB = hexToRgb('#a3ad98'), glazeDark = hexToRgb('#5f6c5d');
  const groutC = hexToRgb('#cfcdc6');

  // Scale (col, row): row j centre at y = j*p + r*0.2, odd rows shifted half a fan.
  const cx = (c, j) => (c + (j & 1 ? 0.5 : 0)) * 2 * r;
  const cy = (j) => j * p + r * 0.15;
  // Signed "inside" distance for the tombstone shape (top semicircle + skirt).
  const inside = (x, y, X, Y) => (y <= Y ? r - Math.hypot(x - X, y - Y) : r - Math.abs(x - X));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Owner = lowest row (largest j) whose shape contains the pixel.
      const j0 = Math.floor((y - r * 0.15) / p);
      let owner = null, ownerD = 0;
      const cover = [];
      for (let j = j0 + 2; j >= j0 - 2; j--) {
        const Y = cy(j);
        for (let c = -1; c <= COLS; c++) {
          const X = cx(c, j);
          if (Math.abs(x - X) > r + 2) continue;
          const d = inside(x, y, X, Y);
          if (d > -grout * 2) {
            if (owner === null && d > 0) { owner = { c, j, X, Y }; ownerD = d; }
            else if (owner === null) cover.push(-d);
          }
        }
        if (owner) break;
      }
      // Distance to the nearest covering (lower) scale's arc.
      let edge = ownerD;
      for (const d of cover) edge = Math.min(edge, d);
      const i = y * w + x;
      if (!owner) { owner = { c: 0, j: 0, X: x, Y: y }; edge = 0; }
      const cc = ((owner.c % COLS) + COLS) % COLS, jj = ((owner.j % ROWS) + ROWS) % ROWS;
      const rnd = hash2(cc, jj, 11), rnd2 = hash2(cc, jj, 29);
      if (edge < grout) {
        const n = fbm(x, y, w, h, 64, 2, 5) * 0.08;
        albedo[i * 3] = groutC[0] - n; albedo[i * 3 + 1] = groutC[1] - n; albedo[i * 3 + 2] = groutC[2] - n;
        height[i] = 0.05 * edge / grout; rough[i] = 0.92; coat[i] = 0;
        continue;
      }
      const e = edge - grout;
      // Pillowed edge (bevel ~0.18"), then a gentle handmade undulation.
      const bevel = smoothstep(0, 0.18 * PPI, e);
      const n1 = fbm(x, y, w, h, 16, 4, 3), n2 = fbm(x, y, w, h, 96, 3, 7);
      height[i] = 0.25 + 0.55 * Math.sqrt(bevel) + 0.08 * n1 + 0.02 * n2;
      // Colour: per-scale tone, glaze pooling darker toward the base of the
      // fan and paler where the glaze breaks over the rim.
      const t = rnd * 0.8 + 0.1 + (n1 - 0.5) * 0.35;
      const vy = Math.min(1, Math.max(0, (y - owner.Y + r) / (2 * r + p)));
      const pool = 0.25 * vy + 0.15 * (1 - bevel);
      const rim = 0.18 * (1 - smoothstep(0, 0.10 * PPI, e));
      for (let k = 0; k < 3; k++) {
        let v = glazeA[k] + (glazeB[k] - glazeA[k]) * t;
        v = v + (glazeDark[k] - v) * pool;
        v = v + (0.86 - v) * rim + (n2 - 0.5) * 0.05 + (rnd2 - 0.5) * 0.04;
        albedo[i * 3 + k] = v;
      }
      rough[i] = 0.22 + 0.12 * n2; coat[i] = 1;
    }
  }
  return buildMaps(THREE, { w, h, albedo, height, rough, coat }, { normalStrength: 6 });
}

export default {
  id: 'sage-fan',
  name: 'Sage Fan (Daltile Handcrafted)',
  kind: 'tile',
  order: 10,
  thicknessMm: 10,
  textureName: 'tile_sage_fan',
  repeatM: REPEAT_M,
  groutColor: '#cfcdc6',
  edgeColor: '#8d9a86',
  description: '4" fan mosaic, glossy sage glaze, 3/8" thick',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    return tileMaterial(ctx, {
      textureName: 'tile_sage_fan',
      repeatClone,
      texLookup: {
        map: tex(ctx, 'tile_sage_fan'),
        normal: texCompanion(ctx, 'tile_sage_fan', 'normal'),
        roughness: texCompanion(ctx, 'tile_sage_fan', 'roughness'),
      },
      procedural: () => cached(THREE, 'sage-fan', () => makeSageFan(THREE)),
      params: {
        color: 0xffffff, roughness: 1.0, metalness: 0,
        clearcoat: 0.8, clearcoatRoughness: 0.06,
        specularIntensity: 0.6, sheen: 0.0,
        normalScale: 1.0,
      },
    });
  },
  /** Repeat size actually used for UVs (texture pack value wins). */
  repeatFor(ctx) { return physicalSize(ctx, 'tile_sage_fan', REPEAT_M); },
};
