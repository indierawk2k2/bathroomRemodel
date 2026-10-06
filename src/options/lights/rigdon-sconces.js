// Pair of Rejuvenation "Rigdon Glass Sconce" (single tube, SKU 7618680,
// Aged Brass; br-d6l), one either side of the mirror.  References:
// assets/source/lights/rigdon-sconce/SOURCES.md.
//
// One sconce (4.75" W x 13" H x 3.75" projection, as the brief gives it;
// Rejuvenation blocks automated reads, so these were not re-read from the
// page): a round 4.75" brass backplate at the bottom with a small boss, a
// brass cup 3.1" x 2.5" in front of it, and an opal glass tube 2.5" dia
// rising out of the cup to a polished brass cap ring at the top.  The tube
// encloses the single E26 bulb completely (cap closed on top), so no bulb
// is visible from anywhere; it is modelled as glowing opal, never clear.
//
// build(ctx, { mountCentreIn (centre of the visible glass AFF; default the
//              mirror's widest point), hangBottomIn (fixture bottom, legacy),
//              centreXIn = 54, offsetsIn = [west, east], surfaceOffsetM, shadows })
// Lights: one shadow-casting PointLight per sconce at the bulb (the glass
// does not cast; the cup and backplate do, so the cup darkens the wall
// just below it).
import { mirrorCentreIn, bulbLight, heightUV, inch, mm } from './common.js';
import { opalMaterials, glassMesh, brassCyl, wallSconcePair } from './sconceA-parts.js';

// Inches, measured from the fixture bottom (photo proportions scaled to 13").
const PLATE_D = 4.75, PLATE_T = 0.5;
const CUP_R = 1.55, CUP_Y0 = 1.1, CUP_Y1 = 3.6;
const PROJ = 3.75, AXIS_Z = PROJ - CUP_R;          // tube axis off the wall
const GLASS_R = 1.25, GLASS_Y0 = 2.6, GLASS_Y1 = 12.8;
const CAP_Y1 = 13.0;
const BULB_Y = CUP_Y1 + 2.6;
const CENTRE = (CUP_Y1 + GLASS_Y1) / 2;            // visible glass centre, 8.2"

function sconce(THREE, mats, shadows, candela) {
  const s = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = -inch(CENTRE);
  s.add(body);
  const zA = inch(AXIS_Z);
  // Round backplate (axis z) with a raised centre boss.
  {
    const plate = brassCyl(THREE, inch(PLATE_D / 2), inch(PLATE_T), mats.brass, { seg: 64 });
    plate.rotation.x = Math.PI / 2;
    plate.position.set(0, inch(PLATE_D / 2), inch(PLATE_T / 2));
    plate.name = 'backplate';
    body.add(plate);
    const boss = brassCyl(THREE, inch(0.75), inch(0.25), mats.brass, { seg: 32 });
    boss.rotation.x = Math.PI / 2;
    boss.position.set(0, inch(PLATE_D / 2), inch(PLATE_T + 0.12));
    body.add(boss);
    const neck = brassCyl(THREE, inch(0.45), zA - inch(PLATE_T), mats.brass, { seg: 20 });
    neck.rotation.x = Math.PI / 2;
    neck.position.set(0, inch((CUP_Y0 + CUP_Y1) / 2), (zA + inch(PLATE_T)) / 2);
    body.add(neck);
  }
  // Cup holding the tube, with thin polished lips top and bottom.
  {
    const h = CUP_Y1 - CUP_Y0;
    const cup = brassCyl(THREE, inch(CUP_R), inch(h), mats.brass, { y: inch(CUP_Y0 + h / 2), z: zA, seg: 64 });
    cup.name = 'cup';
    body.add(cup);
    for (const y of [CUP_Y0 + 0.05, CUP_Y1 - 0.05]) {
      body.add(brassCyl(THREE, inch(CUP_R + 0.03), inch(0.1), mats.polished, { y: inch(y), z: zA, seg: 64 }));
    }
  }
  // Opal tube (inside the cup from GLASS_Y0) and the closed top cap.
  {
    const H = GLASS_Y1 - GLASS_Y0;
    const g = heightUV(new THREE.CylinderGeometry(inch(GLASS_R), inch(GLASS_R), inch(H), 64, 6, true)
      .translate(0, inch(H / 2), 0), 0, inch(H));
    const tube = glassMesh(THREE, g, mats.glass, 'opalTube');
    tube.position.set(0, inch(GLASS_Y0), zA);
    body.add(tube);
    const cap = brassCyl(THREE, inch(GLASS_R + 0.07), inch(CAP_Y1 - GLASS_Y1 + 0.1), mats.polished,
      { y: inch((GLASS_Y1 - 0.1 + CAP_Y1) / 2), z: zA, seg: 64 });
    cap.name = 'topCap';
    body.add(cap);
  }
  const l = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512 });
  l.position.set(0, inch(BULB_Y), zA + mm(2));
  body.add(l);
  s.userData.lights = [l];
  return s;
}

export default {
  id: 'rigdon-sconces',
  name: 'Rejuvenation Rigdon opal tube sconces (pair)',
  order: 31,
  mount: 'wall',
  description: 'Two 4.75" x 13" Aged Brass sconces, an opal glass tube rising from a brass cup on a round backplate, flanking the mirror',
  // Glass centre on the mirror's widest point (follows "Mirror bottom").
  defaultMountCentreIn: mirrorCentreIn,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const bulbV = (BULB_Y - GLASS_Y0) / (GLASS_Y1 - GLASS_Y0);
    const opal = opalMaterials(THREE, (v) => 0.5 + 0.5 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.3 ** 2)), { intensity: 0.95 });
    const mats = {
      glass: opal.glass,
      // Aged brass: satin, a little deeper than the Harlan's brushed brass.
      brass: new THREE.MeshPhysicalMaterial({ color: 0xc29a58, metalness: 1, roughness: 0.38 }),
      polished: new THREE.MeshPhysicalMaterial({ color: 0xd2ad68, metalness: 1, roughness: 0.22 }),
    };
    const group = wallSconcePair(ctx, opts, {
      name: 'light:rigdon-sconces',
      bottomToCentreIn: CENTRE,
      makeSconce: () => sconce(THREE, mats, shadows, opts.candela ?? 2.2),
      glows: opal.glows,
      dispose: () => opal.ramp.dispose(),
    }, mirrorCentreIn());
    group.userData.size = { glassDiameter: inch(GLASS_R * 2), glassHeight: inch(GLASS_Y1 - CUP_Y1), height: inch(CAP_Y1), projection: inch(PROJ) };
    return group;
  },
};
