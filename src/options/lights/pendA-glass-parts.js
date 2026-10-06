// Shared pieces for the enclosed opal / milk-glass flanking pendant pairs
// (br-kmt, group A): alto-rod-pendants, imena-pendants,
// sculptural-globe-pendants.  Not an option (no `build`), so the registry
// ignores it.
//
// The glass is modelled as an opaque, glowing (emissive) shell that does not
// cast shadows: opal / milk glass diffuses the bulb completely, so no bulb
// mesh is drawn and the bulb can never be seen.
import { warmWhite } from '../../remodel/cfg.js';
import { glowRamp, heightUV, inch } from './common.js';

/**
 * Milk / opal glass materials.  `f(v)` is the glow over the shade height
 * (v = 0 at the bottom, 1 at the top), see glowRamp().  Returns
 * { glass, ramp, glowMaterials }; dispose `ramp` with the fixture.
 */
export function milkGlass(THREE, f, { color = 0xf3f1ec, intensity = 0.9, sheen = 0.45 } = {}) {
  const ramp = glowRamp(THREE, f);
  const glass = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.3, metalness: 0,
    clearcoat: sheen, clearcoatRoughness: 0.2,      // hand-blown glass: a soft gloss over the milk
    emissive: warmWhite(THREE), emissiveIntensity: intensity, emissiveMap: ramp,
    side: THREE.DoubleSide,                          // an open neck shows the glowing inside, not the room
  });
  glass.userData.onIntensity = glass.emissiveIntensity;
  return { glass, ramp, glowMaterials: [glass] };
}

/** A lathe glass shell from (rIn, yIn) profile points, bottom to top. */
export function glassShell(THREE, profileIn, material, name = 'milkGlass') {
  const pts = profileIn.map(([r, y]) => new THREE.Vector2(inch(r), inch(y)));
  const h = Math.max(...profileIn.map((p) => p[1]));
  const g = heightUV(new THREE.LatheGeometry(pts, 72), 0, inch(h));
  const m = new THREE.Mesh(g, material);
  m.name = name;
  m.castShadow = false;            // the glass passes the light; it must not shadow its own bulb
  m.receiveShadow = false;
  return m;
}

/** Profile of an ellipse arc (semi-axes aIn horizontal, bIn vertical,
 *  centre height ycIn) from the bottom pole up to the radius rTopIn on its
 *  upper half: [[r, y], ...]. */
export function ellipseProfile(aIn, bIn, ycIn, rTopIn, n = 40) {
  const out = [];
  const tTop = Math.PI - Math.asin(Math.min(1, rTopIn / aIn));   // angle from the bottom pole
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * tTop;
    out.push([aIn * Math.sin(t), ycIn - bIn * Math.cos(t)]);
  }
  out[0][0] = 0;
  return out;
}

/** Adds a mesh to group p at height y (metres); metal parts cast shadows. */
export function adder(THREE, p) {
  return (geo, mat, y, name, cast = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y; m.castShadow = cast; m.receiveShadow = true;
    if (name) m.name = name;
    p.add(m);
    return m;
  };
}

/** A lathe from (rIn, yIn) points (bottom to top, y relative to the part). */
export function latheIn(THREE, ptsIn, seg = 64) {
  return new THREE.LatheGeometry(ptsIn.map(([r, y]) => new THREE.Vector2(inch(r), inch(y))), seg);
}
