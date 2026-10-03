// Fan / fish-scale / ogee tile factory (br-s42).  The Daltile Sage Fan
// generator, parametrised, so every scallop mosaic is one makeFanTile() call:
//
//   makeFanTile({ id, name, order, thicknessMm, description,
//     scaleWIn, pitchIn,            // lattice: fan period across a row, row pitch (inches)
//     shape: 'fan' | 'pointed' | 'ogee',
//     domeIn,                       // dome height above the fan centre (default scaleWIn / 2)
//     cols, rows, ppi,              // fans per repeat, rows per repeat (even), px per inch
//     glaze: { base, light, dark }, // sRGB hexes sampled from the product photos
//     variation: { spread, offset, mottle, jitter, hue, value, mottleTiles, speckle },
//     finish: 'gloss' | 'satin' | 'matte' | 'glass',
//     crackle: { cellIn, depth, albedo } | null,
//     undulate: { waveIn, amp } | null,  ribs: { count, amp, albedo, color } | null,
//     grout: { color, halfIn }, rim: { amt, to (0..1 grey or hex), widthIn }, bevelIn, edgeColor,
//     textureName })                // -> registry option (kind 'tile')
//
// Geometry (the Sage Fan's "lowest row wins" rule): every fan is a dome over
// its centre (X, Y) -- a semicircle of radius r = scaleWIn / 2 ('fan'), a
// semi-ellipse when domeIn != r, or a pointed (gothic) arch of height domeIn
// ('pointed') -- with a vertical skirt below; rows are pitchIn apart and odd
// rows shift half a fan; a pixel belongs to the LOWEST row whose shape holds
// it, so lower fans lie over the skirts of upper ones.  That one rule gives
//   - pitch > dome: tombstone fans with a visible straight skirt (Sage Fan),
//   - pitch = dome: classic fish scale, needle tip at the bottom (Miramo),
//   - pitch < dome: lower domes cut the sides; flatter fans with angled
//     corners and short spikes (Mercury Moroccan fish scales).
// The visible chip is dome + pitch tall.  'ogee' is the 'fan' lattice turned
// upside down: a round end at the bottom and a pointed drop at the top whose
// concave flanks are the round ends of the two fans above (Fireclay Ogee Drop).
//
// Bit-identical promise: with the Sage Fan's numbers (sage-fan.js) every
// buffer matches the pre-refactor generator exactly; the extras (hue/value
// jitter, mottled tiles, speckle, crackle, undulation, ribs, glass edge) only
// run when their parameter is set.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, hash2, smoothstep, hexToRgb, valueNoise, tileMaterial } from '../procedural.js';

const IN = 0.0254;

/** Periodic fBm that also tiles when cells * h / w is not a whole number. */
function noiseFn(w, h) {
  return (x, y, cells, oct, seed) => {
    if (Number.isInteger(cells * h / w)) return fbm(x, y, w, h, cells, oct, seed);
    const cy = Math.max(1, Math.round(cells * h / w));
    let s = 0, amp = 0.5, tot = 0, cx = cells, cyy = cy;
    for (let o = 0; o < oct; o++) {
      s += amp * valueNoise(x * cx / w, y * cyy / h, cx, cyy, seed + o * 17);
      tot += amp; amp *= 0.5; cx *= 2; cyy *= 2;
    }
    return s / tot;
  };
}

/** Periodic Voronoi crack mask (1 on a crack line, 0 elsewhere). */
function crackField(w, h, cellPx, widthPx, seed) {
  const nx = Math.max(2, Math.round(w / cellPx)), ny = Math.max(2, Math.round(h / cellPx));
  const sx = w / nx, sy = h / ny;
  const fx = new Float32Array(nx * ny), fy = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    fx[j * nx + i] = (i + 0.1 + 0.8 * hash2(i, j, seed)) * sx;
    fy[j * nx + i] = (j + 0.1 + 0.8 * hash2(i, j, seed + 1)) * sy;
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const cj = Math.floor(y / sy);
    for (let x = 0; x < w; x++) {
      const ci = Math.floor(x / sx);
      let d1 = 1e9, d2 = 1e9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = ci + di, jj = cj + dj;
        const k = (((jj % ny) + ny) % ny) * nx + (((ii % nx) + nx) % nx);
        const px = fx[k] + Math.floor(ii / nx) * w, py = fy[k] + Math.floor(jj / ny) * h;
        const d = Math.hypot(x - px, y - py);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      out[y * w + x] = 1 - smoothstep(0, widthPx, (d2 - d1) * 0.5);
    }
  }
  return out;
}

