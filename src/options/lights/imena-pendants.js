// Pair of West Elm "Imena Glass Pendant", 6" (SKU 947695, br-kmt), hung from
// the ceiling one each side of the oval mirror.  Product page and photos:
// assets/source/lights/imena-pendants/ (SOURCES.md).
//
// One pendant: a 6" diam. x 10" milk-glass egg (narrow at the top, fullest
// low down, closed round bottom), a small Burnished Brass cap on its neck,
// a loop, a thin brass hanger rod in linked sections (photo; the 7' cord
// runs inside, assumed) and a 5" domed canopy with a loop under it.
// Overall 27.75"-63.75" (West Elm's min. / max. hanging height, taken as
// canopy top to glass bottom, continuous).  One E26 60 W bulb.
//
// build(ctx, { hangBottomIn = glass bottom AFF (clamped to ceiling - 27.75",
//              the shortest real drop), centreXIn = 54, centreZIn (pendant
//              centre, world z), ceilingIn = 120, shadows = true })
// Lights per pendant: one shadow-casting PointLight at the bulb (the glass
// does not cast; the cap, loops, rod and canopy do).
import { remodelDims } from '../../remodel/cfg.js';
import {
  bulbLight, flankingPendantPair, hangAtMirrorCentre, lowestRealBottomIn,
  offsetsClearOfMirror, inch, mm,
} from './common.js';
import { milkGlass, glassShell, adder, latheIn } from './pendA-glass-parts.js';

const SHADE_D_IN = 6, SHADE_H_IN = 10;
const NECK_R_IN = 0.7;                   // glass neck under the cap (photo)
const FULL_Y_IN = 3.6;                   // height of the egg's widest point (photo)
const CANOPY_D_IN = 5, CANOPY_H_IN = 1.1;
const REAL = { realDropRangeIn: [27.75, 63.75] };    // West Elm: min / max hanging height
const DEFAULT_FROM_WALL_IN = 7;          // glass back 4" off the finished wall
// Glass centre on the mirror's widest point (42" mirror: bottom 65", drop 55").
const defaultHang = hangAtMirrorCentre(SHADE_H_IN, REAL);

/** Egg profile, bottom pole to neck: an ellipse below the widest point, a
 *  slowly tapering curve above it. */
function eggProfile() {
  const R = SHADE_D_IN / 2, pts = [];
  for (let i = 0; i <= 18; i++) {                          // lower half
    const t = (i / 18) * (Math.PI / 2);
    pts.push([R * Math.sin(t), FULL_Y_IN - FULL_Y_IN * Math.cos(t)]);
  }
  const top = SHADE_H_IN - FULL_Y_IN;
  for (let i = 1; i <= 26; i++) {                          // upper taper
    const s = i / 26;
    const r = Math.max(NECK_R_IN, R * Math.pow(1 - Math.pow(s, 2.1), 0.62));
    pts.push([r, FULL_Y_IN + top * s]);
  }
  pts[0][0] = 0;
  return pts;
}

