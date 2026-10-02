// Shared pieces for light options: chains, bulbs, point lights, on/off.
import { inch, mm, warmWhite, remodelDims, cfg } from '../../remodel/cfg.js';

/**
 * Point light at a bulb.  `candela` is THREE's physical intensity (r155+);
 * values are tuned for exposure 1 + RoomEnvironment and meant to be tuned by
 * the integration pass via group.userData.lights.
 */
export function bulbLight(THREE, { candela = 6, shadow = true, mapSize = 512, near = 0.03 } = {}) {
  const l = new THREE.PointLight(warmWhite(THREE), candela, 0, 2);
  l.castShadow = shadow;
  if (shadow) {
    l.shadow.mapSize.set(mapSize, mapSize);
    l.shadow.camera.near = near;
    l.shadow.camera.far = 8;
    l.shadow.bias = -0.0015;
    l.shadow.normalBias = 0.01;
    l.shadow.radius = 3;
  }
  l.userData.baseIntensity = candela;
  return l;
}

/** Emissive "glowing" material; its emissiveIntensity is driven by onOff. */
export function glowMaterial(THREE, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: opts.color ?? 0xfff3df,
    emissive: warmWhite(THREE),
    emissiveIntensity: opts.intensity ?? 6,
    roughness: 0.4,
    ...opts.extra,
  });
  m.userData.onIntensity = m.emissiveIntensity;
  return m;
}

/** Chain of alternating links (InstancedMesh) from a to b (Vector3s). */
export function chain(THREE, a, b, { linkLen = inch(1.0), wire = mm(2.2), material } = {}) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const n = Math.max(1, Math.round(len / (linkLen * 0.78)));
  const geo = new THREE.TorusGeometry(linkLen * 0.32, wire, 6, 12);
  geo.scale(1, 1.45, 1);                    // oval link
  const mesh = new THREE.InstancedMesh(geo, material, n);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const twist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < n; i++) {
    p.copy(a).addScaledVector(dir, (i + 0.5) / n);
    const qi = q.clone(); if (i & 1) qi.multiply(twist);
    m.compose(p, qi, s);
    mesh.setMatrixAt(i, m);
  }
  mesh.castShadow = true;
  mesh.name = 'chain';
  return mesh;
}

/** Thin cylinder between two points (rods, frame edges). */
export function rod(THREE, a, b, radius, material, radial = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(radius, radius, dir.length(), radial, 1);
  const m = new THREE.Mesh(g, material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

/** Install userData.lights / onOff / dispose on a fixture group. */
export function finishFixture(group, lights, glowMats) {
  group.userData.lights = lights;
  group.userData.glowMaterials = glowMats;
  group.userData.on = true;
  group.userData.onOff = (on) => {
    group.userData.on = !!on;
    // Intensity, not visibility: changing the light count recompiles shaders.
    for (const l of lights) { l.intensity = on ? (l.userData.baseIntensity ?? 1) : 0; }
    for (const m of glowMats) {
      m.emissiveIntensity = on ? (m.userData.onIntensity ?? 1) : 0;
      if (m.userData.offColor && m.color) m.color.copy(on ? m.userData.onColor : m.userData.offColor);
    }
  };
  group.userData.dispose = () => {
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
    });
  };
  return group;
}

// ---- paired ceiling pendants flanking the mirror (Anders, Claxy) ---------

/** The oval mirror's widest point (its vertical centre), inches AFF. */
export const mirrorCentreIn = ({ mirrorBottomIn = 42, mirrorHeightIn = 56 } = {}) => mirrorBottomIn + mirrorHeightIn / 2;

/** A `defaultHangBottomIn` (shade bottom) that centres a shade `shadeHIn`
 *  tall on the mirror's widest point, so it follows the "Mirror bottom"
 *  slider (a function default, see docs/ADDING_OPTIONS.md). */
export const hangAtMirrorCentre = (shadeHIn) => (env) => mirrorCentreIn(env) - shadeHIn / 2;

/** [west, east] x offsets from the sink centre that keep a shade of radius
 *  `shadeRIn` `clearIn` clear of the mirror frame at its widest point. */
export function offsetsClearOfMirror(ctx, shadeRIn, clearIn = 2) {
  const half = cfg(ctx, ['REMODEL.ovalMirror.width'], inch(23)) / inch(1) / 2;
  const d = half + clearIn + shadeRIn;
  return [-d, d];
}

/**
 * Pair of ceiling-hung pendants, one each side of the mirror.
 * spec: { name, defaultHangIn (shade bottom AFF when opts.hangBottomIn is
 *   missing), minDropIn (ceiling to shade bottom on the shortest real stem:
 *   the hang is clamped to it, so nothing ever enters the ceiling),
 *   offsetsIn ([west, east] x offsets from opts.centreXIn), defaultFromWallIn,
 *   makePendant(dropM, k) -> Group with its origin at the shade's bottom
 *   centre, y up, reaching the ceiling at y = dropM, with
 *   userData.lights = [PointLight, ...] and userData.glowMaterials }.
 * opts (from the app): hangBottomIn, centreXIn, centreZIn (pendant centre,
 * world z, i.e. "Light distance from wall" + the accent face), ceilingIn,
 * offsetsIn (overrides spec.offsetsIn; the app only passes it to wall
 * mounts), shadows.
 */
export function flankingPendantPair(ctx, opts, spec) {
  const { THREE } = ctx;
  const D = remodelDims(ctx);
  const ceiling = opts.ceilingIn != null ? inch(opts.ceilingIn) : D.ceiling;
  const want = inch(opts.hangBottomIn != null ? opts.hangBottomIn : spec.defaultHangIn);
  const bottom = Math.min(want, ceiling - inch(spec.minDropIn));
  const drop = ceiling - bottom;
  const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX;
  const cz = opts.centreZIn != null ? inch(opts.centreZIn) : inch(spec.defaultFromWallIn);
  const offsets = (Array.isArray(opts.offsetsIn) && opts.offsetsIn.length === 2 ? opts.offsetsIn : spec.offsetsIn).map(inch);
  const group = new THREE.Group();
  group.name = spec.name;
  const lights = [], glows = new Set();
  offsets.forEach((dx, k) => {
    const p = spec.makePendant(drop, k);
    p.name = k === 0 ? 'pendantWest' : 'pendantEast';
    p.position.set(cx + dx, bottom, cz);
    group.add(p);
    lights.push(...p.userData.lights);
    for (const m of p.userData.glowMaterials || []) glows.add(m);
  });
  group.userData.placement = { bottom, drop, xs: offsets.map((d) => cx + d), z: cz };
  return finishFixture(group, lights, [...glows]);
}

/** Emissive-map ramp over a shade's height: `f(v)` (v = 0 at the bottom,
 *  1 at the top) gives the brightness 0..1.  Use with heightUV(). */
export function glowRamp(THREE, f, n = 64) {
  const c = document.createElement('canvas'); c.width = 4; c.height = n;
  const g = c.getContext('2d');
  for (let y = 0; y < n; y++) {
    const L = Math.round(255 * Math.max(0, Math.min(1, f(1 - y / (n - 1)))));  // canvas y = 0 is the top
    g.fillStyle = `rgb(${L},${L},${L})`; g.fillRect(0, y, 4, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Set every vertex's uv.v to its height fraction (y - y0) / h. */
export function heightUV(geo, y0, h) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setY(i, (p.getY(i) - y0) / h);
  uv.needsUpdate = true;
  return geo;
}

export { inch, mm };