const FINISH = {
  // base roughness, roughness noise, material params
  gloss: { rough0: 0.22, roughVar: 0.12, params: { clearcoat: 0.8, clearcoatRoughness: 0.06, specularIntensity: 0.6 } },
  satin: { rough0: 0.42, roughVar: 0.12, params: { clearcoat: 0.35, clearcoatRoughness: 0.22, specularIntensity: 0.5 } },
  matte: { rough0: 0.72, roughVar: 0.1, params: { clearcoat: 0.0, clearcoatRoughness: 0.5, specularIntensity: 0.4 } },
  glass: { rough0: 0.08, roughVar: 0.05, params: { clearcoat: 1.0, clearcoatRoughness: 0.03, specularIntensity: 1.0, ior: 1.52 } },
};

/** Fill defaults (all the Sage Fan's numbers). */
function resolve(o) {
  const v = o.variation || {};
  const fin = FINISH[o.finish || 'gloss'] || FINISH.gloss;
  return {
    scaleWIn: o.scaleWIn ?? 4, pitchIn: o.pitchIn ?? 2.5, shape: o.shape || 'fan',
    domeIn: o.domeIn ?? null, cols: o.cols ?? 4, rows: o.rows ?? 8, ppi: o.ppi ?? 56,
    yOff: o.yOff ?? 0.15,
    glaze: o.glaze, grout: { color: '#cfcdc6', halfIn: 0.07, noise: 0.08, ...(o.grout || {}) },
    bevelIn: o.bevelIn ?? 0.18,
    rim: { amt: 0.18, to: 0.86, widthIn: 0.10, ...(o.rim || {}) },
    pool: { v: 0.25, edge: 0.15, ...(o.pool || {}) },
    variation: {
      spread: v.spread ?? 0.8, offset: v.offset ?? 0.1, mottle: v.mottle ?? 0.35, jitter: v.jitter ?? 0.04,
      grain: v.grain ?? 0.05, hue: v.hue ?? 0, value: v.value ?? 0,
      mottleTiles: v.mottleTiles ?? 0, mottleDark: v.mottleDark ?? 0.35, mottleIn: v.mottleIn ?? 0.3, speckle: v.speckle ?? 0,
    },
    relief: { base: 0.25, bevel: 0.55, n1: 0.08, n2: 0.02, ...(o.relief || {}) },
    rough0: o.rough0 ?? fin.rough0, roughVar: o.roughVar ?? fin.roughVar,
    crackle: o.crackle || null, undulate: o.undulate || null, ribs: o.ribs || null,
    glassEdge: o.glassEdge ?? (o.finish === 'glass' ? 0.3 : 0),
    normalStrength: o.normalStrength ?? null,
    debug: !!o.debug,
  };
}

/**
 * The generator.  Returns { w, h, albedo, height, rough, coat } (sRGB albedo
 * 0..1) and the repeat size; pure (no THREE), so node can check it.
 */