function pendant(THREE, mats, dropM, shadows, candela) {
  const p = new THREE.Group();
  const add = adder(THREE, p);
  const H = SHADE_H_IN;
  p.add(glassShell(THREE, eggProfile(), mats.glass, 'milkGlassEgg'));

  // Cap on the neck: a small brass dome (about 1.9" x 0.8", photo).
  add(latheIn(THREE, [[0.98, 0], [0.98, 0.18], [0.85, 0.5], [0.55, 0.75], [0.25, 0.82], [0, 0.82]], 48),
    mats.brass, inch(H - 0.3), 'brassCap');
  const loop = (y, name) => {
    const m = add(new THREE.TorusGeometry(inch(0.22), mm(1.6), 8, 20), mats.brass, y, name);
    m.scale.set(1, 1.3, 1);
    return m;
  };
  const capTop = inch(H - 0.3 + 0.82);
  loop(capTop + inch(0.3), 'capLoop');
  // Hanger rod: linked sections, a small knuckle every 12" up from the cap.
  const canopyBot = dropM - inch(CANOPY_H_IN);
  const hookY = canopyBot - inch(0.35);
  loop(hookY, 'canopyLoop').rotation.y = Math.PI / 2;
  const rodBot = capTop + inch(0.6), rodTop = hookY - inch(0.3);
  const rodLen = Math.max(mm(3), rodTop - rodBot);
  const rodR = inch(0.12);
  add(new THREE.CylinderGeometry(rodR, rodR, rodLen, 12), mats.brass, rodBot + rodLen / 2, 'hangerRod');
  for (let y = rodBot + inch(12); y < rodTop - inch(3); y += inch(12)) {
    add(new THREE.CylinderGeometry(rodR + mm(1), rodR + mm(1), inch(0.35), 12), mats.brass, y);
  }
  // Domed canopy with a small collar under it.
  {
    const cr = CANOPY_D_IN / 2, h = CANOPY_H_IN, pts = [[0, -h], [0.35, -h]];
    for (let i = 1; i <= 10; i++) {
      const s = i / 10;
      pts.push([0.35 + (cr - 0.35) * Math.sin(s * Math.PI / 2), -h + h * (1 - Math.cos(s * Math.PI / 2)) ** 0.6]);
    }
    pts.push([cr - 0.05, 0]);
    add(latheIn(THREE, pts, 64), mats.brass, dropM, 'canopy');
  }

  const l = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512, near: 0.02 });
  l.position.y = inch(5.8);                // A19 hanging from the neck socket
  p.add(l);
  p.userData.lights = [l];
  p.userData.glowMaterials = mats.glowMaterials;
  return p;
}

export default {
  id: 'imena-pendants',
  name: 'West Elm Imena milk-glass pendants (pair)',
  order: 51,
  ...REAL,
  description: (ctx) => 'Two 6" x 10" milk-glass egg pendants on thin Burnished Brass hangers, either side of the mirror ' +
    `(5" canopy, drop 27.75–63.75": at this ceiling the glass bottom can go no lower than ` +
    `${lowestRealBottomIn(remodelDims(ctx).ceiling / inch(1), REAL).toFixed(2)}"). Damp rating not stated by West Elm.`,
  // Glass centre on the mirror's widest point (follows "Mirror bottom").
  defaultHangBottomIn: defaultHang,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    // x = 54 -/+ 16.5": the 6" egg 2" clear of the frame each side
    // (x 37.5" / 70.5"), 4.5" from the tub-column tile, 2.5" from the casing.
    const offsetsIn = offsetsClearOfMirror(ctx, SHADE_D_IN / 2, 2);

    // Milk glass: brightest at the bulb (upper middle), glowing down into
    // the full lower bowl, dimmer at the narrow neck.
    const bulbV = 5.8 / SHADE_H_IN;
    const mg = milkGlass(THREE, (v) => 0.45 + 0.55 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.3 ** 2)), { intensity: 1.6 });
    const mats = {
      glass: mg.glass, glowMaterials: mg.glowMaterials,
      // Burnished Brass: a soft, slightly darker satin brass (photos).
      brass: new THREE.MeshPhysicalMaterial({ color: 0xc4a46c, metalness: 1, roughness: 0.42, anisotropy: 0.2 }),
    };

    const group = flankingPendantPair(ctx, opts, {
      name: 'light:imena-pendants',
      defaultHangIn: defaultHang({ ceilingIn: opts.ceilingIn ?? remodelDims(ctx).ceiling / inch(1) }),
      ...REAL,
      offsetsIn,
      defaultFromWallIn: DEFAULT_FROM_WALL_IN,
      makePendant: (drop) => pendant(THREE, mats, drop, shadows, opts.candela ?? 2.4),
    });
    group.userData.size = { shadeDiameter: inch(SHADE_D_IN), shadeHeight: inch(SHADE_H_IN) };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); mg.ramp.dispose(); };
    return group;
  },
};
