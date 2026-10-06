// Pair of Hudson Valley "Laval" 1-light wall sconces, 8424-AGB (Aged
// Brass), br-20r.  Product pages, photos and specs:
// assets/source/lights/laval-sconces/SOURCES.md.
//
// One sconce: a long flat aged-brass bar standing on a round 4.75" two-step
// backplate, running from 13.5" below the plate centre up past it and
// curving forward at the top into a hook that holds a 4.5" "Nuage" globe
// (clear glass etched inside to a speckled opal) hanging just in front of
// the bar.  Overall 4.75" W x 23.75" H x 6" extension, top to plate centre
// 10.25"; 1 x G9; CETL damp.  The globe is enclosed (socket at its top), so
// no bulb shows.
//
// Placement (the Harlan rule, sconceB-common.js): x = 36.25" / 70.75",
// globe centre on the mirror's widest point (70" at the default mirror:
// globe 67.75-72.25", plate centre 63.65", bar 50.2-73.9").
//
// Lights, per sconce at the globe centre: a shadow-casting PointLight (the
// etched glass does not cast; the bar, hook and plate do) and a weaker
// unshadowed one for the glow off the globe, which keeps the hook's shadow
// on the wall soft.
import { bulbLight, heightUV, inch } from './common.js';
import { wallSconcePair, glassAtMirrorCentre, glowGlass, agedBrass, put } from './sconceB-common.js';

const GLOBE_D_IN = 4.5, EXT_IN = 6, H_IN = 23.75, TOP_TO_PLATE_IN = 10.25, PLATE_D_IN = 4.75;
// From the studio photo (45 px/in): globe centre 3.9" below the top.
const GLOBE_BELOW_TOP_IN = 3.9;
const BAR_W_IN = 0.5, BAR_T_IN = 0.22;

/** Speckled "Nuage" etch: soft blotches over a height ramp (canvas texture). */
function nuageTexture(THREE) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  for (let y = 0; y < 128; y++) {
    const v = 1 - y / 127;              // 0 bottom -> 1 top
    const L = Math.round(255 * (0.62 + 0.38 * Math.exp(-((v - 0.55) ** 2) / (2 * 0.28 ** 2))));
    g.fillStyle = `rgb(${L},${L},${L})`; g.fillRect(0, y, 256, 1);
  }
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 420; i++) {        // cracked-ice speckle: darker flecks
    const x = rnd() * 256, y = rnd() * 128, r = 1 + rnd() * 4;
    g.fillStyle = `rgba(150,150,150,${0.18 + rnd() * 0.22})`;
    g.beginPath(); g.ellipse(x, y, r * (1 + rnd()), r, rnd() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** A flat bar along a polyline of [y, z] points (x = 0), as short boxes. */
function flatBar(THREE, parent, pts, mat) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [y0, z0] = pts[i], [y1, z1] = pts[i + 1];
    const len = Math.hypot(y1 - y0, z1 - z0);
    const m = put(THREE, parent, new THREE.BoxGeometry(BAR_W_IN * inch(1), len + inch(0.02), BAR_T_IN * inch(1)), mat,
      0, (y0 + y1) / 2, (z0 + z1) / 2);
    m.rotation.x = Math.atan2(z1 - z0, y1 - y0);   // tilt from +y towards +z
    m.name = 'bar';
  }
}