export function fanFields(P) {
  const PPI = P.ppi;
  const COLS = P.cols, ROWS = P.rows;
  const w = Math.round(COLS * P.scaleWIn * PPI), h = Math.round(ROWS * P.pitchIn * PPI);
  const r = w / (2 * COLS), p = h / ROWS, grout = P.grout.halfIn * PPI;
  const dome = P.domeIn == null ? r : P.domeIn * PPI;
  const flip = P.shape === 'ogee';
  const albedo = new Float32Array(w * h * 3), height = new Float32Array(w * h);
  const rough = new Float32Array(w * h), coat = new Float32Array(w * h);
  const glazeA = hexToRgb(P.glaze.base), glazeB = hexToRgb(P.glaze.light), glazeDark = hexToRgb(P.glaze.dark);
  const groutC = hexToRgb(P.grout.color);
  const N = noiseFn(w, h);
  const V = P.variation, RM = P.rim, PL = P.pool, RL = P.relief;
  const rimTo = typeof RM.to === 'string' ? hexToRgb(RM.to) : [RM.to, RM.to, RM.to];
  const yo = r * P.yOff;

  const cx = (c, j) => (c + (j & 1 ? 0.5 : 0)) * 2 * r;
  const cy = (j) => j * p + yo;
  // Signed "inside" distance (px) for the dome + skirt shape.
  let inside;
  if (P.shape === 'pointed') {
    const R = (r * r + dome * dome) / (2 * r), c0 = R - r;   // arch arcs centred c0 past the far side
    inside = (x, y, X, Y) => (y <= Y ? R - Math.hypot(Math.abs(x - X) + c0, y - Y) : r - Math.abs(x - X));
  } else if (dome !== r) {
    const k = r / dome;
    inside = (x, y, X, Y) => (y <= Y ? r - Math.hypot(x - X, (y - Y) * k) : r - Math.abs(x - X));
  } else {
    inside = (x, y, X, Y) => (y <= Y ? r - Math.hypot(x - X, y - Y) : r - Math.abs(x - X));
  }
  const span = Math.max(2, Math.ceil((dome + 2 * grout) / p) + 1);
  const cr = P.crackle ? crackField(w, h, P.crackle.cellIn * PPI, P.crackle.widthIn ? P.crackle.widthIn * PPI : 0.9, 91) : null;
  const ribs = P.ribs, und = P.undulate;
  const ownerId = P.debug ? new Int32Array(w * h).fill(-1) : null;   // tools: chip size check

  for (let y = 0; y < h; y++) {
    const gy = flip ? h - 1 - y : y;          // geometry row (ogee: upside down)
    for (let x = 0; x < w; x++) {
      // Owner = lowest row (largest j) whose shape contains the pixel.
      const j0 = Math.floor((gy - yo) / p);
      let owner = null, ownerD = 0;
      const cover = [];
      for (let j = j0 + span; j >= j0 - span; j--) {
        const Y = cy(j);
        for (let c = -1; c <= COLS; c++) {
          const X = cx(c, j);
          if (Math.abs(x - X) > r + 2) continue;
          const d = inside(x, gy, X, Y);
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
      if (!owner) { owner = { c: 0, j: 0, X: x, Y: gy }; edge = 0; }
      const cc = ((owner.c % COLS) + COLS) % COLS, jj = ((owner.j % ROWS) + ROWS) % ROWS;
      const rnd = hash2(cc, jj, 11), rnd2 = hash2(cc, jj, 29);
      if (ownerId && edge >= grout) ownerId[i] = jj * COLS + cc;
      if (edge < grout) {
        const n = N(x, y, 64, 2, 5) * P.grout.noise;
        albedo[i * 3] = groutC[0] - n; albedo[i * 3 + 1] = groutC[1] - n; albedo[i * 3 + 2] = groutC[2] - n;
        height[i] = 0.05 * edge / grout; rough[i] = 0.92; coat[i] = 0;
        continue;
      }
      const e = edge - grout;
      // Pillowed edge, then a gentle handmade undulation.
      const bevel = smoothstep(0, P.bevelIn * PPI, e);
      const n1 = N(x, y, 16, 4, 3), n2 = N(x, y, 96, 3, 7);
      height[i] = RL.base + RL.bevel * Math.sqrt(bevel) + RL.n1 * n1 + RL.n2 * n2;
      // Colour: per-scale tone, glaze pooling darker toward the base of the
      // fan and paler where the glaze breaks over the rim.
      const t = rnd * V.spread + V.offset + (n1 - 0.5) * V.mottle;
      const vy = Math.min(1, Math.max(0, (gy - owner.Y + r) / (2 * r + p)));
      const pool = PL.v * vy + PL.edge * (1 - bevel);
      const rim = RM.amt * (1 - smoothstep(0, RM.widthIn * PPI, e));
      for (let k = 0; k < 3; k++) {
        let v = glazeA[k] + (glazeB[k] - glazeA[k]) * t;
        v = v + (glazeDark[k] - v) * pool;
        v = v + (rimTo[k] - v) * rim + (n2 - 0.5) * V.grain + (rnd2 - 0.5) * V.jitter;
        albedo[i * 3 + k] = v;
      }
      rough[i] = P.rough0 + P.roughVar * n2; coat[i] = 1;

      // ---- extras (off for the Sage Fan) ----------------------------------
      let mul = 1;
      if (V.value) mul *= 1 + (hash2(cc, jj, 61) - 0.5) * V.value;
      if (V.mottleTiles && hash2(cc, jj, 71) < V.mottleTiles) {
        // a few fans fired darker with a speckled, cloudy glaze (V3)
        const m = N(x, y, Math.max(1, Math.round(w / (V.mottleIn * PPI))), 3, 73);
        mul *= 1 - V.mottleDark * (0.55 + 0.45 * smoothstep(0.42, 0.62, m));
      }
      if (V.speckle && hash2(x >> 1, y >> 1, 81) < V.speckle) mul *= 0.62;
      if (P.glassEdge) mul *= 1 - P.glassEdge * (1 - bevel);
      if (V.hue) {
        for (let k = 0; k < 3; k++) albedo[i * 3 + k] *= 1 + (hash2(cc, jj, 51 + k * 3) - 0.5) * V.hue;
      }
      if (mul !== 1) for (let k = 0; k < 3; k++) albedo[i * 3 + k] *= mul;
      if (und) {
        // undulated face: ripples running round the fan
        const dd = Math.hypot(x - owner.X, gy - owner.Y);
        height[i] += und.amp * bevel * Math.sin(2 * Math.PI * dd / (und.waveIn * PPI) + rnd * 6.283);
      }
      if (ribs) {
        // feather: ribs fanning out from the tip at the bottom of the scale
        const dx = x - owner.X, dyv = owner.Y + p - gy;
        const th = Math.atan2(dx, Math.max(dyv, 1e-3));
        const crest = Math.pow(0.5 + 0.5 * Math.cos(th * ribs.count), 3);
        const fade = smoothstep(0.25 * PPI, 0.9 * PPI, Math.hypot(dx, dyv)) * bevel;
        const spine = Math.exp(-Math.abs(dx) / (0.03 * PPI)) * fade;
        const q = Math.max(crest * fade, spine * 0.8);
        height[i] += ribs.amp * q;
        const rc = ribs.rgb || (ribs.rgb = hexToRgb(ribs.color));
        for (let k = 0; k < 3; k++) albedo[i * 3 + k] += (rc[k] - albedo[i * 3 + k]) * q * ribs.albedo;
      }
      if (cr && cr[i] > 0) {
        const c = cr[i] * bevel;
        height[i] -= P.crackle.depth * c;
        rough[i] += 0.12 * c;
        for (let k = 0; k < 3; k++) albedo[i * 3 + k] *= 1 - P.crackle.albedo * c;
      }
    }
  }
  return { w, h, albedo, height, rough, coat, ownerId, repeatIn: [w / PPI, h / PPI] };
}

/** Registry option for a fan tile.  See the header for the parameters. */
export function makeFanTile(o) {
  const P = resolve(o);
  const NAME = o.textureName || 'tile_' + o.id.replace(/-/g, '_');
  const PPI = P.ppi;
  const wPx = Math.round(P.cols * P.scaleWIn * PPI), hPx = Math.round(P.rows * P.pitchIn * PPI);
  const REPEAT_M = [(wPx / PPI) * IN, (hPx / PPI) * IN];
  const fin = FINISH[o.finish || 'gloss'] || FINISH.gloss;
  const normalStrength = P.normalStrength ?? 6 * PPI / 56;
  const params = {
    color: 0xffffff, roughness: 1.0, metalness: 0,
    ...fin.params, sheen: 0.0,
    ...(o.finish === 'glass' ? { sheen: 0.2, sheenColor: o.glaze.light, sheenRoughness: 0.35 } : {}),
    ...(o.material || {}),
    normalScale: 1.0,
  };
  return {
    id: o.id,
    name: o.name,
    kind: 'tile',
    order: o.order,
    thicknessMm: o.thicknessMm,
    textureName: NAME,
    repeatM: REPEAT_M,
    groutColor: P.grout.color,
    edgeColor: o.edgeColor || o.glaze.base,
    description: o.description,
    fanParams: o,            // raw factory input (tools/ checks re-run fanFields with it)
    makeMaterial(ctx) {
      const { THREE } = ctx;
      return tileMaterial(ctx, {
        textureName: NAME,
        repeatClone,
        texLookup: {
          map: tex(ctx, NAME),
          normal: texCompanion(ctx, NAME, 'normal'),
          roughness: texCompanion(ctx, NAME, 'roughness'),
        },
        procedural: () => cached(THREE, o.id, () => buildMaps(THREE, fanFields(P), { normalStrength })),
        params,
      });
    },
    /** Repeat size actually used for UVs (texture pack value wins). */
    repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
  };
}

export { resolve as resolveFanParams };
