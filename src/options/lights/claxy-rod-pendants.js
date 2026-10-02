// Pair of Claxy "Modern Brass Pendant Light with Frosted Glass Shade Hanging
// Rod" (SKU CL-B5333DU-J-M, br-wbi), hung from the ceiling one each side of
// the oval mirror.  Product page, drawing and photos:
// assets/source/lights/claxy-brass-rod-pendant/ (SOURCES.md).
//
// One pendant: an open frosted-glass cylinder (5.8" diam. x 6.3") ringed by
// a "floating" brushed-brass band (7" diam. x 2.7", 1.55" below the glass
// top), a brass socket inside the top, a rigid 0.36" brass rod, a swivel
// adaptor and a 4.9" x 1" canopy with two knurled cap nuts.  The rods come
// as 3 x 12" + 1 x 6", so the real drop (canopy top to shade bottom) is
// 8.4" + {0, 6, ..., 42}" = 8.4"-50.4"; the slider stays continuous and the
// joints are drawn where real sections would meet.
//
// build(ctx, { hangBottomIn = shade bottom AFF (clamped to ceiling - 8.4",
//              the "mini" height with no rods), centreXIn = 54, centreZIn
//              (pendant centre, world z), ceilingIn = 120, shadows = true })
// Lights per pendant, both at the bulb: a shadow-casting PointLight (the
// glass does not cast, as frosted glass passes most of the light; the brass
// band, plate, socket, rod and canopy do, so the band throws its shadow
// ring on the wall) and a weaker unshadowed one for the glow off the lit
// glass, which keeps that ring soft and partial as in the bathroom photo.
import { warmWhite } from '../../remodel/cfg.js';
import {
  bulbLight, glowRamp, heightUV, flankingPendantPair, hangAtMirrorCentre,
  offsetsClearOfMirror, inch, mm,
} from './common.js';

const GLASS_D_IN = 5.8, SHADE_H_IN = 6.3, BAND_D_IN = 7, BAND_H_IN = 2.7, BAND_TOP_BELOW_IN = 1.55;
const MINI_DROP_IN = 8.4;                 // canopy top -> shade bottom, no rods
const RODS_IN = [12, 12, 12, 6];          // supplied rod sections
const DEFAULT_FROM_WALL_IN = 7;           // band back 3.5" off the finished wall
const defaultHang = hangAtMirrorCentre(SHADE_H_IN);

/** Real rod combination nearest a wanted drop (inches): { rodsIn, dropIn }. */
export function nearestRealDrop(wantDropIn) {
  let best = { rodsIn: [], dropIn: MINI_DROP_IN };
  const n = RODS_IN.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const rods = RODS_IN.filter((_, i) => mask & (1 << i));
    const d = MINI_DROP_IN + rods.reduce((a, b) => a + b, 0);
    if (Math.abs(d - wantDropIn) < Math.abs(best.dropIn - wantDropIn)) best = { rodsIn: rods, dropIn: d };
  }
  return best;
}

