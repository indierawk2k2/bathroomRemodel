// Small helpers for drawing procedural fallback maps at runtime (used when
// ctx.textures lacks the named texture).  All maps are periodic so they tile.
//
// A generator fills Float32 buffers (albedo RGB 0..1, height 0..1, rough
// 0..1, clearcoat mask 0..1) and `buildMaps` turns them into THREE textures:
//   map (sRGB), normalMap (from height), roughnessMap (G = roughness,
//   R = clearcoat mask, so the same texture also serves as clearcoatMap).

export function hash2(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** Periodic value noise; period in lattice cells (px/cell = w / periodX). */
export function valueNoise(x, y, px, py, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const m = (a, p) => ((a % p) + p) % p;
  const a = hash2(m(xi, px), m(yi, py), seed), b = hash2(m(xi + 1, px), m(yi, py), seed);
  const c = hash2(m(xi, px), m(yi + 1, py), seed), d = hash2(m(xi + 1, px), m(yi + 1, py), seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Periodic fBm over a w x h image; `cells` = base lattice cells across w. */
export function fbm(x, y, w, h, cells, octaves = 4, seed = 0) {
  let s = 0, amp = 0.5, tot = 0, f = cells / w;
  let cx = cells, cy = Math.max(1, Math.round(cells * h / w));
  for (let o = 0; o < octaves; o++) {
    s += amp * valueNoise(x * f, y * f, cx, cy, seed + o * 17);
    tot += amp; amp *= 0.5; f *= 2; cx *= 2; cy *= 2;
  }
  return s / tot;
}

export function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/**
 * bufs: { w, h, albedo: Float32Array(w*h*3), height?: Float32Array(w*h),
 *         rough?: Float32Array(w*h), coat?: Float32Array(w*h) }
 * opts: { normalStrength, anisotropy, albedoCanvas (pre-drawn canvas) }
 */
export function buildMaps(THREE, bufs, opts = {}) {
  const { w, h } = bufs;
  const out = {};
  const toTex = (canvas, srgb) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = opts.anisotropy || 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.needsUpdate = true;
    return t;
  };
  if (opts.albedoCanvas) {
    out.map = toTex(opts.albedoCanvas, true);
  } else if (bufs.albedo) {
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const img = g.createImageData(w, h), d = img.data, a = bufs.albedo;
    for (let i = 0, n = w * h; i < n; i++) {
      d[i * 4] = a[i * 3] * 255; d[i * 4 + 1] = a[i * 3 + 1] * 255; d[i * 4 + 2] = a[i * 3 + 2] * 255;
      d[i * 4 + 3] = bufs.alpha ? bufs.alpha[i] * 255 : 255;
    }
    g.putImageData(img, 0, 0);
    out.map = toTex(c, true);
  }
  if (bufs.height) {
    const s = opts.normalStrength ?? 4;
    const H = bufs.height;
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) {
      const ym = ((y - 1 + h) % h) * w, yp = ((y + 1) % h) * w, y0 = y * w;
      for (let x = 0; x < w; x++) {
        const xm = (x - 1 + w) % w, xp = (x + 1) % w;
        const dx = (H[y0 + xp] - H[y0 + xm]) * 0.5 * s;
        const dy = (H[yp + x] - H[ym + x]) * 0.5 * s; // canvas y is down = -v
        let nx = -dx, ny = dy, nz = 1;
        const l = Math.hypot(nx, ny, nz);
        const i = (y0 + x) * 4;
        d[i] = (nx / l * 0.5 + 0.5) * 255; d[i + 1] = (ny / l * 0.5 + 0.5) * 255;
        d[i + 2] = (nz / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    out.normalMap = toTex(c, false);
  }
  if (bufs.rough) {
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const img = g.createImageData(w, h), d = img.data;
    for (let i = 0, n = w * h; i < n; i++) {
      d[i * 4] = (bufs.coat ? bufs.coat[i] : 1) * 255;
      d[i * 4 + 1] = bufs.rough[i] * 255;
      d[i * 4 + 2] = 0; d[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    out.roughnessMap = toTex(c, false);
  }
  return out;
}

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Per-THREE-instance cache so each procedural set is generated once. */
const _cache = new WeakMap();
export function cached(THREE, key, make) {
  let m = _cache.get(THREE);
  if (!m) { m = new Map(); _cache.set(THREE, m); }
  if (!m.has(key)) m.set(key, make());
  return m.get(key);
}

/** Material builder shared by tile options: named texture first, procedural fallback. */
export function tileMaterial(ctx, { textureName, procedural, params, repeatClone, texLookup, flatRoughness = 0.25 }) {
  const { THREE } = ctx;
  const named = texLookup.map;
  let maps;
  if (named) {
    maps = {
      map: repeatClone(THREE, named, true),
      normalMap: repeatClone(THREE, texLookup.normal, false),
      roughnessMap: repeatClone(THREE, texLookup.roughness, false),
    };
  } else {
    maps = procedural();
  }
  const { normalScale, ...rest } = params;
  const m = new THREE.MeshPhysicalMaterial(rest);
  if (maps.map) m.map = maps.map;
  if (maps.normalMap) m.normalMap = maps.normalMap;
  if (maps.roughnessMap) {
    m.roughnessMap = maps.roughnessMap;
    if (!named && m.clearcoat > 0) m.clearcoatMap = maps.roughnessMap; // R = glaze mask
  } else {
    m.roughness = flatRoughness; // texture pack without a roughness map
  }
  if (normalScale) m.normalScale.set(normalScale, normalScale);
  m.name = textureName + (named ? '' : ' (procedural)');
  m.userData.procedural = !named;
  return m;
}
