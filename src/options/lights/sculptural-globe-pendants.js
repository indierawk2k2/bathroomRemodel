// Pair of West Elm "Sculptural Globe Pendant", 6.5" shade, Milk glass
// (br-kmt), hung from the ceiling one each side of the oval mirror.  Product
// page and photos: assets/source/lights/sculptural-globe-pendants/
// (SOURCES.md).  The page opens on Clear glass; only Milk is modelled (no
// visible bulbs).
//
// One pendant: a 6.6" diam. x 5.9" hand-blown milk-glass globe (closed
// round bottom, a small neck at the top), a brass socket cup set into the
// neck, a ~6" brass stem, a thin cord and a 5" x 0.75" disc canopy with a
// cord grip.  Overall 15.9"-80" (min. / max. hanging length, canopy top to
// globe bottom, cord: continuous).  E26, one 60 W bulb, dimmable, damp rated.
// Finish: Antique Brass (the page's selected finish).
//
// build(ctx, { hangBottomIn = globe bottom AFF (clamped to ceiling - 15.9",
//              the shortest real drop), centreXIn = 54, centreZIn (pendant
//              centre, world z), ceilingIn = 120, shadows = true })
// Lights per pendant: one shadow-casting PointLight at the bulb (the glass
// does not cast; the socket, stem, cord and canopy do).
import { remodelDims } from '../../remodel/cfg.js';
import {
  bulbLight, flankingPendantPair, hangAtMirrorCentre, lowestRealBottomIn,
  offsetsClearOfMirror, inch, mm,
} from './common.js';
import { milkGlass, glassShell, ellipseProfile, adder } from './pendA-glass-parts.js';

const SHADE_D_IN = 6.6, SHADE_H_IN = 5.9;
const NECK_R_IN = 1.2;                   // opening the socket cup drops into (photo)
// Slightly squat globe: 6.6" wide, its 2.4" neck reached at 5.9".
const B_IN = SHADE_H_IN / (1 + Math.sqrt(1 - (NECK_R_IN / (SHADE_D_IN / 2)) ** 2));
const STEM_IN = 6, CANOPY_D_IN = 5, CANOPY_H_IN = 0.75;
const REAL = { realDropRangeIn: [15.9, 80] };      // West Elm: min / max hanging length
const DEFAULT_FROM_WALL_IN = 7;          // globe back 3.7" off the finished wall
// Globe centre on the mirror's widest point (42" mirror: bottom 67.05",
// drop 52.95").
const defaultHang = hangAtMirrorCentre(SHADE_H_IN, REAL);

function pendant(THREE, mats, dropM, shadows, candela) {
  const p = new THREE.Group();
  const add = adder(THREE, p);
  const A = SHADE_D_IN / 2, H = SHADE_H_IN;

  // Milk-glass globe with a short rolled lip at the neck.
  const prof = ellipseProfile(A, B_IN, B_IN, NECK_R_IN);
  prof.push([NECK_R_IN - 0.05, H + 0.12], [NECK_R_IN - 0.18, H + 0.12]);
  p.add(glassShell(THREE, prof, mats.glass, 'milkGlassGlobe'));

  // Socket cup in the neck (photo: about 1.3" x 1.6", its lower 0.6" inside
  // the glass), a ring at its top, then the stem.
  const cupR = inch(0.65), cupH = inch(1.6), cupBot = inch(H - 0.6);
  add(new THREE.CylinderGeometry(cupR, cupR, cupH, 28), mats.brass, cupBot + cupH / 2, 'socketCup');
  add(new THREE.CylinderGeometry(cupR + mm(1.5), cupR + mm(1.5), inch(0.2), 28), mats.brass, cupBot + inch(0.9), 'shadeRing');
  const cupTop = cupBot + cupH;
  add(new THREE.CylinderGeometry(inch(0.3), cupR - mm(2), inch(0.3), 24), mats.brass, cupTop + inch(0.15));
  const stemBot = cupTop + inch(0.3);
  const canopyBot = dropM - inch(CANOPY_H_IN);
  const gripH = inch(0.6);
  const cordTop = canopyBot - gripH;
  const stemLen = Math.max(mm(3), Math.min(inch(STEM_IN), cordTop - stemBot - mm(5)));
  add(new THREE.CylinderGeometry(inch(0.2), inch(0.2), stemLen, 16), mats.brass, stemBot + stemLen / 2, 'stem');
  const cordBot = stemBot + stemLen;
  const cordLen = Math.max(mm(3), cordTop - cordBot);
  add(new THREE.CylinderGeometry(inch(0.09), inch(0.09), cordLen, 10), mats.cord, cordBot + cordLen / 2, 'cord');
  add(new THREE.CylinderGeometry(inch(0.16), inch(0.24), gripH, 16), mats.brass, canopyBot - gripH / 2, 'cordGrip');
  add(new THREE.CylinderGeometry(inch(CANOPY_D_IN / 2) - mm(1.5), inch(CANOPY_D_IN / 2), inch(CANOPY_H_IN), 56),
    mats.brass, dropM - inch(CANOPY_H_IN) / 2, 'canopy');

  const l = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512, near: 0.02 });
  l.position.y = inch(B_IN + 0.3);         // A19 just above the globe's middle
  p.add(l);
  p.userData.lights = [l];
  p.userData.glowMaterials = mats.glowMaterials;
  return p;
}

export default {
  id: 'sculptural-globe-pendants',
  name: 'West Elm Sculptural Globe pendants, milk glass (pair)',
  order: 52,
  ...REAL,
  description: (ctx) => 'Two 6.6" x 5.9" milk-glass globes on Antique Brass stems and cords, either side of the mirror ' +
    `(5" canopy, drop 15.9–80": at this ceiling the globe bottom can go no lower than ` +
    `${lowestRealBottomIn(remodelDims(ctx).ceiling / inch(1), REAL).toFixed(1)}"). Damp rated, dimmable.`,
  // Globe centre on the mirror's widest point (follows "Mirror bottom").
  defaultHangBottomIn: defaultHang,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    // x = 54 -/+ 16.8": the 6.6" globe 2" clear of the frame each side
    // (x 37.2" / 70.8"), 3.9" from the tub-column tile, 1.9" from the casing.
    const offsetsIn = offsetsClearOfMirror(ctx, SHADE_D_IN / 2, 2);

    const bulbV = (B_IN + 0.3) / SHADE_H_IN;
    const mg = milkGlass(THREE, (v) => 0.5 + 0.5 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.33 ** 2)), { intensity: 1.6 });
    const mats = {
      glass: mg.glass, glowMaterials: mg.glowMaterials,
      // Antique Brass: a warm, slightly deep satin brass (photos).
      brass: new THREE.MeshPhysicalMaterial({ color: 0xc9a160, metalness: 1, roughness: 0.38, anisotropy: 0.2 }),
      cord: new THREE.MeshStandardMaterial({ color: 0x8a7350, roughness: 0.8 }),   // brass-tone cord (studio photo)
    };

    const group = flankingPendantPair(ctx, opts, {
      name: 'light:sculptural-globe-pendants',
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
