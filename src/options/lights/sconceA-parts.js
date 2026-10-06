// Shared pieces for the opal-glass sconce pairs of group A (br-d6l):
// rigdon-sconces, paolo-sconces, imena-sconces, mill-valley-sconces.
// Not an option itself (index.js does not export it).
//
// Every one of these hides its bulb completely: the opal / milk glass is a
// translucent glowing material (emissive, driven by onOff, casts no
// shadow), never clear glass.
import { remodelDims, warmWhite } from '../../remodel/cfg.js';
import { finishFixture, glowRamp, inch, mm } from './common.js';

/** Default x offsets from the sink centre, as harlan-sconces.js: each sconce
 *  centred in its strip of accent wall between the mirror frame and the
 *  accent edge (x 36.25" / 70.75"). */
export const SCONCE_OFFSETS_IN = [-17.75, 16.75];

/** Opal (matte milk) glass: outer face + optional inner (BackSide) face for
 *  open ends, both glowing with `ramp` (an emissive map over the height).
 *  Opal is denser than frosted glass, so the glow is more even. */
export function opalMaterials(THREE, f, { intensity = 0.9, inner = false } = {}) {
  const ramp = glowRamp(THREE, f);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xf1efea, roughness: 0.62, metalness: 0,
    sheen: 0.25, sheenColor: 0xffffff, sheenRoughness: 0.7,
    emissive: warmWhite(THREE), emissiveIntensity: intensity, emissiveMap: ramp,
  });
  glass.userData.onIntensity = glass.emissiveIntensity;
  const mats = { glass, ramp, glows: [glass] };
  if (inner) {
    mats.glassIn = new THREE.MeshStandardMaterial({
      color: 0xf4f2ec, roughness: 0.7, side: THREE.BackSide,
      emissive: warmWhite(THREE), emissiveIntensity: intensity * 1.25, emissiveMap: ramp,
    });
    mats.glassIn.userData.onIntensity = mats.glassIn.emissiveIntensity;
    mats.glows.push(mats.glassIn);
  }
  return mats;
}

/** Glass that never casts or receives shadows (it would black out its own
 *  light). */
export function glassMesh(THREE, geo, mat, name) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.castShadow = false; m.receiveShadow = false;
  return m;
}

/** Knurled ring (a short cylinder with fine vertical ribs), axis y, centred
 *  at the origin. */
export function knurledRing(THREE, R, H, material, ribs = 90, amp = mm(0.35)) {
  const g = new THREE.CylinderGeometry(R, R, H, ribs * 2, 1, false);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
    if (r < R * 0.98) continue;                 // cap centres
    const th = Math.atan2(z, x);
    const k = Math.round((th / (Math.PI * 2)) * ribs * 2);
    const rr = (k & 1) ? R - amp : R;
    p.setX(i, (x / r) * rr); p.setZ(i, (z / r) * rr);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  return m;
}

/** Brass cylinder (axis y) with its centre at (x, y, z). */
export function brassCyl(THREE, R, H, material, { x = 0, y = 0, z = 0, seg = 48, cast = true, rTop } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop ?? R, R, H, seg), material);
  m.position.set(x, y, z);
  m.castShadow = cast; m.receiveShadow = true;
  return m;
}

/**
 * A pair of wall sconces either side of the mirror.
 * spec: { name, bottomToCentreIn (fixture bottom -> glass centre, for the
 *   legacy hangBottomIn), makeSconce(k) -> Group with its origin on the
 *   wall face at the glass centre (y up, +z into the room) and
 *   userData.lights = [PointLight] }, glows (emissive materials), dispose.
 * opts (from the app): mountCentreIn (glass centre AFF), hangBottomIn,
 *   centreXIn, offsetsIn ([west, east]), spacingIn, surfaceOffsetM.
 */
export function wallSconcePair(ctx, opts, spec, defaultCentreIn) {
  const { THREE } = ctx;
  const D = remodelDims(ctx);
  const centre = opts.mountCentreIn != null ? inch(opts.mountCentreIn)
    : opts.hangBottomIn != null ? inch(opts.hangBottomIn + spec.bottomToCentreIn) : inch(defaultCentreIn);
  const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX;
  const offsets = (Array.isArray(opts.offsetsIn) && opts.offsetsIn.length === 2 ? opts.offsetsIn
    : opts.spacingIn != null ? [-opts.spacingIn, opts.spacingIn] : SCONCE_OFFSETS_IN).map(inch);
  const surface = opts.surfaceOffsetM ?? 0;
  const group = new THREE.Group();
  group.name = spec.name;
  const lights = [];
  offsets.forEach((dx, k) => {
    const s = spec.makeSconce(k);
    s.name = k === 0 ? 'sconceWest' : 'sconceEast';
    s.position.set(cx + dx, centre, surface);
    group.add(s);
    lights.push(...s.userData.lights);
  });
  group.userData.placement = { centre, xs: offsets.map((d) => cx + d), surface };
  finishFixture(group, lights, spec.glows);
  if (spec.dispose) {
    const d = group.userData.dispose;
    group.userData.dispose = () => { d(); spec.dispose(); };
  }
  return group;
}
