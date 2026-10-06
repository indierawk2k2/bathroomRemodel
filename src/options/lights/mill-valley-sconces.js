// Pair of Hudson Valley Lighting "Mill Valley" wall sconces, 1261-AGB
// (Aged Brass; br-d6l), one either side of the mirror.  Product page specs
// and photo: assets/source/lights/mill-valley-sconce/SOURCES.md.
//
// One sconce (page: 4.5" W x 12.25" H, 4" extension, 4.5" square
// backplate, opal matte glass shade 11" tall / 2" top): a tiered square
// brass backplate at the bottom, a brass band (cup) 3.2" dia with a stepped
// base and a knurled ring on top, and a 2" opal matte cylinder rising from
// it to a knurled brass cap.  The glass encloses the single E26 T10 bulb
// completely (closed cap), so no bulb shows from anywhere.
//
// build(ctx, { mountCentreIn (centre of the visible glass AFF; default the
//              mirror's widest point), hangBottomIn (fixture bottom, legacy),
//              centreXIn = 54, offsetsIn = [west, east], surfaceOffsetM, shadows })
// Lights: one shadow-casting PointLight per sconce at the bulb; the glass
// does not cast, the band and backplate do.
import { mirrorCentreIn, bulbLight, heightUV, inch, mm } from './common.js';
import { opalMaterials, glassMesh, brassCyl, knurledRing, wallSconcePair } from './sconceA-parts.js';

// Inches from the fixture bottom (photo proportions scaled to 12.25").
const PLATE = 4.5, PLATE_T = 0.35, TIER = 3.9, TIER_T = 0.3;
const BAND_R = 1.6, BAND_Y0 = 1.2, BAND_Y1 = 3.2;
const EXT = 4, AXIS_Z = EXT - BAND_R;               // cylinder axis off the wall
const KNURL_H = 0.18;
const GLASS_R = 1.0, SHADE_H = 11, GLASS_Y1 = 12.05, GLASS_Y0 = GLASS_Y1 - SHADE_H;
const TOP = 12.25;
const BULB_Y = 5.0;                                  // T10 5.5" bulb in the band's socket
const CENTRE = (BAND_Y1 + KNURL_H + GLASS_Y1) / 2;   // visible glass centre, ~7.7"

function sconce(THREE, mats, shadows, candela) {
  const s = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = -inch(CENTRE);
  s.add(body);
  const zA = inch(AXIS_Z);
  // Tiered square backplate.
  {
    const base = new THREE.Mesh(new THREE.BoxGeometry(inch(PLATE), inch(PLATE), inch(PLATE_T)), mats.brass);
    base.position.set(0, inch(PLATE / 2), inch(PLATE_T / 2));
    base.castShadow = base.receiveShadow = true;
    base.name = 'backplate';
    body.add(base);
    const tier = new THREE.Mesh(new THREE.BoxGeometry(inch(TIER), inch(TIER), inch(TIER_T)), mats.brass);
    tier.position.set(0, inch(PLATE / 2), inch(PLATE_T + TIER_T / 2));
    tier.castShadow = tier.receiveShadow = true;
    body.add(tier);
    const back = inch(PLATE_T + TIER_T);
    const neck = brassCyl(THREE, inch(0.5), zA - back, mats.brass, { seg: 20 });
    neck.rotation.x = Math.PI / 2;
    neck.position.set(0, inch((BAND_Y0 + BAND_Y1) / 2), (zA + back) / 2);
    body.add(neck);
  }
  // Band with a stepped base and a knurled ring on top.
  {
    const h = BAND_Y1 - BAND_Y0;
    const band = brassCyl(THREE, inch(BAND_R), inch(h), mats.brass, { y: inch(BAND_Y0 + h / 2), z: zA, seg: 72 });
    band.name = 'band';
    body.add(band);
    body.add(brassCyl(THREE, inch(BAND_R - 0.15), inch(0.25), mats.brass, { y: inch(BAND_Y0 - 0.1), z: zA, seg: 72 }));
    const k = knurledRing(THREE, inch(1.35), inch(KNURL_H), mats.polished);
    k.position.set(0, inch(BAND_Y1 + KNURL_H / 2), zA);
    body.add(k);
  }
  // Opal matte cylinder (from inside the band) and the knurled top cap.
  {
    const g = heightUV(new THREE.CylinderGeometry(inch(GLASS_R), inch(GLASS_R), inch(SHADE_H), 64, 6, true)
      .translate(0, inch(SHADE_H / 2), 0), 0, inch(SHADE_H));
    const tube = glassMesh(THREE, g, mats.glass, 'opalCylinder');
    tube.position.set(0, inch(GLASS_Y0), zA);
    body.add(tube);
    const cap = knurledRing(THREE, inch(GLASS_R + 0.09), inch(TOP - GLASS_Y1 + 0.06), mats.polished, 70);
    cap.position.set(0, inch((GLASS_Y1 - 0.06 + TOP) / 2), zA);
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
  id: 'mill-valley-sconces',
  name: 'Hudson Valley Mill Valley opal sconces (pair)',
  order: 34,
  mount: 'wall',
  description: 'Two 4.5" x 12.25" Aged Brass sconces, a 2" opal matte cylinder with knurled brass band and cap on a square backplate, flanking the mirror',
  defaultMountCentreIn: mirrorCentreIn,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const bulbV = (BULB_Y - GLASS_Y0) / SHADE_H;
    const opal = opalMaterials(THREE, (v) => 0.5 + 0.5 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.32 ** 2)), { intensity: 0.95 });
    const mats = {
      glass: opal.glass,
      // HVL Aged Brass: a bright, yellow satin brass in the product photo.
      brass: new THREE.MeshPhysicalMaterial({ color: 0xd4ad62, metalness: 1, roughness: 0.36 }),
      polished: new THREE.MeshPhysicalMaterial({ color: 0xdcb66c, metalness: 1, roughness: 0.25 }),
    };
    const group = wallSconcePair(ctx, opts, {
      name: 'light:mill-valley-sconces',
      bottomToCentreIn: CENTRE,
      makeSconce: () => sconce(THREE, mats, shadows, opts.candela ?? 2.0),
      glows: opal.glows,
      dispose: () => opal.ramp.dispose(),
    }, mirrorCentreIn());
    group.userData.size = { glassDiameter: inch(GLASS_R * 2), shadeHeight: inch(SHADE_H), height: inch(TOP), extension: inch(EXT) };
    return group;
  },
};
