// Pair of Claxy "Modern Brass 2-Light Cylinder Sconce" (set of 2,
// DZ-B3200BU-J-M-2), br-20r.  Product page, dimension drawing and photos:
// assets/source/lights/claxy-cylinder-sconces/SOURCES.md.
//
// One sconce: a round brushed-brass backplate (4.7" diam., ~0.85" deep,
// two side set screws) carrying an acid-washed frosted-glass tube 3.1" in
// diameter whose two open ends are cut at an angle: 15.4" long on the room
// side, 12" against the wall (drawing), 4.1" extension.  Two E26 sockets
// inside, one shining up and one down (up/down light); dimmable; ETL, DRY
// locations only per Claxy (no damp rating).
//
// The frosted glass is modelled as translucent glowing glass (like
// claxy-rod-pendants.js): the bulbs never show through it, and the angled
// ends open towards the wall, so from in front at standing eye level the
// lower lip of the glass hides the inside.
//
// Placement (the Harlan rule, sconceB-common.js): x = 36.25" / 70.75",
// tube centre on the mirror's widest point (70" at the default mirror:
// glass 62.3-77.7" on the room side).
//
// Lights per sconce: one shadow-casting PointLight at the upper bulb and
// one unshadowed at the lower bulb (the glass does not cast).
import { warmWhite } from '../../remodel/cfg.js';
import { bulbLight, heightUV, inch } from './common.js';
import { wallSconcePair, glassAtMirrorCentre, glowGlass, put } from './sconceB-common.js';

const TUBE_D_IN = 3.1, FRONT_H_IN = 15.4, BACK_H_IN = 12, EXT_IN = 4.1;
const PLATE_D_IN = 4.7, PLATE_DEPTH_IN = 0.85;
const BULB_Y_IN = 3.7;                  // bulbs above / below the centre (lit photos)

/** Open tube with both ends cut on a slant: each end is a plane from the
 *  back (wall side, half-length backH/2) to the front (frontH/2). */
function slantTube(THREE, R, frontH, backH, radial = 72) {
  const g = new THREE.CylinderGeometry(R, R, frontH, radial, 1, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i), y = p.getY(i);
    const t = (z + R) / (2 * R);         // 0 at the wall side, 1 at the room side
    const half = backH / 2 + t * (frontH - backH) / 2;
    p.setY(i, Math.sign(y) * half);
  }
  g.computeVertexNormals();
  return g;
}

function sconce(THREE, mats, shadows, candela) {
  const s = new THREE.Group();
  const R = inch(TUBE_D_IN / 2), FH = inch(FRONT_H_IN), BH = inch(BACK_H_IN);
  const gz = inch(EXT_IN) - R;           // tube axis 2.55" off the wall

  // Frosted tube: outer + inner face.
  {
    const og = heightUV(slantTube(THREE, R, FH, BH), -FH / 2, FH);
    const outer = put(THREE, s, og, mats.glass.outer, 0, 0, gz, { cast: false, name: 'frostedTube' });
    outer.renderOrder = 1;
    const ig = heightUV(slantTube(THREE, R - inch(0.1), FH - inch(0.04), BH - inch(0.04)), -FH / 2, FH);
    put(THREE, s, ig, mats.glass.inner, 0, 0, gz, { cast: false });
  }
  // Round backplate (drum) with two set screws on its sides.
  {
    const d = put(THREE, s, new THREE.CylinderGeometry(inch(PLATE_D_IN / 2), inch(PLATE_D_IN / 2), inch(PLATE_DEPTH_IN), 64), mats.brass,
      0, 0, inch(PLATE_DEPTH_IN / 2), { name: 'backplate' });
    d.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) {
      const sc = put(THREE, s, new THREE.CylinderGeometry(inch(0.12), inch(0.12), inch(0.08), 12), mats.brass,
        sx * inch(PLATE_D_IN / 2 + 0.03), 0, inch(PLATE_DEPTH_IN / 2));
      sc.rotation.z = Math.PI / 2;
    }
  }
  // Holder inside the glass: a short stem from the plate and a vertical
  // twin socket body (up and down sockets), with frosted bulbs.
  {
    const stem = put(THREE, s, new THREE.CylinderGeometry(inch(0.35), inch(0.35), gz - inch(PLATE_DEPTH_IN), 16), mats.brassIn,
      0, 0, inch(PLATE_DEPTH_IN) + (gz - inch(PLATE_DEPTH_IN)) / 2);
    stem.rotation.x = Math.PI / 2;
    put(THREE, s, new THREE.CylinderGeometry(inch(0.6), inch(0.6), inch(3.4), 20), mats.brassIn, 0, 0, gz, { name: 'sockets' });
    for (const sy of [-1, 1]) {
      const b = put(THREE, s, new THREE.SphereGeometry(inch(0.85), 20, 14), mats.bulb, 0, sy * inch(BULB_Y_IN), gz, { cast: false });
      b.scale.y = 1.35;
    }
  }
  const up = bulbLight(THREE, { candela: candela * 0.55, shadow: shadows, mapSize: 512, near: 0.02 });
  up.position.set(0, inch(BULB_Y_IN), gz);
  const down = bulbLight(THREE, { candela: candela * 0.55, shadow: false });
  down.position.set(0, -inch(BULB_Y_IN), gz);
  s.add(up, down);
  s.userData.lights = [up, down];
  s.userData.glowMaterials = [mats.glass.outer, mats.glass.inner, mats.bulb];
  return s;
}

