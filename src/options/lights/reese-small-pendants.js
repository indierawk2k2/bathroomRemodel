// Pair of Mitzi by Hudson Valley "Reese" small 1-light pendants, Aged Brass
// (H281701S-AGB, br-kv5), hung on their cloth cords from the ceiling one
// each side of the oval mirror.  Product page and photo:
// assets/source/lights/reese-small-pendant/ (SOURCES.md).
//
// One pendant: a 6.75" glossy opal globe "appearing to drip from a slender
// metal neck" (a flared Aged Brass trumpet), a crisp brass rim round the
// globe's lower edge, and a second, smaller opal shade beneath it that
// closes the bottom, so the bulb is hidden from every side.  Black fabric
// cord (120"), 4.75" x 0.75" round canopy.  Overall 6.75" diam. x 8.25" h;
// hanging height 12"-139" (HVL); E26, one A19 60 W; cUL damp.
//
// build(ctx, { hangBottomIn = inner-shade bottom AFF (clamped to ceiling -
//              12", the shortest real hang), centreXIn = 54, centreZIn
//              (pendant centre, world z), ceilingIn = 120, shadows = true })
// Lights per pendant, both at the bulb: a shadow-casting PointLight (the
// opal does not cast; the brass neck, rim and cord do) and a weaker
// unshadowed one for the glow off the lit glass.
import { remodelDims } from '../../remodel/cfg.js';
import { flankingPendantPair, hangAtMirrorCentre, offsetsClearOfMirror } from './common.js';
import { latheIn, arcIn, mitziMaterials, cordAndCanopy, mitziLights, inch } from './pendB-parts.js';

const GLOBE_D_IN = 6.75, OVERALL_H_IN = 8.25;
// Profile (inches up from the inner shade's bottom), fitted to the studio
// photo's proportions within HVL's 6.75" x 8.25":
const INNER_R_IN = 2.65, RIM_Y_IN = 1.0, RIM_R_IN = 3.1;   // inner shade 1" proud of the rim
const GLOBE_R_IN = GLOBE_D_IN / 2;
const GLOBE_CY_IN = RIM_Y_IN + Math.sqrt(GLOBE_R_IN ** 2 - RIM_R_IN ** 2);   // 2.33"
const NECK_R_IN = 0.95;                                     // where the trumpet meets the globe
const NECK_Y_IN = GLOBE_CY_IN + Math.sqrt(GLOBE_R_IN ** 2 - NECK_R_IN ** 2); // 5.57"
const REAL = { realDropRangeIn: [12, 139] };   // HVL: minimum / maximum height (cord, field adjustable)
const DEFAULT_FROM_WALL_IN = 7;                // globe back 3.6" off the finished wall
// The glass's middle (globe + inner shade, 0-5.6") on the mirror's widest point.
const defaultHang = hangAtMirrorCentre(2 * 3.25, REAL);

