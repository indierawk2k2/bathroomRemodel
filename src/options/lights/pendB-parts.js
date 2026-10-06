// Shared parts for the Mitzi (Hudson Valley) cord-hung pendant pairs, group
// B of the flanking pendants (br-kv5): stella-pendants, reese-small-pendants,
// miley-pendants.  All three are opal (milk) glass on a black cloth cord
// from a round Aged Brass canopy, so they share the materials and the
// cord + canopy; each option file models its own glass and brass.
import { warmWhite } from '../../remodel/cfg.js';
import { bulbLight, glowRamp, heightUV, inch, mm } from './common.js';

/** Lathe from [[r, y], ...] in inches (counter-clockwise in (r, y), bottom
 *  to top, so the faces point out), with uv.v = height fraction over [y0, y0 + h]. */
export function latheIn(THREE, pts, { segments = 72, y0, h } = {}) {
  const v = pts.map(([r, y]) => new THREE.Vector2(inch(Math.max(r, 0)), inch(y)));
  const g = new THREE.LatheGeometry(v, segments);
  const ys = pts.map((p) => p[1]);
  const lo = y0 ?? Math.min(...ys), hi = h ?? (Math.max(...ys) - lo);
  return heightUV(g, inch(lo), inch(hi || 1));
}

/** Points on a circle arc (inches): centre (cx, cy), radius r, angles a0 -> a1 (radians). */
export function arcIn(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/**
 * Materials for an opal-glass pendant.  `glow(v)` (v = 0 at the glass
 * bottom, 1 at the top) shapes the emissive brightness: the bulb is
 * hidden inside, so the glass itself is the light source.  Opal glass is
 * modelled as glowing (emissive, driven by onOff) and never casts shadows.
 */
export function mitziMaterials(THREE, glow, { glassIntensity = 0.95 } = {}) {
  const ramp = glowRamp(THREE, glow);
  const mats = {
    // Glossy opal ("opal glossy" / "opal shiny" on the HVL pages): milky
    // white, a sharp clearcoat for the gloss, emissive under the coat.
    opal: new THREE.MeshPhysicalMaterial({
      color: 0xf3f1ec, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06,
      emissive: warmWhite(THREE), emissiveIntensity: glassIntensity, emissiveMap: ramp,
    }),
    // Aged Brass: HVL's warm, slightly deep satin brass (studio photos).
    brass: new THREE.MeshPhysicalMaterial({ color: 0xc9a25c, metalness: 1, roughness: 0.36, anisotropy: 0.25 }),
    // Underside / inside brass faces seen against the lit glass: rough, so
    // no hot glint.
    brassIn: new THREE.MeshPhysicalMaterial({ color: 0xa8823f, metalness: 1, roughness: 0.7 }),
    // Black cloth cord ("fabric covered cord").
    cord: new THREE.MeshStandardMaterial({ color: 0x18171a, roughness: 0.92, metalness: 0 }),
  };
  mats.opal.userData.onIntensity = mats.opal.emissiveIntensity;
  mats.ramp = ramp;
  return mats;
}

/**
 * Black cloth cord from `topM` (the fixture's top, metres above the shade
 * bottom) up to a round brass canopy on the ceiling at `dropM`, with a
 * small strain-relief collar under the canopy.
 */
export function cordAndCanopy(THREE, p, mats, { topM, dropM, canopyDIn = 4.75, canopyHIn = 0.9 }) {
  const cH = inch(canopyHIn);
  const collarH = inch(0.55);
  const cordTop = dropM - cH - collarH;
  const len = Math.max(mm(4), cordTop - topM);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.13), inch(0.13), len, 10), mats.cord);
  cord.position.y = topM + len / 2; cord.castShadow = true; cord.name = 'cord';
  p.add(cord);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.26), inch(0.3), collarH, 20), mats.brass);
  col.position.y = dropM - cH - collarH / 2; col.castShadow = true; col.name = 'cordGrip';
  p.add(col);
  // Canopy: a shallow drum with a rounded lower edge (lathe, top at y = 0).
  const pts = [[0, -canopyHIn], [canopyDIn / 2 - 0.3, -canopyHIn]];
  pts.push(...arcIn(canopyDIn / 2 - 0.3, -canopyHIn + 0.3, 0.3, -Math.PI / 2, 0, 6));
  pts.push([canopyDIn / 2, 0]);
  const can = new THREE.Mesh(latheIn(THREE, pts, { segments: 64 }), mats.brass);
  can.position.y = dropM; can.castShadow = true; can.receiveShadow = true; can.name = 'canopy';
  p.add(can);
}

/**
 * The bulb's light, split as the Claxy does: a shadow-casting PointLight
 * (the opal glass does not cast; the brass cap / neck and the cord do) and
 * a weaker unshadowed one for the broad glow off the lit glass.
 */
export function mitziLights(THREE, p, yM, shadows, candela) {
  const l = bulbLight(THREE, { candela: candela * 0.7, shadow: shadows, mapSize: 512, near: 0.02 });
  l.position.y = yM;
  p.add(l);
  const fill = bulbLight(THREE, { candela: candela * 0.35, shadow: false });
  fill.position.y = yM;
  p.add(fill);
  return [l, fill];
}

export { inch, mm };
