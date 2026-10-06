// Pair of Cedar & Moss "Alto Rod 6"" pendants, Brass with the 6" opal globe
// (P-201-6-Rod-BR-OP-*, br-kmt), hung from the ceiling one each side of the
// oval mirror.  Product page, drawing and photo:
// assets/source/lights/alto-rod-pendants/ (SOURCES.md).
//
// One pendant: a 6" hand-blown opal glass globe, fully enclosed, its top
// held in a solid-brass spun cap; a short brass fitting, a rigid brass rod,
// a top fitting and a 5.75" shallow-dish canopy.  Sold in six "overall
// fixture lengths" (canopy top to globe bottom, the maker's drawing):
// 9.75, 13.75, 19.75, 25.75, 31.75 and 43.75" (custom lengths on request),
// so the real drop takes only those steps; the slider stays continuous.
// E26, one 60 W type A bulb, damp rated.
//
// build(ctx, { hangBottomIn = globe bottom AFF (clamped to ceiling - 9.75",
//              the shortest length), centreXIn = 54, centreZIn (pendant
//              centre, world z), ceilingIn = 120, shadows = true })
// Lights per pendant: one shadow-casting PointLight at the bulb (the glass
// does not cast; the brass cap, rod and canopy do).
import { remodelDims } from '../../remodel/cfg.js';
import {
  bulbLight, flankingPendantPair, hangAtMirrorCentre, lowestRealBottomIn, realDropIn,
  offsetsClearOfMirror, inch, mm,
} from './common.js';
import { milkGlass, glassShell, ellipseProfile, adder, latheIn } from './pendA-glass-parts.js';

const GLOBE_D_IN = 6;
const CAP_DEPTH_IN = 1.65;               // brass cap: globe top down to its rim (photo)
const CANOPY_D_IN = 5.75, CANOPY_H_IN = 0.9;
const LENGTHS_IN = [9.75, 13.75, 19.75, 25.75, 31.75, 43.75];   // "Overall Fixture Length" options
const REAL = { realDropRangeIn: [LENGTHS_IN[0], LENGTHS_IN[LENGTHS_IN.length - 1]], realDropStepsIn: LENGTHS_IN };
const DEFAULT_FROM_WALL_IN = 7;          // globe back 4" off the finished wall
// Globe centre on the mirror's widest point, snapped to the longest stock
// length that keeps it at or above that point (120" ceiling, 42" mirror:
// 43.75", globe bottom 76.25", centre 79.25"; the mirror centre would need a
// custom ~53" length).
const defaultHang = hangAtMirrorCentre(GLOBE_D_IN, REAL);

function pendant(THREE, mats, dropM, shadows, candela) {
  const p = new THREE.Group();
  const add = adder(THREE, p);
  const R = GLOBE_D_IN / 2;

  // Opal globe up to just inside the cap rim (closed bottom, no bulb seen).
  const capRimY = GLOBE_D_IN - CAP_DEPTH_IN;
  const rimR = Math.sqrt(R * R - (capRimY - R) ** 2);
  const neckR = Math.sqrt(R * R - (capRimY + 0.25 - R) ** 2);    // hidden under the cap
  p.add(glassShell(THREE, ellipseProfile(R, R, R, neckR), mats.glass, 'opalGlobe'));

  // Spun brass cap following the globe, a hair proud of it, rolled rim.
  {
    const rc = R + 0.04, pts = [];
    const a0 = Math.asin((capRimY - R) / rc);
    for (let i = 0; i <= 16; i++) {
      const a = a0 + (Math.PI / 2 - a0) * (i / 16);
      pts.push([rc * Math.cos(a), R + rc * Math.sin(a)]);
    }
    pts[pts.length - 1][0] = 0.3;                                // hole for the fitting
    add(latheIn(THREE, pts, 72), mats.brass, 0, 'brassCap');
    const rim = add(new THREE.TorusGeometry(inch(rimR + 0.04), mm(0.9), 6, 72), mats.brass, inch(capRimY), 'capRim');
    rim.rotation.x = Math.PI / 2;
  }
  // Fittings and rod (from the drawing: a short collar at each end).
  const top = inch(GLOBE_D_IN + 0.04);
  const fitH = inch(0.7), fitR = inch(0.3), rodR = inch(0.19);
  add(new THREE.CylinderGeometry(fitR, fitR, fitH, 24), mats.brass, top + fitH / 2, 'globeFitting');
  const canopyBot = dropM - inch(CANOPY_H_IN);
  const topFitH = inch(0.6);
  add(new THREE.CylinderGeometry(fitR, fitR, topFitH, 24), mats.brass, canopyBot - topFitH / 2, 'canopyFitting');
  const rodBot = top + fitH, rodTop = canopyBot - topFitH;
  const rodLen = Math.max(mm(3), rodTop - rodBot);
  add(new THREE.CylinderGeometry(rodR, rodR, rodLen, 16), mats.brass, rodBot + rodLen / 2, 'rod');
  // Shallow-dish canopy (drawing: a flat top on the ceiling, curved under).
  {
    const cr = CANOPY_D_IN / 2, h = CANOPY_H_IN, pts = [[0, -h], [0.45, -h]];
    for (let i = 1; i <= 10; i++) {
      const s = i / 10;
      pts.push([0.45 + (cr - 0.45) * Math.sin(s * Math.PI / 2), -h + h * (1 - Math.cos(s * Math.PI / 2)) ** 0.8]);
    }
    pts.push([cr - 0.05, 0]);
    add(latheIn(THREE, pts, 72), mats.brass, dropM, 'canopy');
  }

  const l = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512, near: 0.02 });
  l.position.y = inch(R + 0.6);                                   // A19 in the globe's upper half
  p.add(l);
  p.userData.lights = [l];
  p.userData.glowMaterials = mats.glowMaterials;
  return p;
}

