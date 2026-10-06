// Pair of Mitzi by Hudson Valley "Stella" 1-light pendants, Aged Brass
// (H105701-AGB, br-kv5), hung on their cloth cords from the ceiling one
// each side of the oval mirror.  Product pages and photo:
// assets/source/lights/stella-pendant/ (SOURCES.md).
//
// One pendant: a 7" glossy opal glass globe, closed at the bottom (studio
// photo: unbroken opal all round; the shade's 3" "top" is the fitter
// opening), a shallow 3.8" Aged Brass cap over that opening with a small
// cord collar on top, a black fabric-covered cord (120") and a 4.5" round
// canopy.  Overall 7" diam. x 7.75" h; hanging height 11.25"-114.25" (HVL,
// canopy to bottom); E26, one A19 60 W, hidden inside the globe; cUL damp.
//
// build(ctx, { hangBottomIn = globe bottom AFF (clamped to ceiling - 11.25",
//              the shortest real hang), centreXIn = 54, centreZIn (pendant
//              centre, world z), ceilingIn = 120, shadows = true })
// Lights per pendant, both at the bulb: a shadow-casting PointLight (the
// opal glass does not cast; the brass cap and the cord do) and a weaker
// unshadowed one for the glow off the lit globe.
import { remodelDims } from '../../remodel/cfg.js';
import { flankingPendantPair, hangAtMirrorCentre, offsetsClearOfMirror } from './common.js';
import { latheIn, arcIn, mitziMaterials, cordAndCanopy, mitziLights, inch } from './pendB-parts.js';

const GLOBE_D_IN = 7, OVERALL_H_IN = 7.75, FITTER_D_IN = 3;
const REAL = { realDropRangeIn: [11.25, 114.25] };   // HVL: minimum / maximum height (cord, field adjustable)
const DEFAULT_FROM_WALL_IN = 7;                       // globe back 3.5" off the finished wall
// Globe centre (3.5" up from its bottom) on the mirror's widest point.
const defaultHang = hangAtMirrorCentre(GLOBE_D_IN, REAL);

function pendant(THREE, mats, dropM, shadows, candela) {
  const p = new THREE.Group();
  const R = GLOBE_D_IN / 2, rf = FITTER_D_IN / 2;
  const yCut = R + Math.sqrt(R * R - rf * rf);          // 6.66": where the sphere meets the 3" fitter

  // Opal globe: a sphere from its closed bottom up to the fitter opening,
  // with a short rolled neck lip.
  {
    const aTop = Math.asin((yCut - R) / R);
    const pts = arcIn(0, R, R, -Math.PI / 2, aTop, 48);
    pts.push([rf - 0.05, yCut + 0.08], [rf - 0.12, yCut + 0.1]);
    const g = new THREE.Mesh(latheIn(THREE, pts, { segments: 72, y0: 0, h: yCut }), mats.opal);
    g.name = 'opalGlobe';
    g.castShadow = false; g.receiveShadow = false;
    p.add(g);
  }
  // Aged Brass cap: a shallow dome 3.8" wide over the fitter, a 1.17"
  // collar on top of it where the cord enters (studio photo).
  const brass = (geo, y, name, mat = mats.brass) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = inch(y); m.castShadow = true; m.receiveShadow = true;
    if (name) m.name = name;
    p.add(m);
    return m;
  };
  {
    const pts = [[1.9, 6.42], [1.9, 6.5]];
    for (let i = 1; i <= 10; i++) {                       // dome: r 1.9 -> 0.6 over 0.65"
      const t = i / 10;
      pts.push([1.9 - 1.3 * t, 6.5 + 0.65 * Math.sin(t * Math.PI / 2)]);
    }
    pts.push([0, 7.15]);
    brass(latheIn(THREE, pts, { segments: 72 }), 0, 'brassCap');
    // The cap's underside, seen only through the glass edge: rough brass.
    const under = new THREE.Mesh(new THREE.CircleGeometry(inch(1.88), 48), mats.brassIn);
    under.rotation.x = Math.PI / 2; under.position.y = inch(6.43);
    p.add(under);
    brass(new THREE.CylinderGeometry(inch(0.585), inch(0.585), inch(0.6), 36), 7.15 + 0.3, 'cordCollar');
  }
  cordAndCanopy(THREE, p, mats, { topM: inch(OVERALL_H_IN), dropM, canopyDIn: 4.5, canopyHIn: 0.85 });

  // A19 in the middle of the globe (the socket hangs from the cap).
  const lights = mitziLights(THREE, p, inch(R + 0.3), shadows, candela);
  p.userData.lights = lights;
  p.userData.glowMaterials = [mats.opal];
  return p;
}

export default {
  id: 'stella-pendants',
  name: 'Mitzi Stella opal globe pendants (pair)',
  order: 53,
  ...REAL,
  description: '7" glossy opal glass globes (closed at the bottom, bulb hidden) under a shallow Aged Brass cap, on black cloth cords, ' +
    'either side of the mirror (Mitzi by Hudson Valley H105701-AGB: 7" x 7.75", 4.5" canopy, hangs 11.25–114.25" on a 120" cord; ' +
    'E26 60 W; cUL damp rated).',
  // Globe centre on the mirror's widest point (follows "Mirror bottom").
  defaultHangBottomIn: defaultHang,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    // 7" globe: wider than the sconce positions allow, so 2" clear of the
    // frame each side: x = 54 -/+ 17 (37" / 71"): 3.5" from the tub-column
    // tile (x 30"), 1.5" from the window casing edge (x 76").
    const offsetsIn = offsetsClearOfMirror(ctx, GLOBE_D_IN / 2, 2);

    // The globe glows almost evenly (the A19 sits at its centre), a little
    // brighter at the bulb's height and dimmer under the brass cap.
    const bulbV = (GLOBE_D_IN / 2 + 0.3) / 6.66;
    const mats = mitziMaterials(THREE, (v) => 0.55 + 0.45 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.32 ** 2)) - 0.25 * Math.max(0, v - 0.85) / 0.15);

    const group = flankingPendantPair(ctx, opts, {
      name: 'light:stella-pendants',
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
