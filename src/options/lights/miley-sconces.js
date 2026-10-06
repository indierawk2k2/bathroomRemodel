// Pair of Mitzi "Miley" wall sconces, H373101-AGB (Aged Brass), br-20r.
// Product page, photo and specs: assets/source/lights/miley-sconces/SOURCES.md.
//
// One sconce: a fully enclosed glossy opal-glass capsule (4" diam. x
// 15.75") threaded on a slender vertical brass rod ("cattail") that runs on
// above the glass to a rounded finial beside the top of an oval 4.75" x
// 7.5" backplate, and below it to a short finial.  A short horizontal arm
// from the backplate holds the rod through a collar.  Overall 4.75" W x
// 29.5" H x 5.75" extension; 1 x E26; cUL damp.
//
// Placement (the Harlan rule, sconceB-common.js): x = 36.25" / 70.75",
// glass centre on the mirror's widest point (70" at the default mirror:
// glass 62.1-77.9", whole fixture 57.3-86.8").  The 4" glass is 4.25" /
// 3.25" clear of the frame and of the accent edges; the 4.75" backplate
// sits wholly above the glass, beside the top of the mirror (~78-86").
//
// Lights: one shadow-casting PointLight per sconce at the middle of the
// glass (the opal glass does not cast; the rod above and below, collar,
// arm and plate do).
import { bulbLight, heightUV, inch } from './common.js';
import { wallSconcePair, glassAtMirrorCentre, glowGlass, agedBrass, put } from './sconceB-common.js';

const GLASS_D_IN = 4, GLASS_H_IN = 15.75;
const EXT_IN = 5.75;                      // wall -> glass front (spec)
const ROD_ABOVE_IN = 8.9, ROD_BELOW_IN = 4.85;   // from the photo; 8.9 + 15.75 + 4.85 = 29.5
const PLATE_W_IN = 4.75, PLATE_H_IN = 7.5, PLATE_D_IN = 0.6;

function stadiumShape(THREE, w, h) {
  const r = w / 2, s = new THREE.Shape();
  s.moveTo(-r, -h / 2 + r);
  s.lineTo(-r, h / 2 - r);
  s.absarc(0, h / 2 - r, r, Math.PI, 0, true);
  s.lineTo(r, -h / 2 + r);
  s.absarc(0, -h / 2 + r, r, 0, Math.PI, true);
  return s;
}

