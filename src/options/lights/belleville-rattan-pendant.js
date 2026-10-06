// Nathan James "Belleville" boho rattan pendant with glass diffuser, SKU
// 12040 (br-cmo): one statement pendant hung in front of the mirror like
// the Monteaux.  Product page and photos:
// assets/source/lights/belleville-rattan-pendant/ (SOURCES.md).
//
// Nathan James: shade 17.1" wide x 5.1" h (a shallow woven rattan dome;
// the drawing gives 7.3" with its woven top collar), 5" canopy, hanging
// length 19.2"-44.2" on rigid brass-finish rods (the drawing shows 6", 6",
// 12" and 12" sections).  From the photos: a frosted white glass diffuser
// bowl about 8" across closes the middle of the open bottom and hangs
// ~2.6" below the rattan rim, so the bulb (inside the bowl) never shows;
// the rim is wrapped in rattan.  Bulb type and damp rating are not stated.
//
// build(ctx, { hangBottomIn = 76 (diffuser bottom AFF, clamped to ceiling -
//              19.2", the shortest real hang), centreXIn = 54, centreZIn =
//              17 (fixture centre, world z), ceilingIn = 120, shadows = true })
// Default 76": the longest real hang at a 120" ceiling is 44.2" (bottom
// 75.8"); the body spans 76-86" (rim at 78.6"), below the mirror top (98");
// 17" off the wall keeps the 17.1" shade's back 8.5" clear.
// Lights: 1 shadow-casting PointLight in the diffuser (the weave casts
// through its alpha holes: dappled light on the wall and ceiling; the
// glass does not cast) + 1 weak unshadowed fill for light scattered off
// the weave.
import { remodelDims, tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { bulbLight, finishFixture, lowestRealBottomIn } from './common.js';
import { latheIn, smoothProfile, glowingGlass, addMesh, statementBottom, heightUV, inch, mm } from './statement-parts.js';

const REAL = { realDropRangeIn: [19.2, 44.2] };   // Nathan James: min / max hanging length
const RODS_IN = [12, 12, 6, 6];                   // rod sections, bottom up (the drawing shows 6, 6, 12, 12 from the canopy down)
const SHADE_D_IN = 17.1, SHADE_H_IN = 5.1, COLLAR_H_IN = 2.2;
const DIFFUSER_DROP_IN = 2.6;                     // diffuser bottom below the rattan rim (photo)
const DIFFUSER_R_IN = 4.0;
const DEFAULT_HANG_IN = 76;
const DEFAULT_FROM_WALL_IN = 17;
const WEAVE_REPEAT = [inch(3), inch(3)];          // fallback only (the pack gives physicalSizeM)

// Dome profile (r, y) from the rim, inches (photo 12040-DET: a low convex
// dome, steeper near the rim, flattening into the collar).
const DOME = [[8.55, 0], [8.25, 0.8], [7.55, 1.85], [6.45, 2.9], [5.05, 3.85], [3.65, 4.6], [2.7, 5.0], [2.55, SHADE_H_IN]];

/** Rewrite a lathe's uvs to physical repeats: u = arc length round the
 *  rim / repeat (a whole number, so the seam matches), v = arc length up
 *  the profile / repeat. */
function weaveUV(geo, profileIn, rep, rimRIn) {
  const s = [0];
  for (let i = 1; i < profileIn.length; i++) {
    const [r0, y0] = profileIn[i - 1], [r1, y1] = profileIn[i];
    s.push(s[i - 1] + Math.hypot(r1 - r0, y1 - y0));
  }
  const uRep = Math.max(1, Math.round((2 * Math.PI * inch(rimRIn)) / rep[0]));
  const uv = geo.attributes.uv, n = profileIn.length;
  for (let k = 0; k < uv.count; k++) {
    const j = k % n;
    uv.setXY(k, uv.getX(k) * uRep, inch(s[j]) / rep[1]);
  }
  uv.needsUpdate = true;
  return geo;
}

export default {
  id: 'belleville-rattan-pendant',
  name: 'Nathan James Belleville rattan pendant, glass diffuser',
  order: 32,
  ...REAL,
  description: (ctx) => '17.1" x 5.1" woven rattan dome with a frosted glass diffuser closing the bottom, brass-finish rods and 5" canopy ' +
    `(hang 19.2–44.2"; at this ceiling the bottom can go no lower than ${lowestRealBottomIn(remodelDims(ctx).ceiling / inch(1), REAL).toFixed(1)}"). ` +
    'Bulb type and damp rating not stated by Nathan James.',
  defaultHangBottomIn: DEFAULT_HANG_IN,
  defaultFromWallIn: DEFAULT_FROM_WALL_IN,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const D = remodelDims(ctx);
    const ceiling = opts.ceilingIn != null ? inch(opts.ceilingIn) : D.ceiling;
    const bottom = statementBottom(opts, ceiling, DEFAULT_HANG_IN, REAL.realDropRangeIn[0]);
    const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX;
    const cz = opts.centreZIn != null ? inch(opts.centreZIn) : inch(DEFAULT_FROM_WALL_IN);
    const shadows = opts.shadows !== false;

    const group = new THREE.Group();
    group.name = 'light:belleville-rattan-pendant';
    group.position.set(cx, bottom, cz);
    const rimY = inch(DIFFUSER_DROP_IN);
    const shade = new THREE.Group();
    shade.position.y = rimY;
    group.add(shade);

    // Rattan: the texture pack's photo weave (map + normal + alpha holes,
    // docs/textures.md) when present, else a flat rattan colour.
    const named = tex(ctx, 'rattan');
    const rep = named ? physicalSize(ctx, 'rattan', WEAVE_REPEAT) : WEAVE_REPEAT;
    const normalT = named ? texCompanion(ctx, 'rattan', 'normal') : null;
    const alphaT = named ? texCompanion(ctx, 'rattan', 'alpha') : null;
    const rattan = new THREE.MeshStandardMaterial({
      color: named ? 0xffffff : 0xa98458,
      map: named ? repeatClone(THREE, named, true) : null,
      normalMap: normalT ? repeatClone(THREE, normalT, false) : null,
      alphaMap: alphaT ? repeatClone(THREE, alphaT, false) : null,
      roughness: 0.85, metalness: 0, side: THREE.DoubleSide, alphaTest: alphaT ? 0.5 : 0,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: named ? 0xd8c8b0 : 0x9c7a50, map: rattan.map, normalMap: rattan.normalMap, roughness: 0.9,
    });
    const brass = new THREE.MeshPhysicalMaterial({ color: 0xc2a064, metalness: 1, roughness: 0.32, clearcoat: 0.1, side: THREE.DoubleSide });

    // Dome + collar (one lathe), wrapped rim, collar rim.
    const prof = [...smoothProfile(THREE, DOME, 40), [2.6, SHADE_H_IN + 0.6], [2.65, SHADE_H_IN + COLLAR_H_IN - 0.3], [2.35, SHADE_H_IN + COLLAR_H_IN]];
    const domeGeo = weaveUV(latheIn(THREE, prof, { segments: 128 }), prof, rep, DOME[0][0]);
    const dome = addMesh(THREE, shade, domeGeo, rattan, { name: 'rattanDome', receive: true });
    dome.castShadow = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(inch(8.55), inch(0.22), 10, 128), rimMat);
    rim.rotation.x = Math.PI / 2; rim.castShadow = true; rim.name = 'rattanRim';
    shade.add(rim);
    const collarRim = new THREE.Mesh(new THREE.TorusGeometry(inch(2.4), inch(0.16), 8, 64), rimMat);
    collarRim.rotation.x = Math.PI / 2; collarRim.position.y = inch(SHADE_H_IN + COLLAR_H_IN); collarRim.castShadow = true;
    shade.add(collarRim);

    // Frosted diffuser bowl: lower half-ellipsoid below the rim (8" x 2.6"),
    // rising inside the dome to a brass fitter at 1.6" above the rim.  It
    // encloses the bulb completely.
    const bowl = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * (Math.PI / 2);                   // bottom pole -> equator
      bowl.push([DIFFUSER_R_IN * Math.sin(a), DIFFUSER_DROP_IN * (1 - Math.cos(a))]);
    }
    for (let i = 1; i <= 10; i++) {
      const a = (i / 10) * (Math.PI * 0.36);                // equator -> fitter
      bowl.push([DIFFUSER_R_IN * Math.cos(a), DIFFUSER_DROP_IN + 1.75 * Math.sin(a)]);
    }
    const bowlTop = bowl[bowl.length - 1];
    const frosted = glowingGlass(THREE, (v) => 0.55 + 0.45 * Math.exp(-((v - 0.62) ** 2) / (2 * 0.3 ** 2)),
      { color: 0xf2efe9, intensity: 1.0, roughness: 0.5, clearcoat: 0.3 });
    const bowlH = inch(bowlTop[1]);
    addMesh(THREE, group, heightUV(latheIn(THREE, bowl, { segments: 72 }), 0, bowlH), frosted.material,
      { name: 'frostedDiffuser', cast: false });
    // Brass fitter ring and a cap that closes the bowl top.
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(bowlTop[0] + 0.15), inch(bowlTop[0] + 0.15), inch(0.35), 48), brass,
      { y: bowlH + inch(0.15), name: 'fitter' });
    // Socket housing from the fitter up through the collar to the rod.
    const housingTop = inch(DIFFUSER_DROP_IN + SHADE_H_IN + COLLAR_H_IN);
    const hy0 = bowlH + inch(0.3);
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.5), inch(0.75), housingTop - hy0, 24), brass,
      { y: (hy0 + housingTop) / 2, name: 'socketHousing' });

    // Rods (6 / 6 / 12 / 12 sections; joints drawn where they meet) and canopy.
    const topY = ceiling - bottom;
    const canopyH = inch(0.9);
    const rodBot = housingTop;
    const rodLen = Math.max(mm(5), topY - canopyH - rodBot);
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.25), inch(0.25), rodLen, 16), brass, { y: rodBot + rodLen / 2, name: 'rod' });
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.36), inch(0.36), inch(0.6), 16), brass, { y: rodBot + inch(0.3) });
    for (let y = rodBot, k = 0; k < RODS_IN.length - 1; k++) {
      y += inch(RODS_IN[k]);
      if (y > topY - canopyH - inch(1)) break;
      addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.29), inch(0.29), inch(0.25), 16), brass, { y });
    }
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.3), inch(0.36), inch(0.7), 16), brass, { y: topY - canopyH - inch(0.35) });
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(2.3), inch(2.5), canopyH, 48), brass, { y: topY - canopyH / 2, name: 'canopy' });

    // Lights: bulb in the bowl, just above the rim.
    const candela = opts.candela ?? 4.5;
    const main = bulbLight(THREE, { candela, shadow: shadows, mapSize: 1024 });
    main.position.y = inch(DIFFUSER_DROP_IN + 0.4);
    group.add(main);
    const fill = bulbLight(THREE, { candela: candela * 0.3, shadow: false });
    fill.position.y = inch(DIFFUSER_DROP_IN + 2.5);
    group.add(fill);

    group.userData.size = { diameter: inch(SHADE_D_IN), height: inch(DIFFUSER_DROP_IN + SHADE_H_IN + COLLAR_H_IN) };
    finishFixture(group, [main, fill], [frosted.material]);
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); frosted.ramp.dispose(); };
    return group;
  },
};