function sconce(THREE, mats, shadows, candela) {
  const s = new THREE.Group();
  const GR = inch(GLOBE_D_IN / 2);
  const gz = inch(EXT_IN) - GR;                       // 3.75" off the wall
  const top = inch(GLOBE_BELOW_TOP_IN);               // above the globe centre
  const plateY = top - inch(TOP_TO_PLATE_IN);         // -6.35"
  const barBot = top - inch(H_IN);                    // -19.85"
  const plateD = inch(0.55);
  const barZ = plateD + inch(0.3) + inch(BAR_T_IN / 2);

  // Round two-step backplate.
  {
    const back = put(THREE, s, new THREE.CylinderGeometry(inch(PLATE_D_IN / 2), inch(PLATE_D_IN / 2), inch(0.25), 48), mats.brass, 0, plateY, inch(0.125));
    back.rotation.x = Math.PI / 2;
    const front = put(THREE, s, new THREE.CylinderGeometry(inch(PLATE_D_IN / 2 - 0.3), inch(PLATE_D_IN / 2 - 0.25), plateD - inch(0.25), 48), mats.brass,
      0, plateY, inch(0.25) + (plateD - inch(0.25)) / 2, { name: 'backplate' });
    front.rotation.x = Math.PI / 2;
    // Square clip holding the bar to the plate.
    put(THREE, s, new THREE.BoxGeometry(inch(0.8), inch(0.7), inch(0.55)), mats.brass, 0, plateY, plateD + inch(0.27));
  }
  // Bar: straight from the bottom up behind the globe, then a quarter-ish
  // curve forward over the globe to the hook tip (photo).
  {
    const pts = [[barBot, barZ], [inch(0.6), barZ]];
    const r = gz + inch(0.5) - barZ;                   // curve radius
    const yc = inch(0.6);
    for (let i = 1; i <= 14; i++) {
      const a = (i / 14) * (Math.PI / 2) * 0.95;
      pts.push([yc + Math.sin(a) * (top - yc), barZ + (1 - Math.cos(a)) * r]);
    }
    flatBar(THREE, s, pts, mats.bar);
  }
  // Socket cap at the globe's top, hanging from the hook.
  put(THREE, s, new THREE.CylinderGeometry(inch(0.55), inch(0.65), inch(0.5), 24), mats.brass, 0, GR + inch(0.12), gz);
  put(THREE, s, new THREE.CylinderGeometry(inch(0.18), inch(0.18), top - GR - inch(0.3), 12), mats.brass,
    0, GR + inch(0.3) + (top - GR - inch(0.3)) / 2 - inch(0.15), gz);
  // Etched globe: outer face + inner face (lit directly).
  {
    const og = heightUV(new THREE.SphereGeometry(GR, 48, 32), -GR, 2 * GR);
    const outer = put(THREE, s, og, mats.globe, 0, 0, gz, { cast: false, name: 'nuageGlobe' });
    outer.renderOrder = 1;
    const ig = heightUV(new THREE.SphereGeometry(GR - inch(0.08), 40, 24), -GR, 2 * GR);
    put(THREE, s, ig, mats.globeIn, 0, 0, gz, { cast: false });
  }
  // The lit globe is a broad source, so the hook's shadow on the wall above
  // is soft: a shadowed part plus an unshadowed part for the glow off the glass.
  const l = bulbLight(THREE, { candela: candela * 0.6, shadow: shadows, mapSize: 512, near: 0.02 });
  l.position.set(0, inch(0.3), gz);
  const fill = bulbLight(THREE, { candela: candela * 0.5, shadow: false });
  fill.position.copy(l.position);
  s.add(l, fill);
  s.userData.lights = [l, fill];
  s.userData.glowMaterials = [mats.globe, mats.globeIn];
  return s;
}

export default {
  id: 'laval-sconces',
  name: 'Hudson Valley Laval sconces, etched globe, aged brass (pair)',
  order: 36,
  mount: 'wall',
  description: 'Two Hudson Valley Laval sconces (8424-AGB): a 4.5" "Nuage" globe (clear glass etched inside to a speckled opal) ' +
    'hung from the curved top of a long flat aged-brass bar on a 4.75" round plate; 4.75" W x 23.75" H x 6" extension, ' +
    'G9, damp rated; enclosed, so no bulb shows. Globe centre on the mirror\'s widest point.',
  defaultMountCentreIn: glassAtMirrorCentre,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const tex = nuageTexture(THREE);
    const base = glowGlass(THREE, { color: 0xf3f2ee, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, outerIntensity: 0.85, innerIntensity: 1.2 });
    base.dispose();                          // replaced by the speckle texture
    base.outer.emissiveMap = tex; base.outer.map = tex;
    base.inner.emissiveMap = tex;
    // The bar's flat face sits ~2.5" from the bulb: an anisotropic (brushed)
    // highlight stretches along it into a white line, so it is satin, isotropic.
    const mats = { globe: base.outer, globeIn: base.inner, brass: agedBrass(THREE), bar: agedBrass(THREE, { roughness: 0.62, color: 0xb8945c, anisotropy: 0 }) };
    const group = wallSconcePair(ctx, opts, {
      name: 'light:laval-sconces',
      glassHeightIn: GLOBE_D_IN,
      makeSconce: () => sconce(THREE, mats, shadows, opts.candela ?? 2.0),
    });
    group.userData.size = { globeDiameter: inch(GLOBE_D_IN), overallHeight: inch(H_IN) };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); tex.dispose(); };
    return group;
  },
};
