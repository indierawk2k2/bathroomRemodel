// buildVanity(ctx): 36" grey wood-grain laminate cabinet (x 36..72, z 0..21,
// 35" incl. top), three-piece drawer band + two doors (photo 37), 1.25"
// speckled quartz top with an undermount oval sink, chrome faucet (photo 52),
// towel bar on the west side (photo 34), TP holder on the east side.
import * as THREE from 'three';
import { inch } from '../units.js';
import { box, mesh, boxUV, stdMaterials } from './util.js';

export function buildVanity(ctx) {
  const { VANITY: V } = ctx.config;
  const { textures } = ctx;
  const std = stdMaterials();
  const g = new THREE.Group();
  g.name = 'vanity';

  const wood = textures.material('vanity_wood', { roughness: 0.55 });
  const quartz = textures.material('quartz', { roughness: 0.22 });
  const knobMat = new THREE.MeshStandardMaterial({ color: 0x8a8781, metalness: 1, roughness: 0.35 });
  const sinkMat = std.porcelain.clone();
  sinkMat.side = THREE.DoubleSide;

  const caseTop = V.height - V.topThickness; // 33.75"
  const frontT = inch(0.75);
  const zFront = V.z1; // face of the doors
  const zCase = V.z1 - frontT;
  const gap = inch(0.125);

  // carcass + recessed toe kick.  Solid only up to the drawer band; above
  // that just sides + back so the undermount bowl is not buried in it.
  const bandH = inch(6);
  const bandY0 = caseTop - bandH;
  const side = inch(0.75);
  g.add(box(V.x0, V.toeKick, V.z0, V.x1, bandY0 - inch(0.5), zCase, wood, { name: 'vanity_case' }));
  g.add(box(V.x0, bandY0 - inch(0.5), V.z0, V.x0 + side, caseTop, zCase, wood));
  g.add(box(V.x1 - side, bandY0 - inch(0.5), V.z0, V.x1, caseTop, zCase, wood));
  g.add(box(V.x0 + side, bandY0 - inch(0.5), V.z0, V.x1 - side, caseTop, V.z0 + side, wood));
  g.add(box(V.x0 + side, bandY0 - inch(0.5), zCase - side, V.x1 - side, caseTop, zCase, wood));
  g.add(box(V.x0 + inch(0.5), 0, V.z0, V.x1 - inch(0.5), V.toeKick, zCase - inch(1), std.darkGap, { name: 'vanity_toekick' }));

  // fronts.  Photo 37: top band splits ~8.5" / 18.5" / 9"; doors meet in the middle.
  const front = (x0, y0, x1, y1, name) =>
    g.add(box(x0 + gap / 2, y0 + gap / 2, zCase, x1 - gap / 2, y1 - gap / 2, zFront, wood, { name }));
  const xA = V.x0 + inch(8.5), xB = V.x1 - inch(9);
  front(V.x0, bandY0, xA, caseTop, 'vanity_drawer_l');
  front(xA, bandY0, xB, caseTop, 'vanity_band_c');
  front(xB, bandY0, V.x1, caseTop, 'vanity_drawer_r');
  const mid = (V.x0 + V.x1) / 2;
  front(V.x0, V.toeKick, mid, bandY0, 'vanity_door_l');
  front(mid, V.toeKick, V.x1, bandY0, 'vanity_door_r');
  // dark reveal behind the gaps
  g.add(box(V.x0 + inch(0.2), V.toeKick + inch(0.2), zCase - inch(0.01), V.x1 - inch(0.2), caseTop - inch(0.1), zCase + inch(0.02), std.darkGap));

  // small square knobs
  const knob = (x, y) => {
    g.add(box(x - inch(0.45), y - inch(0.45), zFront, x + inch(0.45), y + inch(0.45), zFront + inch(0.15), knobMat));
    g.add(box(x - inch(0.2), y - inch(0.2), zFront, x + inch(0.2), y + inch(0.2), zFront + inch(0.8), knobMat));
    g.add(box(x - inch(0.5), y - inch(0.5), zFront + inch(0.8), x + inch(0.5), y + inch(0.5), zFront + inch(1.05), knobMat));
  };
  const by = bandY0 + bandH / 2;
  knob(xA - inch(1.5), by);
  knob(xB + inch(4.5), by);
  knob(mid - inch(2), bandY0 - inch(2.5));
  knob(mid + inch(2), bandY0 - inch(2.5));

  // ---- quartz top with the sink cut-out (shape coords: x, -z)
  const tx0 = V.x0 - V.overhangSide, tx1 = V.x1 + V.overhangSide, tz1 = V.z1 + V.overhangFront;
  const shape = new THREE.Shape();
  shape.moveTo(tx0, 0);
  shape.lineTo(tx1, 0);
  shape.lineTo(tx1, -tz1);
  shape.lineTo(tx0, -tz1);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absellipse(V.sinkX, -V.sinkZ, V.sinkW / 2, V.sinkD / 2, 0, Math.PI * 2, false);
  shape.holes.push(hole);
  const eb = inch(0.08);
  const topGeo = new THREE.ExtrudeGeometry(shape, {
    depth: V.topThickness - 2 * eb, bevelEnabled: true, bevelThickness: eb, bevelSize: eb * 0.6, bevelSegments: 2, curveSegments: 48,
  });
  topGeo.rotateX(-Math.PI / 2);
  topGeo.translate(0, caseTop + eb, 0);
  g.add(mesh(boxUV(topGeo), quartz, { name: 'vanity_top' }));

  // undermount oval bowl (lower half-ellipsoid) + drain
  const bowl = new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  bowl.scale(V.sinkW / 2 - inch(0.15), inch(6), V.sinkD / 2 - inch(0.15));
  bowl.translate(V.sinkX, caseTop + inch(0.05), V.sinkZ);
  g.add(mesh(bowl, sinkMat, { name: 'vanity_sink', cast: false }));
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.8), inch(0.8), inch(0.1), 20), std.chrome);
  drain.position.set(V.sinkX, caseTop - inch(5.9), V.sinkZ);
  g.add(drain);

  // ---- faucet: square-ish loop spout + side lever (photo 52)
  const fz = inch(3.2), fy = V.height;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.95), inch(1.05), inch(1.0), 24), std.chrome);
  base.position.set(V.sinkX, fy + inch(0.5), fz);
  g.add(base);
  const spout = new THREE.CatmullRomCurve3([
    new THREE.Vector3(V.sinkX, fy + inch(0.9), fz),
    new THREE.Vector3(V.sinkX, fy + inch(5.5), fz - inch(0.2)),
    new THREE.Vector3(V.sinkX, fy + inch(7.6), fz + inch(1.6)),
    new THREE.Vector3(V.sinkX, fy + inch(7.0), fz + inch(4.0)),
    new THREE.Vector3(V.sinkX, fy + inch(5.2), fz + inch(4.9)),
  ]);
  const spoutGeo = new THREE.TubeGeometry(spout, 40, inch(0.42), 14);
  spoutGeo.scale(1.35, 1, 1); // flattened ribbon look
  spoutGeo.translate(-V.sinkX * 0.35, 0, 0);
  g.add(mesh(spoutGeo, std.chrome, { name: 'vanity_faucet' }));
  g.add(box(V.sinkX + inch(0.6), fy + inch(1.8), fz - inch(0.6), V.sinkX + inch(3.0), fy + inch(2.6), fz + inch(0.6), std.chrome));
  g.add(box(V.sinkX + inch(0.4), fy + inch(1.0), fz - inch(0.5), V.sinkX + inch(1.3), fy + inch(3.2), fz + inch(0.5), std.chrome));

  // ---- towel bar on the west side (photo 34) and TP holder on the east side (photo 37)
  const tbY = inch(30);
  for (const z of [inch(4), inch(17)]) {
    g.add(box(V.x0 - inch(1.6), tbY - inch(0.3), z - inch(0.3), V.x0, tbY + inch(0.3), z + inch(0.3), std.chrome));
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.3), inch(0.3), inch(14), 12), std.chrome);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(V.x0 - inch(1.6), tbY, inch(10.5));
  g.add(bar);
  const tpY = inch(26), tpZ = inch(14);
  g.add(box(V.x1, tpY - inch(0.4), tpZ - inch(3), V.x1 + inch(0.4), tpY + inch(0.4), tpZ + inch(0.6), std.chrome));
  const tpArm = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.25), inch(0.25), inch(5), 12), std.chrome);
  tpArm.rotation.x = Math.PI / 2;
  tpArm.position.set(V.x1 + inch(2.6), tpY, tpZ - inch(1.5));
  g.add(tpArm);
  g.add(box(V.x1, tpY - inch(0.25), tpZ - inch(2.6), V.x1 + inch(2.6), tpY + inch(0.25), tpZ - inch(2.1), std.chrome));
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(inch(2.2), inch(2.2), inch(4.2), 28), std.whitePlastic);
  roll.rotation.x = Math.PI / 2;
  roll.position.set(V.x1 + inch(2.6), tpY - inch(1.5), tpZ - inch(1.5));
  roll.castShadow = roll.receiveShadow = true;
  g.add(roll);

  // ---- counter clutter from photo 37 (soap pump, glass dispenser, cup, lotion)
  const bottle = (x, z, r, h, color, opts = {}) => {
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: opts.rough ?? 0.15, transmission: opts.glass ? 0.6 : 0, thickness: 0.01 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), m);
    b.position.set(x, V.height + h / 2, z);
    b.castShadow = b.receiveShadow = true;
    g.add(b);
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, inch(1.6), 12), opts.pumpMat || std.whitePlastic);
    pump.position.set(x, V.height + h + inch(0.8), z);
    g.add(pump);
  };
  bottle(inch(41.5), inch(5), inch(1.25), inch(5.5), 0xe9a678);
  bottle(inch(45.5), inch(4.5), inch(1.2), inch(4.5), 0xdfe6e6, { glass: true, pumpMat: std.satinNickel });
  bottle(inch(66.5), inch(4.5), inch(1.2), inch(6.5), 0xf2e2a0, { rough: 0.4 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(inch(1.2), inch(1.0), inch(3.6), 20), new THREE.MeshStandardMaterial({ color: 0x7a6544, roughness: 0.35 }));
  cup.position.set(inch(63.5), V.height + inch(1.8), inch(4));
  cup.castShadow = true;
  g.add(cup);
  return g;
}
