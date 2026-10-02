// Texture loading.  Reads assets/textures/manifest.json (written by
// tools/make_textures.py) if it exists; any missing map falls back to a small
// procedural canvas (grout grid, speckle, grain) or a flat colour, so the
// app runs without the texture pack.
//
// UV convention used by every builder in this repo: UVs are in METRES
// (see fixtures/util.js boxUV/planeUV), so a texture's repeat is simply
// 1 / physicalSizeM.  For geometry with 0..1 UVs, ask for a material with
// { surfaceSizeM: [w, h] } and the maps are cloned with the right repeat.
//
// Returned library:  lib[name] -> THREE.Texture (albedo) for every loaded or
// procedural map, plus non-enumerable helpers:
//   lib.material(name, opts)  -> MeshStandardMaterial (or Physical if opts.physical)
//   lib.set(name)             -> {map, normalMap, roughnessMap, sizeM, source}
//   lib.has(name)             -> true if the manifest supplied a real map
import { FALLBACK_COLORS, DEFAULT_TEXTURE_SIZE } from './config.js';
import { inch } from './units.js';

const BASE = 'assets/textures/';

// Read synchronously on purpose: the texture <img> requests then start in the
// same task as module evaluation, and image loads delay the document's load
// event.  That makes headless screenshots (taken at `load`) show the
// textured scene; an async fetch() would let `load` fire first.
function fetchManifest() {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', BASE + 'manifest.json', false);
    xhr.send();
    if (xhr.status !== 200) return [];
    const json = JSON.parse(xhr.responseText);
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.textures)) return json.textures;
    // object keyed by name
    return Object.entries(json).map(([name, v]) => ({ name, ...v }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------- fallbacks
function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  return c;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function hex(n) {
  return '#' + n.toString(16).padStart(6, '0');
}

/** Running-bond tile grid: `cols` tiles across, `rows` courses, offset fraction per row. */
function tileGrid(base, grout, cols, rows, offset, groutPx, seed, size = 1024) {
  return canvas(size, size, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = hex(grout);
    g.fillRect(0, 0, w, h);
    const tw = w / cols;
    const th = h / rows;
    for (let row = 0; row < rows; row++) {
      const off = ((row * offset) % 1) * tw;
      for (let c = -1; c <= cols; c++) {
        const x = c * tw + off;
        const shade = 0.9 + r() * 0.18;
        const br = Math.min(255, ((base >> 16) & 255) * shade) | 0;
        const bg = Math.min(255, ((base >> 8) & 255) * shade) | 0;
        const bb = Math.min(255, (base & 255) * shade) | 0;
        g.fillStyle = `rgb(${br},${bg},${bb})`;
        // canvas y=0 is the TOP; v=0 of the texture is the bottom, so flip rows
        const y = h - (row + 1) * th;
        g.fillRect(x + groutPx / 2, y + groutPx / 2, tw - groutPx, th - groutPx);
        // soft cloudy mottling (stone look), clipped to the tile
        g.save();
        g.beginPath();
        g.rect(x + groutPx / 2, y + groutPx / 2, tw - groutPx, th - groutPx);
        g.clip();
        for (let k = 0; k < 10; k++) {
          const bx = x + r() * tw, by = y + r() * th, rad = (0.15 + r() * 0.35) * tw;
          const light = r() < 0.5;
          const grd = g.createRadialGradient(bx, by, 0, bx, by, rad);
          grd.addColorStop(0, light ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)');
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grd;
          g.fillRect(bx - rad, by - rad, rad * 2, rad * 2);
        }
        g.restore();
      }
    }
  });
}

function speckle(base, seed) {
  return canvas(512, 512, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = hex(base);
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = r();
      g.fillStyle = v < 0.5 ? 'rgba(90,90,90,0.55)' : v < 0.8 ? 'rgba(160,150,140,0.5)' : 'rgba(255,255,255,0.8)';
      const s = 1 + r() * 2.5;
      g.fillRect(r() * w, r() * h, s, s);
    }
  });
}

function grain(base, seed) {
  return canvas(512, 512, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = hex(base);
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 1) {
      const a = 0.04 + 0.08 * Math.abs(Math.sin(y * 0.21 + r() * 0.6));
      g.fillStyle = r() < 0.5 ? `rgba(20,18,16,${a})` : `rgba(255,250,240,${a * 0.6})`;
      g.fillRect(0, y, w, 1 + (r() < 0.1 ? 1 : 0));
    }
  });
}

function waffle(base) {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = hex(base);
    g.fillRect(0, 0, w, h);
    const n = 20;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        g.fillStyle = 'rgba(255,255,255,0.045)';
        g.fillRect(i * (w / n) + 2, j * (h / n) + 2, w / n - 4, h / n - 4);
        g.fillStyle = 'rgba(0,0,0,0.12)';
        g.fillRect(i * (w / n) + 4, j * (h / n) + 4, w / n - 8, h / n - 8);
      }
    }
  });
}

