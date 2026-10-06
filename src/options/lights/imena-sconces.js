// Pair of West Elm "Imena Glass Sconce" 13.5" (Burnished Brass; br-d6l),
// one either side of the mirror.  References:
// assets/source/lights/imena-sconce/SOURCES.md.
//
// One sconce (5" W x 13.5" H x 5.5" projection, milk-glass globe 5" dia x
// 8.25" tall, 1 x E26 60 W, as the brief gives them; West Elm blocks
// automated page reads, so they were not re-read from the page): a round
// brass backplate at the top, a short arm out from its centre and a stem
// down to a small brass collar, from which an egg-shaped milk-glass globe
// hangs, widest in its lower third (product photo).  The globe is closed
// all round, so the bulb never shows; it is modelled as glowing milk
// glass, never clear.
//
// build(ctx, { mountCentreIn (globe centre AFF; default the mirror's widest
//              point), hangBottomIn (globe bottom, legacy), centreXIn = 54,
//              offsetsIn = [west, east], surfaceOffsetM, shadows })
// Lights: one shadow-casting PointLight per sconce at the bulb in the upper
// globe; the glass does not cast, the collar, arm and backplate do.
import { mirrorCentreIn, bulbLight, rod, heightUV, inch, mm } from './common.js';
import { opalMaterials, glassMesh, brassCyl, wallSconcePair } from './sconceA-parts.js';

// Inches; y from the globe centre (half its height), z off the wall.
const TOTAL_H = 13.5, PROJ = 5.5;
const GLOBE_D = 5, GLOBE_H = 8.25, NECK_R = 0.62;
const AXIS_Z = PROJ - GLOBE_D / 2;                 // 3.0"
const TOP_Y = TOTAL_H - GLOBE_H / 2;               // fixture top, 9.375" above the globe centre
const PLATE_D = 4.75, PLATE_T = 0.6;               // plate size assumed from the photo
const PLATE_Y = TOP_Y - PLATE_D / 2;
const COLLAR_R = 0.78, COLLAR_H = 0.65;
const BULB_Y = GLOBE_H / 2 - 2.6;                  // A19 hanging from the collar socket

/** Egg profile (widest low), closing to the neck at the top. */
function globeGeometry(THREE) {
  const R = inch(GLOBE_D / 2), H = inch(GLOBE_H), neck = inch(NECK_R);
  const raw = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, u = 2 * t - 1;
    raw.push([Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.2 * u), t]);
  }
  const max = Math.max(...raw.map((p) => p[0]));
  let cut = raw.length - 1;
  while (cut > 0 && (raw[cut][0] / max) * R < neck) cut--;
  const tTop = raw[cut][1];
  const pts = raw.slice(0, cut + 1).map(([r, t]) => new THREE.Vector2((r / max) * R, -H / 2 + (t / tTop) * H));
  pts[0].x = 0;
  pts.push(new THREE.Vector2(neck * 0.9, H / 2));
  return new THREE.LatheGeometry(pts, 64);
}

function sconce(THREE, mats, geos, shadows, candela) {
  const s = new THREE.Group();
  const zA = inch(AXIS_Z);
  // Round backplate (axis z) with a small centre boss.
  {
    const plate = brassCyl(THREE, inch(PLATE_D / 2), inch(PLATE_T), mats.brass, { seg: 64 });
    plate.rotation.x = Math.PI / 2;
    plate.position.set(0, inch(PLATE_Y), inch(PLATE_T / 2));
    plate.name = 'backplate';
    s.add(plate);
    const boss = brassCyl(THREE, inch(0.55), inch(0.35), mats.brass, { seg: 24 });
    boss.rotation.x = Math.PI / 2;
    boss.position.set(0, inch(PLATE_Y), inch(PLATE_T + 0.17));
    s.add(boss);
  }
  // Arm out from the plate centre, a knuckle, then the stem down to the collar.
  {
    const r = inch(0.17);
    const collarTop = inch(GLOBE_H / 2 + COLLAR_H - 0.1);
    s.add(rod(THREE, new THREE.Vector3(0, inch(PLATE_Y), inch(PLATE_T)), new THREE.Vector3(0, inch(PLATE_Y), zA), r, mats.brass, 16));
    const k = new THREE.Mesh(new THREE.SphereGeometry(inch(0.3), 20, 14), mats.brass);
    k.position.set(0, inch(PLATE_Y), zA);
    k.castShadow = true;
    s.add(k);
    s.add(rod(THREE, new THREE.Vector3(0, inch(PLATE_Y), zA), new THREE.Vector3(0, collarTop, zA), r, mats.brass, 16));
    const collar = brassCyl(THREE, inch(COLLAR_R), inch(COLLAR_H), mats.brass,
      { y: inch(GLOBE_H / 2 - 0.1 + COLLAR_H / 2), z: zA, seg: 40, rTop: inch(COLLAR_R * 0.8) });
    collar.name = 'collar';
    s.add(collar);
  }
  const globe = glassMesh(THREE, geos.globe, mats.glass, 'milkGlobe');
  globe.position.z = zA;
  s.add(globe);
  const l = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512 });
  l.position.set(0, inch(BULB_Y), zA + mm(2));
  s.add(l);
  s.userData.lights = [l];
  return s;
}

export default {
  id: 'imena-sconces',
  name: 'West Elm Imena milk-glass globe sconces (pair)',
  order: 42,
  mount: 'wall',
  description: 'Two 5" x 13.5" Burnished Brass sconces, a 5" x 8.25" milk-glass egg globe hanging from a round backplate, flanking the mirror',
  // Globe centre on the mirror's widest point (follows "Mirror bottom").
  defaultMountCentreIn: mirrorCentreIn,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const bulbV = (BULB_Y + GLOBE_H / 2) / GLOBE_H;
    const opal = opalMaterials(THREE, (v) => 0.5 + 0.5 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.32 ** 2)), { intensity: 0.95 });
    const mats = {
      glass: opal.glass,
      // Burnished brass: darker and browner than aged brass.
      brass: new THREE.MeshPhysicalMaterial({ color: 0xb48e55, metalness: 1, roughness: 0.42 }),
    };
    const H = inch(GLOBE_H);
    const geos = { globe: heightUV(globeGeometry(THREE), -H / 2, H) };
    const group = wallSconcePair(ctx, opts, {
      name: 'light:imena-sconces',
      bottomToCentreIn: GLOBE_H / 2,
      makeSconce: () => sconce(THREE, mats, geos, shadows, opts.candela ?? 2.4),
      glows: opal.glows,
      dispose: () => opal.ramp.dispose(),
    }, mirrorCentreIn());
    group.userData.size = { globeDiameter: inch(GLOBE_D), globeHeight: H, height: inch(TOTAL_H), projection: inch(PROJ) };
    return group;
  },
};
