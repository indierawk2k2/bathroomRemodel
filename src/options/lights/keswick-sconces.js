// Pair of Hudson Valley "Keswick" bath sconces, 1971-AGB (Aged Brass,
// glossy opal glass), br-20r.  Product pages, photos and specs:
// assets/source/lights/keswick-sconces/SOURCES.md.
//
// One sconce: a rectangular 4.75" x 6" x 0.75" backplate with two round
// bosses, a gooseneck tube arm rising from the upper boss and arcing
// forward over the shade, a cast swivel knob with a decorative thumb knob,
// a ringed socket holder with a knurled fitter, and a glossy opal bell
// (2" fitter opening, 5" bottom, 5" tall) open at the bottom.  Overall 5" W
// x 11" H x 8.75" extension, top to plate centre 5.25"; 1 x A19 E26,
// dimmable, cUL damp.  The maker allows shade up or down: modelled shade
// DOWN, with the bulb recessed in the bell (bulb glass ends 2.1" above
// the rim), so from standing eye level (60-68") the rim hides it.  A short
// A19 / A15 LED keeps it that way in the real fixture (see SOURCES.md).
//
// Placement (the Harlan rule, sconceB-common.js): x = 36.25" / 70.75",
// shade centre on the mirror's widest point (70" at the default mirror:
// bell 67.5-72.5", plate 70.25-76.25", top 78.5").
//
// Lights: one shadow-casting PointLight per sconce at the bulb (the opal
// bell does not cast, so the light pools through the open bottom and the
// bell glows; the socket, arm and plate do cast) and a weak unshadowed
// fill there for the glow off the bell.
import { warmWhite } from '../../remodel/cfg.js';
import { bulbLight, heightUV, inch } from './common.js';
import { wallSconcePair, glassAtMirrorCentre, glowGlass, agedBrass, put } from './sconceB-common.js';

const SHADE_H_IN = 5, SHADE_BOT_D_IN = 5, EXT_IN = 8.75, H_IN = 11, TOP_TO_PLATE_IN = 5.25;
const PLATE_W_IN = 4.75, PLATE_H_IN = 6, PLATE_D_IN = 0.75;
// Bulb glass bottom above the bell rim (recessed: hidden from eye level).
const BULB_RECESS_IN = 2.1;

// Bell profile (r, y) in inches, y = 0 at mid-height, bottom -> top (so
// LatheGeometry's normals face out).  Studio photo: shoulder ~3.4" wide,
// near-straight walls, a flare to the 5" rolled rim.
const BELL = [
  [2.42, -2.5], [2.5, -2.42], [2.46, -2.2], [2.2, -1.85], [1.95, -1.45], [1.82, -0.9],
  [1.76, 0.2], [1.74, 1.4], [1.72, 2.05], [1.6, 2.38], [1.3, 2.5], [1.0, 2.5],
];

