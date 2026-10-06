// Mitzi "Reese" large pendant, H281701L-AGB, Aged Brass (br-cmo): one
// statement pendant hung in front of the mirror like the Monteaux.  Product
// page and photo: assets/source/lights/reese-large-pendant/ (SOURCES.md).
//
// 14" diam. x 17.25" h body (Hudson Valley spec): a glossy opal glass globe
// (widest 14" at ~6.8" up, narrowing to ~7.3" under the cap and ~11" at the
// bottom) under a flared aged-brass trumpet cap, a flat 12.3" brass ring
// round its lower edge, and a smaller opal dome (~9.2" x 2.4") closing the
// bottom below the ring, so the A19 bulb is wholly enclosed.  Black fabric
// cord, 21.5"-143" hanging height, 4.75" x 0.5" round canopy.  Damp rated.
// Profile heights other than the overall 17.25" were measured off the
// product photo (SOURCES.md).
//
// build(ctx, { hangBottomIn = 76 (clamped to ceiling - 21.5", the shortest
//              real hang), centreXIn = 54, centreZIn = 16 (fixture centre,
//              world z), ceilingIn = 120, shadows = true })
// Default 76": the body spans 76-93.25", below the mirror top (98") and 8"
// above a standing user's eyes; 16" off the wall (9" behind its back).
// Lights: 1 shadow-casting PointLight at the bulb (the glass does not cast,
// only the brass cap / ring / cord do) + 1 weak unshadowed fill.
import { remodelDims } from '../../remodel/cfg.js';
import { bulbLight, finishFixture, lowestRealBottomIn } from './common.js';
import { latheIn, glowingGlass, addMesh, statementBottom, heightUV, inch, mm } from './statement-parts.js';

const REAL = { realDropRangeIn: [21.5, 143] };   // HVL: min / max height (cord, continuous)
const BODY_H_IN = 17.25, BODY_D_IN = 14;
const DEFAULT_HANG_IN = 76;
const DEFAULT_FROM_WALL_IN = 16;

// Profiles (r, y) in inches from the fixture bottom, measured off the photo
// (globe 14" = 595 px, 42.5 px/in).
const RING_Y = 2.45;                       // brass ring (flat flange), centre height
const GLOBE = [[5.45, RING_Y], [6.25, 3.4], [6.85, 4.9], [7.0, 6.8], [6.75, 8.5], [5.7, 9.9], [3.65, 10.95]];
const CAP_Y0 = 10.85;                      // cap skirt bottom (overlaps the globe neck)

