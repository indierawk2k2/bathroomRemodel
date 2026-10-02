// Pair of West Elm "Anders Porcelain Pendant", 5" size (br-166), hung from
// the ceiling one each side of the oval mirror.  Product page and photos:
// assets/source/lights/anders-pendant/ (SOURCES.md).
//
// One pendant: a 5" diam. x 4.5" ivory porcelain cylinder (softly rounded
// rims, open at the bottom, closed top), a plain 1.4" x 3" Champagne Bronze
// socket cup on top of it, a thin rigid stem (5/16") and a 5" x 0.5" disc
// canopy with a small swivel collar.  Overall drop 12.6"-54.6" (the real
// adjustment range), E26 / one A19 60 W-equivalent bulb, hidden inside.
//
// build(ctx, { hangBottomIn = shade bottom AFF (clamped to ceiling - 12.6",
//              the shortest real drop), centreXIn = 54, centreZIn (pendant
//              centre, world z), ceilingIn = 120, shadows = true })
// Lights per pendant: one shadow-casting PointLight low in the shade (the
// porcelain casts, so the bulb throws a pool of light down through the open
// bottom, as in the lit product photo) plus one weak unshadowed PointLight
// standing for the light the thin porcelain lets through.
import { warmWhite } from '../../remodel/cfg.js';
import {
  bulbLight, glowRamp, heightUV, flankingPendantPair, hangAtMirrorCentre,
  inch, mm,
} from './common.js';

const SHADE_D_IN = 5, SHADE_H_IN = 4.5;
const MIN_DROP_IN = 12.6, MAX_DROP_IN = 54.6;      // West Elm: hanging length
// Default x offsets from the sink centre: the Harlan sconce positions
// (x 36.25" / 70.75", config.js REMODEL.sconceOffsetsIn).  With the 5"
// shade that leaves 3.75" / 2.75" to the mirror frame at its widest point,
// 3.75" to the tub-column tile (x 30") and 2.75" to the window casing (x 76").
const FALLBACK_OFFSETS_IN = [-17.75, 16.75];
// Shade centre 7" off the finished wall: its back is 4.5" clear of the tile
// and the 5" canopy sits wholly on the ceiling.
const DEFAULT_FROM_WALL_IN = 7;
const defaultHang = hangAtMirrorCentre(SHADE_H_IN);   // shade centre on the mirror's widest point

function pendant(THREE, mats, dropM, shadows, candela) {
  const p = new THREE.Group();
  const R = inch(SHADE_D_IN / 2), H = inch(SHADE_H_IN);
  const cupR = inch(0.7), cupH = inch(3.0);
  const stemR = inch(0.16), canopyR = inch(2.5), canopyH = inch(0.5);

  // Porcelain shell: outer face, rounded rims, top (lathe, counter-clockwise
  // in (r, y) so the faces point out), then a separate inner face.
  {
    const pts = [];
    const arc = (cx, cy, r, a0, a1, n) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * (i / n);
        pts.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
    };
    const t = inch(0.14), rb = inch(0.12), rt = inch(0.42);
    pts.push(new THREE.Vector2(R - t, 0));                  // inner bottom lip
    arc(R - rb, rb, rb, -Math.PI / 2, 0, 6);                // bottom rim round-over
    arc(R - rt, H - rt, rt, 0, Math.PI / 2, 10);            // top shoulder
    pts.push(new THREE.Vector2(cupR + mm(1), H));            // top, under the cup
    const g = heightUV(new THREE.LatheGeometry(pts, 96), 0, H);
    const shell = new THREE.Mesh(g, mats.porcelain);
    shell.name = 'porcelainShade';
    shell.castShadow = true;           // opaque enough: light leaves mostly downward
    shell.receiveShadow = false;
    p.add(shell);
    const ig = new THREE.CylinderGeometry(R - t, R - t, H - t - inch(0.05), 64, 1, true);
    ig.translate(0, (H - t) / 2, 0);
    const inner = new THREE.Mesh(heightUV(ig, 0, H), mats.inside);
    inner.name = 'porcelainInside';
    inner.castShadow = false;
    p.add(inner);
    const lid = new THREE.Mesh(new THREE.CircleGeometry(R - t, 48), mats.inside);
    lid.rotation.x = Math.PI / 2; lid.position.y = H - t;     // underside of the top, faces down
    lid.castShadow = false;
    p.add(lid);
  }
  // Bulb (A19, frosted): only seen from below, through the open bottom.
  {
    const b = new THREE.Mesh(new THREE.SphereGeometry(inch(1.15), 20, 14), mats.bulb);
    b.scale.set(1, 1.25, 1);
    b.position.y = inch(1.9);
    b.castShadow = false;
    p.add(b);
  }
  // Socket cup, stem reducer, stem, swivel collar, canopy (Champagne Bronze).
  const add = (geo, y, name) => {
    const m = new THREE.Mesh(geo, mats.metal);
    m.position.y = y; m.castShadow = true; m.receiveShadow = true;
    if (name) m.name = name;
    p.add(m);
    return m;
  };
  add(new THREE.CylinderGeometry(cupR, cupR, cupH, 40), H + cupH / 2, 'socketCup');
  add(new THREE.CylinderGeometry(cupR - mm(1.5), cupR - mm(1.5), mm(2), 40), H + cupH + mm(1));   // cap edge
  add(new THREE.CylinderGeometry(inch(0.22), inch(0.3), inch(0.4), 20), H + cupH + inch(0.2));    // reducer
  const collarH = inch(0.8);
  const stemTop = dropM - canopyH - collarH;
  const stemBot = H + cupH + inch(0.4);
  const stemLen = Math.max(mm(5), stemTop - stemBot);
  add(new THREE.CylinderGeometry(stemR, stemR, stemLen, 14), stemBot + stemLen / 2, 'stem');
  // Stem section joints (thin couplings every 12" up from the cup).
  for (let y = stemBot + inch(12); y < stemTop - inch(2); y += inch(12)) {
    add(new THREE.CylinderGeometry(stemR + mm(0.6), stemR + mm(0.6), mm(5), 14), y);
  }
  add(new THREE.CylinderGeometry(inch(0.28), inch(0.32), collarH, 20), dropM - canopyH - collarH / 2, 'swivel');
  add(new THREE.CylinderGeometry(canopyR - mm(1.5), canopyR, canopyH, 56), dropM - canopyH / 2, 'canopy');

  // Lights: the bulb's main beam (shadowed by the porcelain) and the glow
  // that comes through the porcelain (no shadow).
  const lights = [];
  const main = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512, near: 0.02 });
  main.position.y = inch(1.5);
  p.add(main); lights.push(main);
  const fill = bulbLight(THREE, { candela: candela * 0.22, shadow: false });
  fill.position.y = inch(2.6);
  p.add(fill); lights.push(fill);
  p.userData.lights = lights;
  p.userData.glowMaterials = [mats.porcelain, mats.inside, mats.bulb];
  return p;
}