function pendant(THREE, mats, dropM, shadows, candela) {
  const p = new THREE.Group();
  const gH = NECK_Y_IN;

  // Inner shade: a shallow opal bowl closing the bottom, rising inside the
  // globe (its hidden upper part keeps the bulb enclosed).
  {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * (Math.PI / 2);
      pts.push([INNER_R_IN * Math.sin(t), RIM_Y_IN * (1 - Math.cos(t))]);
    }
    pts.push([INNER_R_IN, RIM_Y_IN + 0.6]);
    const m = new THREE.Mesh(latheIn(THREE, pts, { segments: 64, y0: 0, h: gH }), mats.opal);
    m.name = 'innerShade'; m.castShadow = false; m.receiveShadow = false;
    p.add(m);
  }
  // Outer globe: the sphere from the rim up to the neck, open at the rim
  // (where the inner shade shows beneath it).
  {
    const a0 = -Math.asin((GLOBE_CY_IN - RIM_Y_IN) / GLOBE_R_IN);
    const a1 = Math.asin((NECK_Y_IN - GLOBE_CY_IN) / GLOBE_R_IN);
    const pts = arcIn(0, GLOBE_CY_IN, GLOBE_R_IN, a0, a1, 40);
    const m = new THREE.Mesh(latheIn(THREE, pts, { segments: 72, y0: 0, h: gH }), mats.opal);
    m.name = 'opalGlobe'; m.castShadow = false; m.receiveShadow = false;
    p.add(m);
    // The globe's inside, lit by the bulb, seen between rim and inner shade.
    const ig = latheIn(THREE, pts.map(([r, y]) => [r - 0.1, y]), { segments: 72, y0: 0, h: gH });
    const inner = new THREE.Mesh(ig, mats.opal);
    inner.material = mats.opalIn;
    inner.castShadow = false;
    p.add(inner);
  }
  // Crisp brass rim: a flat 0.2" band round the globe's lower edge.
  {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(inch(RIM_R_IN + 0.04), inch(RIM_R_IN + 0.04), inch(0.2), 96, 1, true), mats.brass);
    band.position.y = inch(RIM_Y_IN + 0.06); band.castShadow = true; band.receiveShadow = true; band.name = 'brassRim';
    p.add(band);
    const lip = new THREE.Mesh(new THREE.RingGeometry(inch(INNER_R_IN + 0.02), inch(RIM_R_IN + 0.04), 96), mats.brassIn);
    lip.rotation.x = Math.PI / 2; lip.position.y = inch(RIM_Y_IN - 0.04);
    p.add(lip);
  }
  // Slender neck: a flared Aged Brass trumpet from the globe up to the cord.
  {
    const pts = [[NECK_R_IN + 0.08, NECK_Y_IN - 0.12]];
    const H = OVERALL_H_IN - NECK_Y_IN;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      pts.push([0.24 + (NECK_R_IN + 0.02 - 0.24) * (1 - t) ** 2.4, NECK_Y_IN + H * t]);
    }
    pts.push([0, OVERALL_H_IN]);
    const neck = new THREE.Mesh(latheIn(THREE, pts, { segments: 48 }), mats.brass);
    neck.castShadow = true; neck.receiveShadow = true; neck.name = 'brassNeck';
    p.add(neck);
  }
  cordAndCanopy(THREE, p, mats, { topM: inch(OVERALL_H_IN), dropM, canopyDIn: 4.75, canopyHIn: 0.75 });

  const lights = mitziLights(THREE, p, inch(GLOBE_CY_IN + 0.5), shadows, candela);
  p.userData.lights = lights;
  p.userData.glowMaterials = [mats.opal, mats.opalIn];
  return p;
}

export default {
  id: 'reese-small-pendants',
  name: 'Mitzi Reese small opal pendants (pair)',
  order: 54,
  ...REAL,
  description: '6.75" glossy opal globes on a slender Aged Brass neck, a brass rim round the lower edge and a second opal shade ' +
    'beneath that hides the bulb, on black cloth cords either side of the mirror (Mitzi by Hudson Valley H281701S-AGB: ' +
    '6.75" x 8.25", 4.75" canopy, hangs 12–139" on a 120" cord; E26 60 W; cUL damp rated).',
  defaultHangBottomIn: defaultHang,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    // 6.75" globe: 2" clear of the frame each side, x = 54 -/+ 16.875
    // (37.1" / 70.9"): 3.75" from the tub-column tile, 1.7" from the casing.
    const offsetsIn = offsetsClearOfMirror(ctx, GLOBE_D_IN / 2, 2);

    // Glow: brightest around the bulb (mid globe), softer up under the neck.
    const bulbV = (GLOBE_CY_IN + 0.5) / NECK_Y_IN;
    const mats = mitziMaterials(THREE, (v) => 0.5 + 0.5 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.3 ** 2)));
    mats.opalIn = mats.opal.clone();
    mats.opalIn.side = THREE.BackSide;
    mats.opalIn.emissiveIntensity = mats.opal.emissiveIntensity * 1.3;
    mats.opalIn.userData.onIntensity = mats.opalIn.emissiveIntensity;

    const group = flankingPendantPair(ctx, opts, {
      name: 'light:reese-small-pendants',
      defaultHangIn: defaultHang({ ceilingIn: opts.ceilingIn ?? remodelDims(ctx).ceiling / inch(1) }),
      ...REAL,
      offsetsIn,
      defaultFromWallIn: DEFAULT_FROM_WALL_IN,
      makePendant: (drop) => pendant(THREE, mats, drop, shadows, opts.candela ?? 2.6),
    });
    group.userData.size = { shadeDiameter: inch(GLOBE_D_IN), shadeHeight: inch(OVERALL_H_IN) };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); mats.ramp.dispose(); };
    return group;
  },
};