function sconce(THREE, mats, shadows, candela) {
  const s = new THREE.Group();
  const GR = inch(GLASS_D_IN / 2), GH = inch(GLASS_H_IN);
  const gz = inch(EXT_IN) - GR;           // glass / rod axis off the wall (3.75")
  const rodR = inch(0.28);
  const top = GH / 2 + inch(ROD_ABOVE_IN), bot = -GH / 2 - inch(ROD_BELOW_IN);

  // Opal capsule: outer glossy face + inner face; heightUV drives the ramp.
  {
    const og = heightUV(new THREE.CapsuleGeometry(GR, GH - 2 * GR, 16, 48), -GH / 2, GH);
    const outer = put(THREE, s, og, mats.glass.outer, 0, 0, gz, { cast: false, name: 'opalGlass' });
    outer.renderOrder = 1;
    const ig = heightUV(new THREE.CapsuleGeometry(GR - inch(0.1), GH - 2 * GR, 16, 48), -GH / 2, GH);
    put(THREE, s, ig, mats.glass.inner, 0, 0, gz, { cast: false });
  }
  // Brass cups where the rod enters the glass, top and bottom.
  for (const sy of [-1, 1]) {
    const cup = put(THREE, s, new THREE.SphereGeometry(inch(0.75), 32, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), mats.brass,
      0, sy * (GH / 2 - inch(0.12)), gz, { cast: false });
    if (sy < 0) cup.rotation.x = Math.PI;
    put(THREE, s, new THREE.CylinderGeometry(inch(0.38), inch(0.38), inch(0.5), 20), mats.brass,
      0, sy * (GH / 2 + inch(0.45)), gz);
  }
  // Rod above and below the glass (none drawn inside: the opal hides it and
  // it would shadow the bulb), with rounded finials.
  {
    const upper = top - GH / 2;
    put(THREE, s, new THREE.CylinderGeometry(rodR, rodR, upper - inch(0.3), 20), mats.brass, 0, GH / 2 + (upper - inch(0.3)) / 2, gz, { name: 'rod' });
    const lower = -GH / 2 - bot;
    put(THREE, s, new THREE.CylinderGeometry(rodR, rodR, lower - inch(0.3), 20), mats.brass, 0, -GH / 2 - (lower - inch(0.3)) / 2, gz, { name: 'rod' });
    for (const [y, sy] of [[top - inch(0.3), 1], [bot + inch(0.3), -1]]) {
      put(THREE, s, new THREE.CylinderGeometry(inch(0.34), inch(0.34), inch(0.25), 20), mats.brass, 0, y - sy * inch(0.12), gz);
      const tip = put(THREE, s, new THREE.SphereGeometry(inch(0.34), 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mats.brass, 0, y, gz);
      if (sy < 0) tip.rotation.x = Math.PI;
    }
  }
  // Oval backplate: top 0.8" below the finial (photo), wholly above the glass.
  const plateTop = top - inch(0.8), plateCy = plateTop - inch(PLATE_H_IN / 2);
  {
    const g = new THREE.ExtrudeGeometry(stadiumShape(THREE, inch(PLATE_W_IN), inch(PLATE_H_IN)),
      { depth: inch(PLATE_D_IN) - inch(0.08), bevelEnabled: true, bevelThickness: inch(0.04), bevelSize: inch(0.04), bevelSegments: 2, curveSegments: 24 });
    put(THREE, s, g, mats.brass, 0, plateCy, inch(0.04), { name: 'backplate' });
  }
  // Arm from the plate to a collar on the rod, ~4.4" below the top (photo).
  {
    const armY = top - inch(4.4);
    const len = gz - inch(PLATE_D_IN);
    const arm = put(THREE, s, new THREE.CylinderGeometry(inch(0.22), inch(0.22), len, 16), mats.brass, 0, armY, inch(PLATE_D_IN) + len / 2);
    arm.rotation.x = Math.PI / 2;
    const base = put(THREE, s, new THREE.CylinderGeometry(inch(0.42), inch(0.48), inch(0.3), 20), mats.brass, 0, armY, inch(PLATE_D_IN) + inch(0.15));
    base.rotation.x = Math.PI / 2;
    put(THREE, s, new THREE.CylinderGeometry(inch(0.45), inch(0.45), inch(1.5), 24), mats.brass, 0, armY + inch(0.55), gz, { name: 'collar' });
  }
  const l = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512, near: 0.02 });
  l.position.set(0, 0, gz);
  s.add(l);
  s.userData.lights = [l];
  s.userData.glowMaterials = [mats.glass.outer, mats.glass.inner];
  return s;
}

export default {
  id: 'miley-sconces',
  name: 'Mitzi Miley sconces, opal capsule, aged brass (pair)',
  order: 44,
  mount: 'wall',
  description: 'Two Mitzi Miley sconces (H373101-AGB): 4" x 15.75" glossy opal-glass capsules on a slim aged-brass rod, ' +
    'oval 4.75" x 7.5" backplate, 29.5" tall overall, 5.75" extension; fully enclosed (no bulb visible), cUL damp. ' +
    'Glass centre on the mirror\'s widest point, one each side of the mirror.',
  defaultMountCentreIn: glassAtMirrorCentre,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const H = GLASS_H_IN;
    const glass = glowGlass(THREE, {
      // Glossy opal: an even glow, slightly brighter at the middle (bulb).
      rampF: (v) => 0.55 + 0.45 * Math.exp(-((v - 0.5) ** 2) / (2 * 0.22 ** 2)),
      color: 0xf6f5f0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04,
      outerIntensity: 0.95, innerIntensity: 1.3,
    });
    const mats = { glass, brass: agedBrass(THREE) };
    const group = wallSconcePair(ctx, opts, {
      name: 'light:miley-sconces',
      glassHeightIn: H,
      makeSconce: () => sconce(THREE, mats, shadows, opts.candela ?? 2.3),
    });
    group.userData.size = { glassDiameter: inch(GLASS_D_IN), glassHeight: inch(H), overallHeight: inch(29.5) };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); glass.dispose(); };
    return group;
  },
};
