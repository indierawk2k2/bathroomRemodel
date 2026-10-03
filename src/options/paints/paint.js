// Paint colours (kind 'paint') for the accent wall: a solid colour in one
// of four finishes.
//
//   makePaint({ id, name, hex, finish = 'eggshell', brand, code, description, order, tag })
//     -> registry option { id, name, kind: 'paint', thicknessMm, order,
//                          edgeColor, hex, finish, description,
//                          makeMaterial(ctx), repeatFor(ctx) }
//
// Finishes (FINISHES below):
//   matte, eggshell, satin  paint on the drywall: thicknessMm 0, treated like
//                           wallpaper at the junction (no thinset, no caulk
//                           line, 13 mm behind the proud wainscot).  A
//                           MeshPhysicalMaterial in the colour with a subtle
//                           procedural roller-stipple normal / roughness map
//                           (colour-independent, built once per finish), so
//                           the colour can change in place: material.color.
//   subway                  glazed 3" x 6" glass subway tile in the colour,
//                           STACKED grid like the white glass option, 8 mm
//                           thick + thinset, light grey grout (the generator
//                           of tiles/white-glass-subway-stacked.js, tinted).
//
// Presets live one per file in this folder; colours the owners save from the
// panel's colour chooser are built by the same factory (custom.js).
import { buildMaps, cached, fbm, hexToRgb } from '../procedural.js';
import { GLASS_SUBWAY_REPEAT_M, makeGlassSubway } from '../tiles/white-glass-subway-stacked.js';

export const FINISHES = [
  { id: 'eggshell', name: 'Eggshell paint', roughness: 0.72, stipple: 1.0 },
  { id: 'matte', name: 'Matte paint', roughness: 0.9, stipple: 1.2 },
  { id: 'satin', name: 'Satin paint', roughness: 0.5, stipple: 0.8 },
  { id: 'subway', name: 'Glazed subway tile', roughness: 0.18, stipple: 0 },
];
export const finishInfo = (id) => FINISHES.find((f) => f.id === id) || FINISHES[0];
export const isFinish = (id) => FINISHES.some((f) => f.id === id);

const STIPPLE_M = 0.25;       // one stipple repeat: 25 cm square
const SUBWAY_GROUT = '#cbccc9';

/** Normalise '#AbC123' / 'abc123' -> '#abc123' (null if not a 6-digit hex). */
export function normHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  return m ? '#' + m[1].toLowerCase() : null;
}

/** Roller stipple: fine orange-peel height field + a faint roughness
 *  variation (thicker paint ridges a touch glossier).  Periodic 512 px. */
function makeStipple(THREE, finish) {
  const S = 512;
  const height = new Float32Array(S * S), rough = new Float32Array(S * S), coat = new Float32Array(S * S);
  const f = finishInfo(finish);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x;
    const fine = fbm(x, y, S, S, 96, 3, 71);     // ~2.6 mm roller nap
    const broad = fbm(x, y, S, S, 10, 2, 83);    // lap / load variation
    const h = 0.75 * fine + 0.25 * broad;
    height[i] = h;
    rough[i] = Math.min(1, Math.max(0, f.roughness + (0.5 - h) * 0.08));
  }
  return buildMaps(THREE, { w: S, h: S, height, rough, coat }, { normalStrength: f.stipple });
}

function darken(hex, k) {
  const [r, g, b] = hexToRgb(hex);
  const c = (v) => Math.round(Math.max(0, Math.min(1, v * k)) * 255).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

export function makePaint({ id, name, hex, finish = 'eggshell', brand, code, description, order, tag }) {
  const col = normHex(hex) || '#808080';
  const fin = finishInfo(finish).id;
  const subway = fin === 'subway';
  const label = [brand, name, code].filter(Boolean).join(' ');
  const maker = [brand, code].filter(Boolean).join(' ');
  return {
    id,
    // "Hale Navy, Benjamin Moore HC-154 (paint)"; customs: "My teal (paint)"
    name: `${name}${maker ? ', ' + maker : ''} (${subway ? 'glazed subway' : 'paint'}${tag ? ', ' + tag : ''})`,
    paintName: name,
    kind: 'paint',
    thicknessMm: subway ? 8 : 0,
    order: order ?? 60,
    hex: col,
    finish: fin,
    brand, code,
    edgeColor: col,
    groutColor: subway ? SUBWAY_GROUT : darken(col, 0.85),
    repeatM: subway ? GLASS_SUBWAY_REPEAT_M : [STIPPLE_M, STIPPLE_M],
    description: description || `${label || name}, ${col}, ${finishInfo(fin).name.toLowerCase()}`,
    makeMaterial(ctx) {
      const { THREE } = ctx;
      if (subway) {
        const maps = makeGlassSubway(THREE, { tint: hexToRgb(col), grout: hexToRgb(SUBWAY_GROUT) });
        const m = new THREE.MeshPhysicalMaterial({
          color: 0xffffff, roughness: 1.0, metalness: 0,
          clearcoat: 1.0, clearcoatRoughness: 0.03,
          specularIntensity: 1.0, ior: 1.52,
          sheen: 0.12, sheenColor: new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.5), sheenRoughness: 0.3,
        });
        m.map = maps.map;
        m.normalMap = maps.normalMap;
        m.roughnessMap = maps.roughnessMap;   // G = roughness
        m.clearcoatMap = maps.roughnessMap;   // R = glaze mask (grout unglazed)
        m.name = `paint ${id} (glazed subway, procedural)`;
        m.userData.paint = { hex: col, finish: fin };
        return m;
      }
      const f = finishInfo(fin);
      const maps = cached(THREE, 'paint-stipple-' + fin, () => makeStipple(THREE, fin));
      const m = new THREE.MeshPhysicalMaterial({
        color: col, roughness: 1.0, metalness: 0,
        // paint is a dielectric with a slightly lower specular than glaze
        specularIntensity: fin === 'matte' ? 0.35 : 0.5, ior: 1.45,
      });
      m.normalMap = maps.normalMap;
      m.roughnessMap = maps.roughnessMap;     // G = finish roughness +- stipple
      m.normalScale.set(0.18, 0.18);        // a rolled finish: felt more than seen
      m.name = `paint ${id} (${f.id})`;
      m.userData.paint = { hex: col, finish: fin };
      return m;
    },
    repeatFor() { return subway ? GLASS_SUBWAY_REPEAT_M : [STIPPLE_M, STIPPLE_M]; },
  };
}
