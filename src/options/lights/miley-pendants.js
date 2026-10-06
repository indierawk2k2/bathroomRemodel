// Pair of Mitzi by Hudson Valley "Miley" 1-light pendants, Aged Brass
// (H373701-AGB, br-kv5), hung on their cloth cords from the ceiling one
// each side of the oval mirror.  Sources, photo and the drop-data conflict:
// assets/source/lights/miley-pendant/ (SOURCES.md).
//
// One pendant: a slim, fully enclosed opal glass capsule (4" diam. x
// 15.63", round ends), threaded on an Aged Brass rod that shows as a 4.5"
// tube above the glass (where the cord enters) and a 4.5" finial below it,
// a black cloth cord and a 4.75" round canopy.  Fixture 4" x 26.75" h
// (incl. canopy); E26.  Drop: listings give a 120" cord but a "maximum
// height" of 32"; modelled as the 120" cord (see SOURCES.md), so the real
// range is 29" (the listed minimum) to 120".
//
// build(ctx, { hangBottomIn = finial tip AFF (clamped to ceiling - 29"),
//              centreXIn = 54, centreZIn (pendant centre, world z),
//              ceilingIn = 120, shadows = true })
// Lights per pendant, both mid-capsule: a shadow-casting PointLight (the
// opal does not cast; the brass rod ends and the cord do) and a weaker
// unshadowed one for the glow off the long lit glass.
import { remodelDims } from '../../remodel/cfg.js';
import { flankingPendantPair, hangAtMirrorCentre } from './common.js';
import { latheIn, arcIn, mitziMaterials, cordAndCanopy, mitziLights, inch } from './pendB-parts.js';

const GLASS_D_IN = 4, GLASS_H_IN = 15.63;
const FINIAL_IN = 4.5, TOP_TUBE_IN = 4.5;               // brass rod ends (studio photo proportions)
const GLASS_Y0_IN = FINIAL_IN, GLASS_Y1_IN = FINIAL_IN + GLASS_H_IN;
const FIXTURE_TOP_IN = GLASS_Y1_IN + TOP_TUBE_IN;       // 24.63" + canopy ~1.1" + cord = 26.75" listed
const REAL = { realDropRangeIn: [29, 120] };             // listed minimum; the 120" cord (see SOURCES.md)
// Fallback sconce positions (x 36.25" / 70.75"): the 4" capsule is 4.25" /
// 3.25" clear of the frame at its widest point, 4.25" from the tub-column
// tile and 3.25" from the window casing.
const FALLBACK_OFFSETS_IN = [-17.75, 16.75];
const DEFAULT_FROM_WALL_IN = 7;                          // glass back 5" off the finished wall
// Capsule centre (finial + half the glass = 12.3" above the finial tip) on
// the mirror's widest point.  At the default mirror that wants the tip at
// 57.7", below the hang slider's 60" floor, so the app clamps the default
// to 60" (capsule centre 72.3", 2.3" above the mirror centre).
const defaultHang = hangAtMirrorCentre(2 * (FINIAL_IN + GLASS_H_IN / 2), REAL);

function pendant(THREE, mats, dropM, shadows, candela) {
  const p = new THREE.Group();
  const R = GLASS_D_IN / 2;

  // Opal capsule: a cylinder with hemispherical ends, closed all round.
  {
    const pts = [...arcIn(0, GLASS_Y0_IN + R, R, -Math.PI / 2, 0, 16), ...arcIn(0, GLASS_Y1_IN - R, R, 0, Math.PI / 2, 16)];
    pts.splice(17, 0, [R, (GLASS_Y0_IN + GLASS_Y1_IN) / 2]);   // a mid ring so the glow ramp has a vertex there
    const m = new THREE.Mesh(latheIn(THREE, pts, { segments: 64, y0: GLASS_Y0_IN, h: GLASS_H_IN }), mats.opal);
    m.name = 'opalCapsule'; m.castShadow = false; m.receiveShadow = false;
    p.add(m);
  }
  const brass = (geo, y, name) => {
    const m = new THREE.Mesh(geo, mats.brass);
    m.position.y = inch(y); m.castShadow = true; m.receiveShadow = true;
    if (name) m.name = name;
    p.add(m);
    return m;
  };
  // Finial below the glass: a 0.55" rod with a rounded tip and a cup
  // where it meets the glass.
  brass(new THREE.SphereGeometry(inch(0.28), 20, 12), 0.28, 'finialTip');
  brass(new THREE.CylinderGeometry(inch(0.28), inch(0.28), inch(FINIAL_IN - 0.28 - 0.4), 20), 0.28 + (FINIAL_IN - 0.28 - 0.4) / 2, 'finial');
  brass(new THREE.CylinderGeometry(inch(0.48), inch(0.36), inch(0.45), 28), FINIAL_IN - 0.2, 'bottomCup');
  // Top tube above the glass: a cup, then a 0.6" tube to the cord.
  brass(new THREE.CylinderGeometry(inch(0.36), inch(0.48), inch(0.45), 28), GLASS_Y1_IN + 0.2, 'topCup');
  brass(new THREE.CylinderGeometry(inch(0.29), inch(0.29), inch(TOP_TUBE_IN - 0.4), 20), GLASS_Y1_IN + 0.4 + (TOP_TUBE_IN - 0.4) / 2, 'topTube');
  cordAndCanopy(THREE, p, mats, { topM: inch(FIXTURE_TOP_IN), dropM, canopyDIn: 4.75, canopyHIn: 1.1 });

  const lights = mitziLights(THREE, p, inch((GLASS_Y0_IN + GLASS_Y1_IN) / 2 + 1.5), shadows, candela);
  p.userData.lights = lights;
  p.userData.glowMaterials = [mats.opal];
  return p;
}

export default {
  id: 'miley-pendants',
  name: 'Mitzi Miley opal capsule pendants (pair)',
  order: 55,
  ...REAL,
  description: 'Slim 4" x 15.6" opal glass capsules, fully enclosed, on Aged Brass rod ends and black cloth cords, either side of the ' +
    'mirror (Mitzi by Hudson Valley H373701-AGB: 4" x 26.75" fixture, 4.75" canopy; listings give a 120" cord but a 32" "maximum ' +
    'height": modelled on the cord. E26; no damp rating found for the pendant, the matching sconce is cUL damp). No longer listed on hvlgroup.com.',
  defaultHangBottomIn: defaultHang,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const shadows = opts.shadows !== false;
    const offsetsIn = ctx.config?.REMODEL?.sconceOffsetsIn ?? FALLBACK_OFFSETS_IN;

    // The long capsule: brightest a little above its middle (the bulb sits
    // in the upper half, under the socket), falling off toward both ends.
    const bulbV = (GLASS_H_IN / 2 + 1.5) / GLASS_H_IN;
    const mats = mitziMaterials(THREE, (v) => 0.3 + 0.7 * Math.exp(-((v - bulbV) ** 2) / (2 * 0.26 ** 2)), { glassIntensity: 1.0 });

    const group = flankingPendantPair(ctx, opts, {
      name: 'light:miley-pendants',
      defaultHangIn: defaultHang({ ceilingIn: opts.ceilingIn ?? remodelDims(ctx).ceiling / inch(1) }),
      ...REAL,
      offsetsIn,
      defaultFromWallIn: DEFAULT_FROM_WALL_IN,
      makePendant: (drop) => pendant(THREE, mats, drop, shadows, opts.candela ?? 2.4),
    });
    group.userData.size = { shadeDiameter: inch(GLASS_D_IN), shadeHeight: inch(GLASS_H_IN) };
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); mats.ramp.dispose(); };
    return group;
  },
};