function sconce(THREE, mats, shadows, candela) {
  const s = new THREE.Group();
  const H = inch(SHADE_H_IN);
  const gz = inch(EXT_IN - SHADE_BOT_D_IN / 2);       // shade axis 6.25" off the wall
  const top = H / 2 + inch(H_IN - SHADE_H_IN);         // 8.5" above the shade centre
  const plateY = top - inch(TOP_TO_PLATE_IN);          // 3.25"

  // Opal bell: outer glossy face + inner face.
  {
    const pts = BELL.map(([r, y]) => new THREE.Vector2(inch(r), inch(y)));
    const og = heightUV(new THREE.LatheGeometry(pts, 64), -H / 2, H);
    const outer = put(THREE, s, og, mats.glass.outer, 0, 0, gz, { cast: false, name: 'opalBell' });
    outer.renderOrder = 1;
    const ip = BELL.map(([r, y]) => new THREE.Vector2(inch(Math.max(0.9, r - 0.1)), inch(Math.min(2.45, y + 0.02))));
    const ig = heightUV(new THREE.LatheGeometry(ip, 64), -H / 2, H);
    put(THREE, s, ig, mats.glass.inner, 0, 0, gz, { cast: false });
  }
  // Rectangular backplate with two round bosses.
  {
    const g = new THREE.BoxGeometry(inch(PLATE_W_IN), inch(PLATE_H_IN), inch(PLATE_D_IN) - inch(0.15));
    put(THREE, s, g, mats.plate, 0, plateY, (inch(PLATE_D_IN) - inch(0.15)) / 2, { name: 'backplate' });
    const lip = put(THREE, s, new THREE.BoxGeometry(inch(PLATE_W_IN - 0.3), inch(PLATE_H_IN - 0.3), inch(0.15)), mats.plate, 0, plateY, inch(PLATE_D_IN) - inch(0.075));
    lip.name = 'backplateStep';
    for (const dy of [0, -1.9]) {
      const b = put(THREE, s, new THREE.CylinderGeometry(inch(0.62), inch(0.7), inch(0.35), 32), mats.brass, 0, plateY + inch(dy), inch(PLATE_D_IN) + inch(0.17));
      b.rotation.x = Math.PI / 2;
      const k = put(THREE, s, new THREE.SphereGeometry(inch(0.36), 20, 12), mats.brass, 0, plateY + inch(dy), inch(PLATE_D_IN) + inch(0.38));
      k.scale.z = 0.7;
    }
  }
  // Gooseneck: out of the upper boss, up, over in a half circle, down to
  // the swivel knob above the socket.
  const armR = inch(0.2);
  const z0 = inch(PLATE_D_IN) + inch(0.6);
  const knobY = H / 2 + inch(2.75);
  {
    const R = (gz - z0) / 2, yc = top - armR - R;
    const pts = [new THREE.Vector3(0, plateY, inch(PLATE_D_IN)), new THREE.Vector3(0, plateY, z0 - inch(0.3)),
      new THREE.Vector3(0, plateY + inch(0.3), z0)];
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI - (i / 20) * Math.PI;       // back -> over -> front
      pts.push(new THREE.Vector3(0, yc + Math.sin(a) * R, z0 + R + Math.cos(a) * R));
    }
    pts.push(new THREE.Vector3(0, knobY + inch(0.3), gz));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    put(THREE, s, new THREE.TubeGeometry(curve, 80, armR, 12, false), mats.brass, 0, 0, 0, { name: 'gooseneck' });
  }
  // Swivel knob + decorative thumb knob, neck, ringed socket holder, fitter.
  put(THREE, s, new THREE.SphereGeometry(inch(0.42), 24, 16), mats.brass, 0, knobY, gz, { name: 'swivel' });
  {
    const st = put(THREE, s, new THREE.CylinderGeometry(inch(0.1), inch(0.1), inch(0.5), 10), mats.brass, inch(0.6), knobY, gz);
    st.rotation.z = Math.PI / 2;
    const tk = put(THREE, s, new THREE.CylinderGeometry(inch(0.38), inch(0.38), inch(0.16), 24), mats.brass, inch(0.9), knobY, gz);
    tk.rotation.z = Math.PI / 2;
  }
  put(THREE, s, new THREE.CylinderGeometry(inch(0.22), inch(0.36), inch(0.55), 20), mats.brass, 0, knobY - inch(0.6), gz);
  {
    const cupTop = knobY - inch(0.85), cupBot = H / 2 + inch(0.15);
    // Profile (r, dy) in inches above the cup bottom: rings, then the
    // taper up to the neck under the swivel knob (photo).
    const hIn = (cupTop - cupBot) / inch(1);
    const prof = [[0.3, 0], [0.95, 0], [0.95, 0.35], [0.82, 0.45], [0.82, 0.9], [0.95, 1.0], [0.95, 1.25],
      [0.78, 1.35], [0.62, hIn], [0.2, hIn]];
    const v = prof.map(([r, dy]) => new THREE.Vector2(inch(r), cupBot + inch(dy)));
    put(THREE, s, new THREE.LatheGeometry(v, 40), mats.brass, 0, 0, gz, { name: 'socketHolder' });
    // Knurled fitter ring gripping the bell's neck.
    const fit = put(THREE, s, new THREE.CylinderGeometry(inch(1.12), inch(1.12), inch(0.28), 48), mats.knurl, 0, H / 2 + inch(0.08), gz);
    fit.name = 'fitter';
  }
  // Recessed bulb (frosted A-shape) and socket neck inside the bell.
  {
    put(THREE, s, new THREE.CylinderGeometry(inch(0.55), inch(0.55), inch(0.8), 20), mats.socket, 0, H / 2 - inch(0.4), gz, { cast: false });
    const bulbBot = -H / 2 + inch(BULB_RECESS_IN);
    const b = put(THREE, s, new THREE.SphereGeometry(inch(1.05), 24, 16), mats.bulb, 0, bulbBot + inch(1.05 * 1.25), gz, { cast: false, name: 'bulb' });
    b.scale.y = 1.25;
  }
  const l = bulbLight(THREE, { candela: candela * 0.7, shadow: shadows, mapSize: 512, near: 0.02 });
  l.position.set(0, -H / 2 + inch(BULB_RECESS_IN + 1.2), gz);
  // Weak unshadowed fill for the light the lit opal bell sends upward and
  // sideways, so the socket's shadow on the wall above stays soft.
  const fill = bulbLight(THREE, { candela: candela * 0.45, shadow: false });
  fill.position.copy(l.position);
  s.add(l, fill);
  s.userData.lights = [l, fill];
  s.userData.glowMaterials = [mats.glass.outer, mats.glass.inner, mats.bulb];
  return s;
}

