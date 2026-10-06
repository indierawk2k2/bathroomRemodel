// West Elm "Sculptural Globe Pendant", 13" shade, Milk glass, Antique Brass
// (br-cmo): one statement pendant hung in front of the mirror like the
// Monteaux.  Product page and photos:
// assets/source/lights/sculptural-globe-13-pendant/ (SOURCES.md).
//
// West Elm, 13" size: shade 13" diam. x 12.9" h, overall 22.8"-86.8" h
// (min / max hanging length), canopy 5" diam. x 0.75" h; damp rated; one
// E26 bulb (9 W LED / 60 W); dimmable.  The page offers only Antique Brass
// hardware.  From the milk-glass studio photo: a near-spherical opal globe
// with a short neck under a brass socket cup and a small round opening at
// the bottom, hung on a thin brass stem with a thicker sleeve above the
// cup.  The bulb sits at the globe centre, ~6" above the bottom opening, so
// it is only in view from almost directly underneath.
//
// build(ctx, { hangBottomIn = 77 (clamped to ceiling - 22.8", the shortest
//              real hang), centreXIn = 54, centreZIn = 15 (fixture centre,
//              world z), ceilingIn = 120, shadows = true })
// Default 77": the globe spans 77-89.9" (cup to ~91"), below the mirror
// top (98"); 15" off the wall (8.5" behind its back).
// Lights: 1 shadow-casting PointLight at the bulb (the glass does not cast)
// + 1 weak unshadowed fill.
import { remodelDims } from '../../remodel/cfg.js';
import { bulbLight, finishFixture, lowestRealBottomIn } from './common.js';
import { latheIn, glowingGlass, addMesh, statementBottom, heightUV, inch, mm } from './statement-parts.js';

const REAL = { realDropRangeIn: [22.8, 86.8] };   // West Elm 13": min / max hanging length (continuous)
const SHADE_D_IN = 13, SHADE_H_IN = 12.9;
const HOLE_R_IN = 1.7;                              // bottom opening (photo, ~3.4" across)
const NECK_R_IN = 1.05;                             // top neck under the socket cup
const DEFAULT_HANG_IN = 77;
const DEFAULT_FROM_WALL_IN = 15;

/** Globe outer profile (r, y), bottom opening to neck, inches. */
function globeProfile() {
  const R = SHADE_D_IN / 2;
  const yb = Math.sqrt(R * R - HOLE_R_IN * HOLE_R_IN);     // centre height above the hole rim
  const neckY = Math.sqrt(R * R - NECK_R_IN * NECK_R_IN);
  const cy = yb;                                            // hole rim at y = 0
  const pts = [[HOLE_R_IN - 0.12, 0.05], [HOLE_R_IN, 0]];   // rounded lip
  const a0 = Math.asin(HOLE_R_IN / R), a1 = Math.PI - Math.asin(NECK_R_IN / R);
  for (let i = 1; i < 40; i++) {
    const a = a0 + (a1 - a0) * (i / 40);
    pts.push([R * Math.sin(a), cy - R * Math.cos(a)]);
  }
  pts.push([NECK_R_IN, cy + neckY]);
  pts.push([NECK_R_IN, SHADE_H_IN]);                       // short neck up to 12.9"
  return pts;
}

export default {
  id: 'sculptural-globe-13-pendant',
  name: 'West Elm Sculptural Globe pendant 13", milk glass',
  order: 22,
  ...REAL,
  description: (ctx) => '13" x 12.9" milk-glass globe on an Antique Brass stem and 5" canopy (hang 22.8–86.8"; at this ceiling the bottom can go ' +
    `no lower than ${lowestRealBottomIn(remodelDims(ctx).ceiling / inch(1), REAL).toFixed(1)}"), damp rated, E26. Small opening at the bottom; the bulb sits 6" above it.`,
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
    group.name = 'light:sculptural-globe-13-pendant';
    group.position.set(cx, bottom, cz);
    const H = inch(SHADE_H_IN);

    // Milk glass: glossy white, glowing evenly with a soft peak at the bulb
    // (globe centre) and a darker neck.
    const milk = glowingGlass(THREE, (v) => 0.5 + 0.5 * Math.exp(-((v - 0.48) ** 2) / (2 * 0.3 ** 2)),
      { color: 0xf5f2ee, intensity: 0.8, roughness: 0.1, clearcoat: 1 });
    // Inside face (seen through the bottom opening): lit directly, brighter.
    const inside = glowingGlass(THREE, (v) => 0.7 + 0.3 * Math.exp(-((v - 0.5) ** 2) / (2 * 0.35 ** 2)),
      { color: 0xf7f3ec, intensity: 0.6, roughness: 0.6, clearcoat: 0, side: THREE.BackSide });
    const brass = new THREE.MeshPhysicalMaterial({ color: 0xb08d56, metalness: 1, roughness: 0.36, clearcoat: 0.1, side: THREE.DoubleSide });

    const prof = globeProfile();
    const outer = heightUV(latheIn(THREE, prof, { segments: 96 }), 0, H);
    const shell = addMesh(THREE, group, outer, milk.material, { name: 'milkGlobe', cast: false });
    shell.material.side = THREE.FrontSide;
    // Inner wall, 3 mm in, drawn back-face only.
    const innerProf = prof.map(([r, y]) => [Math.max(0, r - 0.12), y]);
    addMesh(THREE, group, heightUV(latheIn(THREE, innerProf, { segments: 96 }), 0, H), inside.material,
      { name: 'milkGlobeInside', cast: false });

    // Socket cup on the neck, sleeve, thin stem, swivel, canopy.
    const cupH = inch(1.3), cupR = inch(0.78);
    addMesh(THREE, group, new THREE.CylinderGeometry(cupR, cupR * 1.08, cupH, 32), brass, { y: H - inch(0.35) + cupH / 2, name: 'socketCup' });
    const cupTop = H - inch(0.35) + cupH;
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.3), cupR * 0.9, inch(0.25), 24), brass, { y: cupTop + inch(0.12) });
    const sleeveL = inch(7);
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.22), inch(0.22), sleeveL, 16), brass, { y: cupTop + inch(0.25) + sleeveL / 2, name: 'sleeve' });
    const topY = ceiling - bottom;
    const canopyH = inch(0.75);
    const stemBot = cupTop + inch(0.25) + sleeveL;
    const stemLen = Math.max(mm(5), topY - canopyH - stemBot);
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.11), inch(0.11), stemLen, 10), brass, { y: stemBot + stemLen / 2, name: 'stem' });
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(0.25), inch(0.25), inch(0.5), 16), brass, { y: topY - canopyH - inch(0.25) });
    addMesh(THREE, group, new THREE.CylinderGeometry(inch(2.45), inch(2.5), canopyH, 48), brass, { y: topY - canopyH / 2, name: 'canopy' });

    // Light at the globe centre; no bulb mesh.
    const candela = opts.candela ?? 4.2;
    const main = bulbLight(THREE, { candela, shadow: shadows, mapSize: 1024 });
    main.position.y = inch(6.4);
    group.add(main);
    const fill = bulbLight(THREE, { candela: candela * 0.2, shadow: false });
    fill.position.y = inch(5);
    group.add(fill);

    group.userData.size = { diameter: inch(SHADE_D_IN), height: H };
    finishFixture(group, [main, fill], [milk.material, inside.material]);
    const dispose = group.userData.dispose;
    group.userData.dispose = () => { dispose(); milk.ramp.dispose(); inside.ramp.dispose(); };
    return group;
  },
};