export default {
  id: 'anders-pendants',
  name: 'West Elm Anders pendants (pair)',
  order: 40,
  description: 'Two 5" ivory porcelain pendants on Champagne Bronze stems, hung from the ceiling either side of the mirror ' +
    '(5" x 4.5" shade, 5" canopy, drop 12.6–54.6"; also sold as a 14" drum). Damp rating not stated by West Elm.',
  // Placement defaults: shade centre on the mirror's widest point (follows
  // the "Mirror bottom" slider), 7" off the wall.
  defaultHangBottomIn: defaultHang,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const offsetsIn = ctx.config?.REMODEL?.sconceOffsetsIn ?? FALLBACK_OFFSETS_IN;

    // Ivory porcelain: warm emissive brightest low down (the bulb sits in
    // the lower half), fading toward the top; the inside is lit directly.
    const ramp = glowRamp(THREE, (v) => 0.35 + 0.65 * Math.exp(-((v - 0.32) ** 2) / (2 * 0.3 ** 2)));
    const rampIn = glowRamp(THREE, (v) => 0.55 + 0.45 * Math.exp(-((v - 0.4) ** 2) / (2 * 0.35 ** 2)));
    const mats = {
      porcelain: new THREE.MeshPhysicalMaterial({
        color: 0xf0ebe1, roughness: 0.38, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3,
        sheen: 0.25, sheenColor: 0xffffff, sheenRoughness: 0.5,
        emissive: warmWhite(THREE), emissiveIntensity: 0.55, emissiveMap: ramp,
      }),
      inside: new THREE.MeshStandardMaterial({
        color: 0xf3eee4, roughness: 0.6, side: THREE.DoubleSide,
        emissive: warmWhite(THREE), emissiveIntensity: 1.25, emissiveMap: rampIn,
      }),
      bulb: new THREE.MeshStandardMaterial({
        color: 0xfff4e2, roughness: 0.5, emissive: warmWhite(THREE), emissiveIntensity: 2.4,
      }),
      // Champagne Bronze: a soft, pale satin brass (photos); metalness 1,
      // so the room's env probe gives it real reflections.
      metal: new THREE.MeshPhysicalMaterial({ color: 0xcfb284, metalness: 1, roughness: 0.42, anisotropy: 0.3 }),
    };
    for (const m of [mats.porcelain, mats.inside, mats.bulb]) m.userData.onIntensity = m.emissiveIntensity;

    const group = flankingPendantPair(ctx, opts, {
      name: 'light:anders-pendants',
      defaultHangIn: defaultHang({}),
      minDropIn: MIN_DROP_IN,
      offsetsIn,
      defaultFromWallIn: DEFAULT_FROM_WALL_IN,
      makePendant: (drop) => pendant(THREE, mats, drop, shadows, opts.candela ?? 2.6),
    });
    const dropIn = group.userData.placement.drop / inch(1);
    group.userData.size = {
      shadeDiameter: inch(SHADE_D_IN), shadeHeight: inch(SHADE_H_IN),
      dropIn, beyondRealMaxDropIn: Math.max(0, dropIn - MAX_DROP_IN),
    };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); ramp.dispose(); rampIn.dispose(); };
    return group;
  },
};
