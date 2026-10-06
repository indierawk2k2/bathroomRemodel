// Pair of Mitzi "Paolo" 2-light wall sconces, H634102-AGB (Aged Brass;
// br-d6l), one either side of the mirror.  Product page specs and photo:
// assets/source/lights/paolo-sconce/SOURCES.md.
//
// One sconce (page: 4.25" W x 23.75" H, two opal matte glass shades 3" dia x
// 7.75", 2 x E26 60 W, cUL damp): a full-height brass U-channel ("curved
// metal shade") 4.25" wide behind two opal cylinders, one rising and one
// hanging from a pair of bullet-shaped brass caps that meet at the centre
// (the same up / down layout as the Harlan), on a narrow brass mount.  The
// cylinders are open at their outer ends ("casting light both up and
// down"); the bulbs (T10 5.5" frosted, the type Mitzi sells with it) sit in
// the caps and stop about 3" short of each open end, so from standing eye
// level (60-68", above the lower end and below the upper one at the
// default height) no bulb can be seen.  Bulbs are not modelled: only the
// glowing opal glass and its lit inner face show.
//
// build(ctx, { mountCentreIn (fixture centre AFF, where the caps meet;
//              default the mirror's widest point), hangBottomIn (fixture
//              bottom, legacy), centreXIn = 54, offsetsIn, surfaceOffsetM, shadows })
// Lights: one shadow-casting PointLight per sconce between the caps (it
// stands for both bulbs).  Glass and caps do not cast; the channel and
// mount do, so the wall behind stays dark and is lit above and below the
// fixture.
import { mirrorCentreIn, bulbLight, heightUV, inch, mm } from './common.js';
import { opalMaterials, glassMesh, wallSconcePair } from './sconceA-parts.js';

const H_ALL = 23.75, W = 4.25;
const GLASS_R = 1.5, GLASS_L = 7.75;
const CAP_R = 1.58, CAP_L = 3.9, GAP = 0.2;         // each cap 0.2"-4.1" from the centre
const GLASS_IN = 0.3;                               // glass sleeved into the cap
const MOUNT_W = 1.25, MOUNT_H = 8, MOUNT_D = 1.0;   // narrow mount (photo)
const T = 0.065, CLEAR = 0.3;                       // channel sheet, gap to the caps
const AXIS_Z = MOUNT_D + T + CLEAR + CAP_R;         // ~2.95"; front of glass ~4.5"
const RC = 0.5;                                     // channel's rounded back corners

/** U-channel cross-section (x, -z), extruded over the height, axis y. */
function channelGeometry(THREE) {
  const w = inch(W) / 2, zb = inch(MOUNT_D), zf = inch(AXIS_Z), t = inch(T), r = inch(RC);
  const P = (x, z) => [x, -z];
  const sh = new THREE.Shape();
  sh.moveTo(...P(-w, zf));
  sh.lineTo(...P(-w, zb + r)); sh.quadraticCurveTo(...P(-w, zb), ...P(-w + r, zb));
  sh.lineTo(...P(w - r, zb)); sh.quadraticCurveTo(...P(w, zb), ...P(w, zb + r));
  sh.lineTo(...P(w, zf)); sh.lineTo(...P(w - t, zf));
  sh.lineTo(...P(w - t, zb + r)); sh.quadraticCurveTo(...P(w - t, zb + t), ...P(w - r, zb + t));
  sh.lineTo(...P(-w + r, zb + t)); sh.quadraticCurveTo(...P(-w + t, zb + t), ...P(-w + t, zb + r));
  sh.lineTo(...P(-w + t, zf)); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: inch(H_ALL), bevelEnabled: false, curveSegments: 8 });
  g.rotateX(-Math.PI / 2);          // shape y -> world -(-z) = z; extrusion -> +y
  g.translate(0, -inch(H_ALL) / 2, 0);
  g.computeVertexNormals();
  return g;
}

/** Bullet cap: cylinder from the dome to y = CAP_L + GAP (local, up). */
function capGeometry(THREE) {
  const r = inch(CAP_R), y0 = inch(GAP), y1 = inch(GAP + CAP_L);
  const pts = [];
  for (let i = 0; i <= 12; i++) {            // hemisphere, pole at y0
    const a = (i / 12) * Math.PI / 2;
    pts.push(new THREE.Vector2(r * Math.sin(a), y0 + r - r * Math.cos(a)));
  }
  pts.push(new THREE.Vector2(r, y1), new THREE.Vector2(0, y1));
  return new THREE.LatheGeometry(pts, 48);
}