export default {
  id: 'keswick-sconces',
  name: 'Hudson Valley Keswick sconces, opal bell, aged brass (pair)',
  order: 46,
  mount: 'wall',
  description: 'Two Hudson Valley Keswick bath sconces (1971-AGB): glossy opal bell shades (5" x 5") hung shade-down from an ' +
    'aged-brass gooseneck on a 4.75" x 6" plate; 5" W x 11" H x 8.75" extension, A19 E26, dimmable, damp rated. ' +
    'The bulb sits recessed in the bell, so it is hidden from standing eye level. Shade centre on the mirror\'s widest point.',
  defaultMountCentreIn: glassAtMirrorCentre,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const glass = glowGlass(THREE, {
      // Brightest around the bulb, a lighter band at the flared rim.
      rampF: (v) => 0.45 + 0.4 * Math.exp(-((v - 0.62) ** 2) / (2 * 0.22 ** 2)) + 0.25 * Math.exp(-((v - 0.06) ** 2) / (2 * 0.06 ** 2)),
      color: 0xf7f5ef, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03, outerIntensity: 0.8, innerIntensity: 1.4,
    });
    const mats = {
      glass,
      brass: agedBrass(THREE, { color: 0xb8925a, roughness: 0.36 }),
      // The plate faces the bulb from 5" away: satin, or it blooms white.
      plate: agedBrass(THREE, { color: 0xb08a54, roughness: 0.6, anisotropy: 0 }),
      knurl: agedBrass(THREE, { color: 0xa98550, roughness: 0.55 }),
      socket: new THREE.MeshStandardMaterial({ color: 0x8a7a60, roughness: 0.7, metalness: 0.4 }),
      bulb: new THREE.MeshStandardMaterial({ color: 0xfff4e2, roughness: 0.5, emissive: warmWhite(THREE), emissiveIntensity: 3 }),
    };
    mats.bulb.userData.onIntensity = mats.bulb.emissiveIntensity;
    const group = wallSconcePair(ctx, opts, {
      name: 'light:keswick-sconces',
      glassHeightIn: SHADE_H_IN,
      makeSconce: () => sconce(THREE, mats, shadows, opts.candela ?? 2.4),
    });
    group.userData.size = { shadeDiameter: inch(SHADE_BOT_D_IN), shadeHeight: inch(SHADE_H_IN), bulbRecessIn: BULB_RECESS_IN };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); glass.dispose(); };
    return group;
  },
};
