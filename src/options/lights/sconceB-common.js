// Shared helpers for the sconce pairs of group B (br-20r): Mitzi Miley,
// Hudson Valley Laval, Hudson Valley Keswick, Claxy 2-light cylinder.
// Not an option file (no `build`), so the registry ignores it.
//
// All four follow the Harlan rule (harlan-sconces.js): one sconce in each
// strip of accent wall between the mirror frame and the accent edge
// (x = 54 - 17.75 / 54 + 16.75 = 36.25" / 70.75"), the glass centre on the
// oval mirror's widest point (mirror bottom + height / 2, 70" at the
// default mirror), following the "Mirror bottom" slider.
import { remodelDims, warmWhite } from '../../remodel/cfg.js';
import { glowRamp, finishFixture, mirrorCentreIn, inch } from './common.js';

/** Default glass centre AFF: the mirror's widest point (a function default). */
export const glassAtMirrorCentre = mirrorCentreIn;

// Default offsets from the sink centre (config.js REMODEL.sconceOffsetsIn).
const DEFAULT_OFFSETS_IN = [-17.75, 16.75];

/**
 * Pair of wall sconces.  spec: { name, makeSconce(k) -> Group with its
 * origin at the glass centre, x across, y up, z out of the wall (z = 0 is
 * the finished wall face), userData.lights / userData.glowMaterials }.
 * opts (from the app): mountCentreIn (glass centre AFF), hangBottomIn
 * (legacy: glass bottom; needs spec.glassHeightIn), centreXIn, offsetsIn
 * ([west, east] from centreXIn), spacingIn, surfaceOffsetM, shadows.
 */
export function wallSconcePair(ctx, opts, spec) {
  const { THREE } = ctx;
  const D = remodelDims(ctx);
  const centreIn = opts.mountCentreIn != null ? opts.mountCentreIn
    : opts.hangBottomIn != null && spec.glassHeightIn ? opts.hangBottomIn + spec.glassHeightIn / 2
      : glassAtMirrorCentre();
  const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX;
  const offsets = (Array.isArray(opts.offsetsIn) && opts.offsetsIn.length === 2 ? opts.offsetsIn
    : opts.spacingIn != null ? [-opts.spacingIn, opts.spacingIn] : DEFAULT_OFFSETS_IN).map(inch);
  const surface = opts.surfaceOffsetM ?? 0;
  const group = new THREE.Group();
  group.name = spec.name;
  const lights = [], glows = new Set();
  offsets.forEach((dx, k) => {
    const s = spec.makeSconce(k);
    s.name = k === 0 ? 'sconceWest' : 'sconceEast';
    s.position.set(cx + dx, inch(centreIn), surface);
    group.add(s);
    lights.push(...s.userData.lights);
    for (const m of s.userData.glowMaterials || []) glows.add(m);
  });
  group.userData.placement = { glassCentreIn: centreIn, xs: offsets.map((d) => cx + d), z: surface };
  return finishFixture(group, lights, [...glows]);
}

/** Opal / etched / frosted glass that glows when the light is on: an outer
 *  face with an emissive ramp over its height (`rampF(v)`, v 0 bottom ->
 *  1 top) and an inner BackSide face lit directly (brighter).  Neither casts
 *  shadows (set on the meshes).  Returns { outer, inner, ramp, dispose }. */
export function glowGlass(THREE, {
  rampF = () => 1, color = 0xf4f2ec, roughness = 0.3, clearcoat = 0.8, clearcoatRoughness = 0.08,
  outerIntensity = 0.9, innerIntensity = 1.3,
} = {}) {
  const ramp = glowRamp(THREE, rampF);
  const outer = new THREE.MeshPhysicalMaterial({
    color, roughness, metalness: 0, clearcoat, clearcoatRoughness,
    emissive: warmWhite(THREE), emissiveIntensity: outerIntensity, emissiveMap: ramp,
  });
  const inner = new THREE.MeshStandardMaterial({
    color, roughness: 0.6, side: THREE.BackSide,
    emissive: warmWhite(THREE), emissiveIntensity: innerIntensity, emissiveMap: ramp,
  });
  for (const m of [outer, inner]) m.userData.onIntensity = m.emissiveIntensity;
  return { outer, inner, ramp, dispose: () => ramp.dispose() };
}

/** Aged-brass physical material (Hudson Valley / Mitzi "AGB"): a muted,
 *  slightly brown satin brass. */
export function agedBrass(THREE, { roughness = 0.38, color = 0xc4a065, anisotropy = 0.3 } = {}) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, anisotropy });
}

/** Mesh helper: add `geo` with `mat` to `parent` at (x, y, z). */
export function put(THREE, parent, geo, mat, x = 0, y = 0, z = 0, { cast = true, name } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast; m.receiveShadow = cast;
  if (name) m.name = name;
  parent.add(m);
  return m;
}