export default {
  id: 'claxy-cylinder-sconces',
  name: 'Claxy brass 2-light cylinder sconces, frosted glass (pair)',
  order: 47,
  mount: 'wall',
  description: 'Two Claxy brass 2-light cylinder sconces (DZ-B3200BU-J-M-2): acid-washed frosted glass tubes 3.1" in diameter, ' +
    '15.4" long with angled open ends (12" on the wall side), up and down light, on 4.7" round brushed-brass plates; ' +
    '4.1" extension, 2 x E26 each, dimmable. Frosted glass: no bulb visible. Rated for DRY locations only (no damp rating). ' +
    'Tube centre on the mirror\'s widest point.',
  defaultMountCentreIn: glassAtMirrorCentre,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const H = FRONT_H_IN, up = (H / 2 + BULB_Y_IN) / H, dn = (H / 2 - BULB_Y_IN) / H;
    const g = (v, c) => Math.exp(-((v - c) ** 2) / (2 * 0.12 ** 2));
    const glass = glowGlass(THREE, {
      // Two glow spots at the bulbs, a dimmer band between them (photo).
      rampF: (v) => 0.3 + 0.7 * Math.max(g(v, up), g(v, dn)) + 0.1 * g(v, 0.5),
      color: 0xeeece6, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.45, outerIntensity: 0.75, innerIntensity: 1.1,
    });
    const mats = {
      glass,
      // Brushed brass, as the Claxy rod pendants.
      brass: new THREE.MeshPhysicalMaterial({ color: 0xd9b263, metalness: 1, roughness: 0.46, anisotropy: 0.35 }),
      brassIn: new THREE.MeshPhysicalMaterial({ color: 0xa88540, metalness: 1, roughness: 0.75 }),
      bulb: new THREE.MeshStandardMaterial({ color: 0xfff4e2, roughness: 0.5, emissive: warmWhite(THREE), emissiveIntensity: 3 }),
    };
    mats.bulb.userData.onIntensity = mats.bulb.emissiveIntensity;
    const group = wallSconcePair(ctx, opts, {
      name: 'light:claxy-cylinder-sconces',
      glassHeightIn: FRONT_H_IN,
      makeSconce: () => sconce(THREE, mats, shadows, opts.candela ?? 2.8),
    });
    group.userData.size = { tubeDiameter: inch(TUBE_D_IN), tubeLengthFront: inch(FRONT_H_IN), tubeLengthBack: inch(BACK_H_IN) };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); glass.dispose(); };
    return group;
  },
};