function pendant(THREE, mats, dropM, shadows, candela) {
  const p = new THREE.Group();
  const H = inch(SHADE_H_IN), GR = inch(GLASS_D_IN / 2), gt = inch(0.12);
  const BR = inch(BAND_D_IN / 2), BH = inch(BAND_H_IN);
  const bandTop = H - inch(BAND_TOP_BELOW_IN);
  const canopyR = inch(2.45), canopyH = inch(1.0), rodR = inch(0.18);

  // Frosted glass: outer face, inner face (lit directly, brighter), top.
  {
    const og = heightUV(new THREE.CylinderGeometry(GR, GR, H, 72, 8, true).translate(0, H / 2, 0), 0, H);
    const outer = new THREE.Mesh(og, mats.glass);
    outer.name = 'frostedGlass';
    outer.castShadow = false; outer.receiveShadow = false;
    p.add(outer);
    const ig = heightUV(new THREE.CylinderGeometry(GR - gt, GR - gt, H - mm(2), 72, 8, true).translate(0, H / 2, 0), 0, H);
    const inner = new THREE.Mesh(ig, mats.glassIn);
    inner.castShadow = false;
    p.add(inner);
    // Glass rims (polished edge rings read lighter in the photos).
    for (const y of [0, H]) {
      const r = new THREE.Mesh(new THREE.RingGeometry(GR - gt, GR, 72), mats.rim);
      r.rotation.x = y === 0 ? Math.PI / 2 : -Math.PI / 2;
      r.position.y = y;
      r.castShadow = false;
      p.add(r);
    }
    // Brass top plate holding the glass (the socket hangs below it).
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(GR - gt, GR - gt, mm(1.5), 64), mats.brassInner);
    plate.position.y = H - mm(4);
    plate.castShadow = true;
    p.add(plate);
  }
  // Floating brass band: brushed outside, slightly darker inside (photo).
  {
    const bg = new THREE.CylinderGeometry(BR, BR, BH, 96, 1, true).translate(0, bandTop - BH / 2, 0);
    const band = new THREE.Mesh(bg, mats.brass);
    band.name = 'brassBand';
    band.castShadow = true; band.receiveShadow = true;
    p.add(band);
    const bi = new THREE.Mesh(new THREE.CylinderGeometry(BR - mm(0.8), BR - mm(0.8), BH, 96, 1, true).translate(0, bandTop - BH / 2, 0), mats.bandInside);
    bi.castShadow = false;
    p.add(bi);
    for (const y of [bandTop, bandTop - BH]) {            // rolled edges
      const e = new THREE.Mesh(new THREE.TorusGeometry(BR - mm(0.4), mm(0.6), 4, 96), mats.brass);
      e.rotation.x = Math.PI / 2; e.position.y = y;
      p.add(e);
    }
    for (let k = 0; k < 3; k++) {                         // spacers band -> glass
      const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
      const len = BR - GR - mm(2), rc = GR + len / 2;          // stops short of the band's face
      const s = new THREE.Mesh(new THREE.BoxGeometry(len, mm(6), mm(4)), mats.spacer);   // rough: no glint by the bulb
      s.position.set(Math.cos(a) * rc, bandTop - mm(8), Math.sin(a) * rc);
      s.rotation.y = -a;
      p.add(s);
    }
  }
  // Socket + narrow bulb inside (seen from below through the open bottom).
  {
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.62), inch(0.62), inch(1.7), 28), mats.brassInner);
    sk.position.y = H - inch(0.85) - mm(4);
    sk.castShadow = true;
    p.add(sk);
    const b = new THREE.Mesh(new THREE.SphereGeometry(inch(0.9), 20, 14), mats.bulb);
    b.scale.set(1, 1.45, 1);
    b.position.y = H - inch(1.7) - inch(1.2);
    b.castShadow = false;
    p.add(b);
  }
  // Rod (with joints where real sections meet), swivel adaptor, canopy.
  const add = (geo, y, name, mat = mats.brass) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y; m.castShadow = true; m.receiveShadow = true;
    if (name) m.name = name;
    p.add(m);
    return m;
  };
  add(new THREE.CylinderGeometry(inch(0.3), inch(0.42), inch(0.35), 24), H + inch(0.17), 'rodNut');
  const adaptH = inch(1.0);
  const rodBot = H + inch(0.35);
  const rodTop = dropM - canopyH - adaptH;
  const rodLen = Math.max(mm(5), rodTop - rodBot);
  add(new THREE.CylinderGeometry(rodR, rodR, rodLen, 16), rodBot + rodLen / 2, 'rod');
  // Joints: from the top down, the 6" section first, then the 12"s.
  for (let y = rodTop - inch(6), i = 0; y > rodBot + inch(1) && i < RODS_IN.length; y -= inch(12), i++) {
    add(new THREE.CylinderGeometry(rodR + mm(0.5), rodR + mm(0.5), mm(4), 16), y);
  }
  add(new THREE.CylinderGeometry(inch(0.2), inch(0.2), adaptH * 0.7, 16), rodTop + adaptH * 0.35, 'adaptor');
  add(new THREE.SphereGeometry(inch(0.26), 16, 12), rodTop + adaptH * 0.72);
  add(new THREE.CylinderGeometry(inch(0.32), inch(0.32), adaptH * 0.3, 16), dropM - canopyH - adaptH * 0.15);
  // Canopy: a shallow drum with a rounded lower edge.
  {
    const pts = [new THREE.Vector2(0, -canopyH), new THREE.Vector2(canopyR - inch(0.2), -canopyH)];
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector2(canopyR - inch(0.2) + inch(0.2) * Math.cos(a), -canopyH + inch(0.2) + inch(0.2) * Math.sin(a)));
    }
    pts.push(new THREE.Vector2(canopyR, 0));
    add(new THREE.LatheGeometry(pts, 64), dropM, 'canopy');
    for (const sx of [-1, 1]) {                           // knurled cap nuts
      add(new THREE.CylinderGeometry(inch(0.2), inch(0.2), inch(0.35), 12), dropM - canopyH - inch(0.17)).position.x = sx * inch(1.35);
    }
  }

  // The lit frosted glass is a broad source, so the band's shadow on the
  // wall is soft and partial (bathroom photo), not the black wedge a point
  // light alone gives: split the bulb into a shadowed part (band, plate,
  // rod) and an unshadowed part standing for the glow off the glass.
  const l = bulbLight(THREE, { candela: candela * 0.65, shadow: shadows, mapSize: 512, near: 0.02 });
  l.position.y = H - inch(2.6);
  p.add(l);
  const fill = bulbLight(THREE, { candela: candela * 0.45, shadow: false });
  fill.position.y = H - inch(2.6);
  p.add(fill);
  p.userData.lights = [l, fill];
  p.userData.glowMaterials = [mats.glass, mats.glassIn, mats.bulb];
  return p;
}