function proceduralFallback(name) {
  const c = FALLBACK_COLORS[name];
  switch (name) {
    // floor: 12" x 24" planks, long side along v (z, N-S), 1/3 offset bond
    case 'floor_plank':
      return rotated(tileGrid(c, 0x2a2827, 1, 3, 1 / 3, 4, 7));
    case 'wainscot':
      return tileGrid(c, 0xaaa8a4, 2, 2, 0.5, 4, 11);
    case 'accent_band':
      return tileGrid(c, 0x3d3b3a, 2, 1, 0, 6, 13);
    case 'quartz':
      return speckle(c, 5);
    case 'vanity_wood':
      return grain(c, 3);
    case 'curtain':
      return waffle(c);
    default:
      return null;
  }
}

/** Floor: draw courses horizontally, then rotate 90 deg so planks run along v. */
function rotated(src) {
  return canvas(src.height, src.width, (g, w, h) => {
    g.translate(w / 2, h / 2);
    g.rotate(Math.PI / 2);
    g.drawImage(src, -src.width / 2, -src.height / 2);
  });
}

// ---------------------------------------------------------------- loader
export async function loadTextures(THREE, renderer) {
  const manifest = fetchManifest();
  const loader = new THREE.TextureLoader();
  const aniso = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() ?? 4);
  const sets = {};

  const prep = (tex, color) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = aniso;
    tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return tex;
  };
  const tryLoad = (file, color) =>
    file ? loader.loadAsync(BASE + file).then((t) => prep(t, color)).catch(() => null) : Promise.resolve(null);

  await Promise.all(
    manifest.map(async (e) => {
      if (!e || !e.name) return;
      const [map, normalMap, roughnessMap] = await Promise.all([
        tryLoad(e.map, true),
        tryLoad(e.normalMap, false),
        tryLoad(e.roughnessMap, false),
      ]);
      let sizeM = e.physicalSizeM;
      if (!sizeM && Array.isArray(e.repeat)) sizeM = [1 / e.repeat[0], 1 / e.repeat[1]];
      if (!sizeM) sizeM = DEFAULT_TEXTURE_SIZE[e.name] || [inch(24), inch(24)];
      sets[e.name] = { map, normalMap, roughnessMap, sizeM, source: map ? 'manifest' : 'missing' };
    }),
  );

  // Procedural fallbacks for anything the manifest did not provide.
  for (const name of Object.keys(FALLBACK_COLORS)) {
    const s = sets[name];
    if (s && s.map) continue;
    const cv = proceduralFallback(name);
    const sizeM = s?.sizeM || DEFAULT_TEXTURE_SIZE[name] || [inch(24), inch(24)];
    sets[name] = {
      map: cv ? prep(new THREE.CanvasTexture(cv), true) : null,
      normalMap: s?.normalMap || null,
      roughnessMap: s?.roughnessMap || null,
      sizeM: cv ? DEFAULT_TEXTURE_SIZE[name] || sizeM : sizeM,
      source: cv ? 'procedural' : 'flat',
    };
  }

  // Metre UVs: repeat = 1 / physical size.
  for (const s of Object.values(sets)) {
    for (const t of [s.map, s.normalMap, s.roughnessMap]) if (t) t.repeat.set(1 / s.sizeM[0], 1 / s.sizeM[1]);
  }

  const lib = {};
  const physicalSize = {};
  for (const [name, s] of Object.entries(sets)) {
    physicalSize[name] = s.sizeM;
    if (!s.map) continue;
    lib[name] = s.map;
    Object.assign(s.map.userData, { normalMap: s.normalMap, roughnessMap: s.roughnessMap, physicalSizeM: s.sizeM });
  }

  const hidden = (k, v) => Object.defineProperty(lib, k, { value: v, enumerable: false });
  hidden('set', (name) => sets[name] || null);
  hidden('has', (name) => sets[name]?.source === 'manifest');
  hidden('sets', sets);
  hidden('physicalSize', physicalSize); // {name: [w, h] metres}, read by src/remodel/cfg.js
  /**
   * material(name, opts): MeshStandardMaterial with the named maps.
   *   opts.surfaceSizeM [w,h]  -> clone maps for 0..1 UVs on a w x h surface
   *   opts.physical            -> MeshPhysicalMaterial
   *   other opts are passed to the material constructor (color, roughness...)
   */
  hidden('material', (name, opts = {}) => {
    const { surfaceSizeM, physical, ...rest } = opts;
    const s = sets[name];
    const params = { roughness: 0.6, metalness: 0, ...rest };
    if (s) {
      const fix = (t) => {
        if (!t || !surfaceSizeM) return t;
        const c = t.clone();
        c.repeat.set(surfaceSizeM[0] / s.sizeM[0], surfaceSizeM[1] / s.sizeM[1]);
        c.needsUpdate = true;
        return c;
      };
      if (s.map) params.map = fix(s.map);
      if (s.normalMap) params.normalMap = fix(s.normalMap);
      if (s.roughnessMap) params.roughnessMap = fix(s.roughnessMap);
      if (s.map && rest.color === undefined) params.color = 0xffffff;
    }
    if (params.color === undefined) params.color = FALLBACK_COLORS[name] ?? 0x888888;
    return physical ? new THREE.MeshPhysicalMaterial(params) : new THREE.MeshStandardMaterial(params);
  });

  const report = Object.fromEntries(Object.entries(sets).map(([k, s]) => [k, s.source]));
  console.info('[textures]', report);
  return lib;
}