export default {
  id: 'alto-rod-pendants',
  name: 'Cedar & Moss Alto Rod 6" pendants, opal globe (pair)',
  order: 50,
  ...REAL,
  description: (ctx) => {
    const ceil = remodelDims(ctx).ceiling / inch(1);
    return 'Two 6" hand-blown opal glass globes under a brass cap on rigid solid-brass rods, either side of the mirror ' +
      '(5.75" canopy; sold in overall lengths of 9.75, 13.75, 19.75, 25.75, 31.75 or 43.75", so at this ' +
      `${ceil.toFixed(0)}" ceiling the globe bottom can go no lower than ${lowestRealBottomIn(ceil, REAL).toFixed(2)}"; ` +
      'the default is the longest stock length that keeps the globe at or above the mirror\'s widest point, and lower ' +
      'slider values need a custom length, which Cedar & Moss makes on request). Damp rated.';
  },
  // Globe centre on the mirror's widest point, snapped to a stock length
  // (follows "Mirror bottom").
  defaultHangBottomIn: defaultHang,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    // x = 54 -/+ 16.5": the 6" globe 2" clear of the frame each side
    // (x 37.5" / 70.5"), 4.5" from the tub-column tile, 2.5" from the casing.
    const offsetsIn = offsetsClearOfMirror(ctx, GLOBE_D_IN / 2, 2);

    // Opal glass: brightest around the bulb (upper middle), a little dimmer
    // at the bottom pole; the cap hides the top.
    const bulbV = (GLOBE_D_IN / 2 + 0.6) / GLOBE_D_IN;
    const mg = milkGlass(THREE, (v) => 0.5 + 0.5 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.32 ** 2)), { intensity: 1.6 });
    const mats = {
      glass: mg.glass, glowMaterials: mg.glowMaterials,
      // Cedar & Moss "Brass": satin, warm, unlacquered-looking solid brass.
      brass: new THREE.MeshPhysicalMaterial({ color: 0xd4b06a, metalness: 1, roughness: 0.34, anisotropy: 0.25 }),
    };

    const group = flankingPendantPair(ctx, opts, {
      name: 'light:alto-rod-pendants',
      defaultHangIn: defaultHang({ ceilingIn: opts.ceilingIn ?? remodelDims(ctx).ceiling / inch(1) }),
      ...REAL,
      offsetsIn,
      defaultFromWallIn: DEFAULT_FROM_WALL_IN,
      makePendant: (drop) => pendant(THREE, mats, drop, shadows, opts.candela ?? 2.4),
    });
    const dropIn = group.userData.placement.drop / inch(1);
    group.userData.size = {
      globeDiameter: inch(GLOBE_D_IN), shadeHeight: inch(GLOBE_D_IN), dropIn,
      realLengthIn: realDropIn(dropIn, REAL),
    };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); mg.ramp.dispose(); };
    return group;
  },
};
