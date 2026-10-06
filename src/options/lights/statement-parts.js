// Shared pieces for the single statement pendants hung in front of the
// mirror (br-cmo: reese-large-pendant, sculptural-globe-13-pendant,
// belleville-rattan-pendant).  Not an option file: it exports no default,
// so the registry ignores it.
import { warmWhite } from '../../remodel/cfg.js';
import { glowRamp, heightUV, inch, mm } from './common.js';

/** Lathe from a profile [[r, y], ...] in inches (bottom to top, r >= 0).
 *  `smooth` resamples it through a centripetal Catmull-Rom curve. */
export function latheIn(THREE, profile, { segments = 96, smooth = 0 } = {}) {
  let pts = profile.map(([r, y]) => new THREE.Vector2(inch(r), inch(y)));
  if (smooth) {
    const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)), false, 'centripetal');
    pts = c.getPoints(smooth).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
  }
  return new THREE.LatheGeometry(pts, segments);
}

/** Opal / milk / frosted glass that glows when the light is on: a warm
 *  emissive ramp over the shade's height (v = 0 bottom, 1 top), like the
 *  Monteaux / Anders shades.  Returns { material, ramp }; call
 *  heightUV(geo, y0, h) on the geometry so the ramp follows the height. */
export function glowingGlass(THREE, rampFn, { color = 0xf3efe7, intensity = 0.8, roughness = 0.2, clearcoat = 0.8, side } = {}) {
  const ramp = glowRamp(THREE, rampFn);
  const material = new THREE.MeshPhysicalMaterial({
    color, roughness, metalness: 0, clearcoat, clearcoatRoughness: 0.12,
    sheen: 0.2, sheenColor: 0xffffff, sheenRoughness: 0.5,
    emissive: warmWhite(THREE), emissiveIntensity: intensity, emissiveMap: ramp,
    side: side ?? THREE.DoubleSide,
  });
  material.userData.onIntensity = material.emissiveIntensity;
  return { material, ramp };
}

/** A profile [[r, y], ...] resampled through a centripetal Catmull-Rom
 *  curve to n + 1 points (inches in, inches out). */
export function smoothProfile(THREE, profile, n = 32) {
  const c = new THREE.CatmullRomCurve3(profile.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
  return c.getPoints(n).map((p) => [Math.max(0, p.x), p.y]);
}

/** Mesh helper: adds `geo` with `mat` to `parent` at y (metres). */
export function addMesh(THREE, parent, geo, mat, { y = 0, name, cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y;
  m.castShadow = cast; m.receiveShadow = receive;
  if (name) m.name = name;
  parent.add(m);
  return m;
}

/** Fixture bottom (metres) from the hang slider, clamped so the body plus
 *  the shortest real drop never enters the ceiling. */
export function statementBottom(opts, ceilingM, defaultIn, minDropIn) {
  const want = inch(opts.hangBottomIn != null ? opts.hangBottomIn : defaultIn);
  return Math.min(want, ceilingM - inch(minDropIn));
}

export { heightUV, inch, mm };