export default {
  id: 'claxy-rod-pendants',
  name: 'Claxy brass rod pendants, frosted glass (pair)',
  order: 45,
  description: 'Two 7" x 6.3" frosted-glass cylinders with a floating brushed-brass band on rigid brass rods, either side of the mirror ' +
    '(4.9" canopy; rods 3 x 12" + 6" give drops of 8.4–50.4" only, so at a 120" ceiling the shade bottom cannot go below 69.6": ' +
    'the default mirror-centre height needs 53.2"). Damp rating not stated; Claxy advises a dry location.',
  // Shade centre on the mirror's widest point (follows "Mirror bottom").
  defaultHangBottomIn: defaultHang,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    // x = 54 -/+ 17": the 7" band 2" clear of the frame each side
    // (x 37" / 71"), 3.5" from the tub-column tile, 1.5" from the casing.
    const offsetsIn = offsetsClearOfMirror(ctx, BAND_D_IN / 2, 2);

    // Frosted glass: glow peaks around the bulb (mid-low), dimmer under the
    // band and at the top; the inner face is lit directly.
    const H = SHADE_H_IN, bulbV = (H - 2.6) / H;
    const ramp = glowRamp(THREE, (v) => 0.4 + 0.6 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.28 ** 2)));
    const mats = {
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xeeece6, roughness: 0.55, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.45,
        emissive: warmWhite(THREE), emissiveIntensity: 0.85, emissiveMap: ramp,
      }),
      glassIn: new THREE.MeshStandardMaterial({
        color: 0xf2f0ea, roughness: 0.6, side: THREE.BackSide,
        emissive: warmWhite(THREE), emissiveIntensity: 1.2, emissiveMap: ramp,
      }),
      rim: new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.3, emissive: warmWhite(THREE), emissiveIntensity: 0.6 }),
      bulb: new THREE.MeshStandardMaterial({ color: 0xfff4e2, roughness: 0.5, emissive: warmWhite(THREE), emissiveIntensity: 3.5 }),
      // Brushed "electrophoretic" brass: warmer and yellower than the
      // Anders' champagne bronze.  metalness 1 -> the env probe reflects the room.
      // Brushed: rough enough that the band takes the room's broad light
      // (photo: an even satin gold), not a dark mirror image of the room.
      brass: new THREE.MeshPhysicalMaterial({ color: 0xd9b263, metalness: 1, roughness: 0.46, anisotropy: 0.35 }),
      brassInner: new THREE.MeshPhysicalMaterial({ color: 0xb38c45, metalness: 1, roughness: 0.4 }),
      // Rough inside: it faces the bulb from 0.6" away, and a sharp
      // highlight there blooms into a hot spot at the band's edge.
      bandInside: new THREE.MeshPhysicalMaterial({ color: 0xa88540, metalness: 1, roughness: 0.75, side: THREE.BackSide }),
      spacer: new THREE.MeshPhysicalMaterial({ color: 0xa88540, metalness: 1, roughness: 0.75 }),
    };
    for (const m of [mats.glass, mats.glassIn, mats.rim, mats.bulb]) m.userData.onIntensity = m.emissiveIntensity;

    const group = flankingPendantPair(ctx, opts, {
      name: 'light:claxy-rod-pendants',
      defaultHangIn: defaultHang({}),
      minDropIn: MINI_DROP_IN,
      offsetsIn,
      defaultFromWallIn: DEFAULT_FROM_WALL_IN,
      makePendant: (drop) => pendant(THREE, mats, drop, shadows, opts.candela ?? 2.4),
    });
    const dropIn = group.userData.placement.drop / inch(1);
    group.userData.size = {
      bandDiameter: inch(BAND_D_IN), shadeHeight: inch(SHADE_H_IN), dropIn,
      nearestReal: nearestRealDrop(dropIn),
    };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); ramp.dispose(); };
    return group;
  },
};