function sconce(THREE, mats, geos, shadows, candela) {
  const s = new THREE.Group();
  const zA = inch(AXIS_Z);
  {
    const m = new THREE.Mesh(new THREE.BoxGeometry(inch(MOUNT_W), inch(MOUNT_H), inch(MOUNT_D)), mats.brass);
    m.position.z = inch(MOUNT_D) / 2;
    m.castShadow = m.receiveShadow = true;
    m.name = 'mount';
    s.add(m);
    const c = new THREE.Mesh(geos.channel, mats.brass);
    c.castShadow = c.receiveShadow = true;
    c.name = 'channel';
    s.add(c);
  }
  for (const dir of [1, -1]) {           // +1: upper cylinder, -1: lower
    const half = new THREE.Group();
    if (dir < 0) half.rotation.z = Math.PI;   // turn about the axis out of the wall (x-symmetric parts)
    s.add(half);
    const cap = new THREE.Mesh(geos.cap, mats.brass);
    cap.castShadow = false; cap.receiveShadow = true;
    cap.name = 'cap';
    const holder = new THREE.Group();
    holder.position.z = zA;
    half.add(holder);
    holder.add(cap);
    // Short brass tab from the channel back to the cap.
    const tab = new THREE.Mesh(new THREE.BoxGeometry(inch(0.6), inch(1.4), inch(CLEAR + 0.2)), mats.brass);
    tab.position.set(0, inch(GAP + CAP_L - 1.2), -(inch(CAP_R) + inch(CLEAR) / 2));
    tab.castShadow = true;
    holder.add(tab);
    const g0 = GAP + CAP_L - GLASS_IN;
    const outer = glassMesh(THREE, geos.glass, mats.glass, 'opalCylinder');
    outer.position.y = inch(g0);
    holder.add(outer);
    const inner = glassMesh(THREE, geos.glassIn, mats.glassIn, 'opalInner');
    inner.position.y = inch(g0);
    holder.add(inner);
    const rim = new THREE.Mesh(geos.rim, mats.rim);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = inch(g0 + GLASS_L);
    rim.castShadow = false;
    holder.add(rim);
  }
  const l = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512 });
  l.position.set(0, 0, zA + mm(2));
  s.add(l);
  s.userData.lights = [l];
  return s;
}

export default {
  id: 'paolo-sconces',
  name: 'Mitzi Paolo up / down opal sconces (pair)',
  order: 32,
  mount: 'wall',
  description: 'Two 4.25" x 23.75" Aged Brass 2-light sconces, opal cylinders up and down inside a brass channel, flanking the mirror',
  // Fixture centre (where the caps meet) on the mirror's widest point.
  defaultMountCentreIn: mirrorCentreIn,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    // v = 0 at the cap end, 1 at the open end; the bulb glows ~1-5" in.
    const opal = opalMaterials(THREE, (v) => 0.45 + 0.55 * Math.exp(-((v - 0.3) ** 2) / (2 * 0.33 ** 2)),
      { intensity: 0.95, inner: true });
    const mats = {
      glass: opal.glass, glassIn: opal.glassIn,
      rim: new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.4, emissive: opal.glass.emissive, emissiveIntensity: 0.7 }),
      // Mitzi Aged Brass: a warm satin brass in the product photo.
      brass: new THREE.MeshPhysicalMaterial({ color: 0xcfa45c, metalness: 1, roughness: 0.36, side: THREE.DoubleSide }),
    };
    mats.rim.userData.onIntensity = mats.rim.emissiveIntensity;
    const L = inch(GLASS_L);
    const geos = {
      channel: channelGeometry(THREE),
      cap: capGeometry(THREE),
      glass: heightUV(new THREE.CylinderGeometry(inch(GLASS_R), inch(GLASS_R), L, 64, 6, true).translate(0, L / 2, 0), 0, L),
      glassIn: heightUV(new THREE.CylinderGeometry(inch(GLASS_R) - mm(2.5), inch(GLASS_R) - mm(2.5), L - mm(1), 64, 6, true).translate(0, L / 2, 0), 0, L),
      rim: new THREE.RingGeometry(inch(GLASS_R) - mm(2.5), inch(GLASS_R), 64),
    };
    const group = wallSconcePair(ctx, opts, {
      name: 'light:paolo-sconces',
      bottomToCentreIn: H_ALL / 2,
      makeSconce: () => sconce(THREE, mats, geos, shadows, opts.candela ?? 3.0),
      glows: [...opal.glows, mats.rim],
      dispose: () => opal.ramp.dispose(),
    }, mirrorCentreIn());
    group.userData.size = { glassDiameter: inch(GLASS_R * 2), glassLength: L, height: inch(H_ALL), width: inch(W) };
    return group;
  },
};