export default {
  id: 'reese-large-pendant',
  name: 'Mitzi Reese pendant, large (Aged Brass)',
  order: 21,
  ...REAL,
  description: (ctx) => '14" x 17.25" glossy opal glass globe with a second opal dome under the brass ring hiding the bulb, ' +
    'aged-brass trumpet cap on a black fabric cord (hang 21.5–143"; at this ceiling the bottom can go no lower than ' +
    `${lowestRealBottomIn(remodelDims(ctx).ceiling / inch(1), REAL).toFixed(1)}"), damp rated. Mitzi H281701L-AGB.`,
  defaultHangBottomIn: DEFAULT_HANG_IN,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const D = remodelDims(ctx);
    const ceiling = opts.ceilingIn != null ? inch(opts.ceilingIn) : D.ceiling;
    const bottom = statementBottom(opts, ceiling, DEFAULT_HANG_IN, REAL.realDropRangeIn[0]);
    const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX;
    const cz = opts.centreZIn != null ? inch(opts.centreZIn) : inch(DEFAULT_FROM_WALL_IN);
    const shadows = opts.shadows !== false;

    const group = new THREE.Group();
    group.name = 'light:reese-large-pendant';
    group.position.set(cx, bottom, cz);
    const H = inch(BODY_H_IN);

    // Glossy opal glass: brightest around the bulb (~5.8" up), dimmer at the
    // neck; the lower dome sits right under the bulb and reads brightest.
    const globeGlass = glowingGlass(THREE, (v) => 0.45 + 0.55 * Math.exp(-((v - 0.42) ** 2) / (2 * 0.28 ** 2)),
      { intensity: 0.85, roughness: 0.12, clearcoat: 1 });
    const domeGlass = glowingGlass(THREE, (v) => 0.75 + 0.25 * v, { intensity: 1.1, roughness: 0.12, clearcoat: 1 });
    const brass = new THREE.MeshPhysicalMaterial({ color: 0xa9874f, metalness: 1, roughness: 0.38, clearcoat: 0.15, side: THREE.DoubleSide });
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 });

    // Globe (open top under the cap, open bottom at the ring: the lower dome
    // and the ring close it).
    const g0 = GLOBE[0][1], g1 = GLOBE[GLOBE.length - 1][1];
    const globeGeo = heightUV(latheIn(THREE, GLOBE, { segments: 96, smooth: 48 }), inch(g0), inch(g1 - g0));
    addMesh(THREE, group, globeGeo, globeGlass.material, { name: 'opalGlobe', cast: false });
    // Lower opal dome: ~9.2" across at the ring, 2.4" deep, closed bottom.
    const DOME = [[0, 0], [1.6, 0.08], [3.0, 0.38], [4.0, 0.95], [4.5, 1.6], [4.65, RING_Y + 0.1]];
    const domeGeo = heightUV(latheIn(THREE, DOME, { segments: 72, smooth: 24 }), 0, inch(RING_Y));
    addMesh(THREE, group, domeGeo, domeGlass.material, { name: 'opalLowerDome', cast: false });

    // Brass ring: flat flange 12.3" across, 0.35" thick, round the joint.
    const RING = [[4.55, RING_Y - 0.17], [6.15, RING_Y - 0.17], [6.18, RING_Y + 0.17], [5.3, RING_Y + 0.17]];
    const ringGeo = latheIn(THREE, [...RING, RING[0]], { segments: 96 });
    addMesh(THREE, group, ringGeo, brass, { name: 'brassRing' });

    // Trumpet cap: concave flare from a 0.6" neck at the top to 7.6" over
    // the globe shoulder, with a little rolled skirt.
    const cap = [[3.82, CAP_Y0], [3.86, CAP_Y0 + 0.12]];
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;                        // 0 at the skirt, 1 at the neck
      const y = CAP_Y0 + 0.12 + t * (BODY_H_IN - CAP_Y0 - 0.12);
      cap.push([0.32 + (3.86 - 0.32) * (1 - t) ** 2.6, y]);
    }
    addMesh(THREE, group, latheIn(THREE, cap, { segments: 72 }), brass, { name: 'trumpetCap' });
    // Inside face of the cap seen through nothing (closed by the globe) but
    // the cap must also close the globe top: an underside disc.
    const lid = addMesh(THREE, group, new THREE.CircleGeometry(inch(3.8), 48), brass, { y: inch(CAP_Y0 + 0.02), cast: false });
    lid.rotation.x = Math.PI / 2;

    // Cord and canopy.
    const topY = ceiling - bottom;
    const canopyH = inch(0.5);
    const cordLen = Math.max(mm(5), topY - canopyH - H);
    addMesh(THREE, group, new THREE.CylinderGeometry(mm(3.2), mm(3.2), cordLen, 10), cordMat,
      { y: H + cordLen / 2, name: 'cord' });
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.36), inch(0.36), inch(0.5), 16), brass,
      { y: H - inch(0.1), name: 'cordGrip' });
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(2.3), inch(2.375), canopyH, 48), brass,
      { y: topY - canopyH / 2, name: 'canopy' });

    // Light: bulb at ~5.8" (A19 in a socket under the cap); no bulb mesh,
    // the opal glass hides it from every side.
    const candela = opts.candela ?? 4.5;
    const main = bulbLight(THREE, { candela, shadow: shadows, mapSize: 1024 });
    main.position.y = inch(5.8);
    group.add(main);
    const fill = bulbLight(THREE, { candela: candela * 0.2, shadow: false });
    fill.position.y = inch(4.5);
    group.add(fill);

    group.userData.size = { diameter: inch(BODY_D_IN), height: H };
    finishFixture(group, [main, fill], [globeGlass.material, domeGlass.material]);
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); globeGlass.ramp.dispose(); domeGlass.ramp.dispose(); };
    return group;
  },
};
