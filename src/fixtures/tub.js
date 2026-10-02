// buildTub(ctx): 60" x 30" white enamel apron tub (x 0..30, z 10..70, rim 16")
// plus the chrome head / valve / spout on the alcove end wall (photo 13).
import * as THREE from 'three';
import { inch } from '../units.js';
import { roundedRectShape, roundedRectRing, loftRings, ringCap, mesh, box, stdMaterials } from './util.js';

export function buildTub(ctx) {
  const { TUB, PLUMBING, ROOM, WAINSCOT } = ctx.config;
  const std = stdMaterials();
  const g = new THREE.Group();
  g.name = 'tub';
  const enamel = std.porcelain.clone();
  enamel.side = THREE.DoubleSide;

  const w = TUB.x1 - TUB.x0, l = TUB.z1 - TUB.z0;
  const cx = (TUB.x0 + TUB.x1) / 2, cz = (TUB.z0 + TUB.z1) / 2;
  const bev = inch(0.6);
  // basin opening: 22" x 50", r 6", nudged off the apron so the apron rim is wider
  const bw = inch(22), bl = inch(50), br = inch(6), bcx = cx - inch(0.5);

  // Shell: rounded-rect outline with the basin hole, extruded up with a
  // bevel that forms the rolled rim.  Shape coords are (x, -z).
  const shape = roundedRectShape(w - 2 * bev, l - 2 * bev, inch(1.2), cx, -cz);
  const hole = roundedRectShape(bw + 2 * bev, bl + 2 * bev, br + bev, bcx, -cz, new THREE.Path());
  shape.holes.push(hole);
  const shell = new THREE.ExtrudeGeometry(shape, {
    depth: TUB.rim - 2 * bev,
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 5,
    curveSegments: 12,
  });
  shell.rotateX(-Math.PI / 2); // extrusion now goes up +Y; shape (x,-z) -> (x, z)
  shell.translate(0, bev, 0);
  g.add(mesh(shell, enamel, { name: 'tub_shell' }));

  // Basin: loft from the rim opening down to a flat floor 2" above the
  // tub base, vertical at the top and rounding into the floor.
  const top = TUB.rim - inch(0.25), depth = inch(13.5);
  const rings = [];
  const K = 14, Rb = inch(4.5), taper = inch(1.2);
  for (let k = 0; k <= K; k++) {
    const th = (k / K) * (Math.PI / 2);
    const inset = Rb * (1 - Math.cos(th)) + taper * Math.sin(th);
    const y = top - depth * Math.sin(th);
    const pts = roundedRectRing(bw - 2 * inset, bl - 2 * inset, Math.max(inch(1.5), br - inset * 0.7), 72);
    rings.push({ pts: pts.map((p) => new THREE.Vector2(p.x + bcx, p.y + cz)), y });
  }
  g.add(mesh(loftRings(rings), enamel, { name: 'tub_basin', cast: false }));
  const last = rings[rings.length - 1];
  g.add(mesh(ringCap(last.pts, last.y), enamel, { name: 'tub_floor', cast: false }));

  // drain + overflow at the plumbing (south) end
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(inch(1.4), inch(1.4), inch(0.12), 24), std.chrome);
  drain.position.set(bcx, last.y + inch(0.06), TUB.z1 - inch(8));
  g.add(drain);
  const ovf = new THREE.Mesh(new THREE.CylinderGeometry(inch(1.3), inch(1.3), inch(0.3), 24), std.chrome);
  ovf.rotation.x = Math.PI / 2;
  ovf.position.set(bcx, top - inch(4.5), cz + bl / 2 - inch(0.05));
  g.add(ovf);

  // ---- plumbing on the end wall (tile face at z = 70 - 13 mm)
  const zw = ROOM.depth - WAINSCOT.proud;
  const px = PLUMBING.x;
  // spout: square-section chrome, 6" out with a down-turned lip (photo 13)
  g.add(box(px - inch(0.7), PLUMBING.spout - inch(0.6), zw - inch(6), px + inch(0.7), PLUMBING.spout + inch(0.6), zw, std.chrome, { name: 'tub_spout' }));
  g.add(box(px - inch(0.7), PLUMBING.spout - inch(1.3), zw - inch(6), px + inch(0.7), PLUMBING.spout - inch(0.6), zw - inch(5.2), std.chrome));
  // valve: square trim plate + paddle lever
  g.add(box(px - inch(3.25), PLUMBING.valve - inch(3.25), zw - inch(0.35), px + inch(3.25), PLUMBING.valve + inch(3.25), zw, std.chrome, { name: 'tub_valve' }));
  g.add(box(px - inch(0.6), PLUMBING.valve - inch(0.6), zw - inch(2.2), px + inch(0.6), PLUMBING.valve + inch(0.6), zw - inch(0.35), std.chrome));
  g.add(box(px - inch(0.5), PLUMBING.valve - inch(0.35), zw - inch(2.6), px + inch(3.6), PLUMBING.valve + inch(0.35), zw - inch(1.8), std.chrome));
  // shower arm + square head
  const arm = new THREE.CatmullRomCurve3([
    new THREE.Vector3(px, PLUMBING.head + inch(3), zw),
    new THREE.Vector3(px, PLUMBING.head + inch(2.6), zw - inch(4)),
    new THREE.Vector3(px, PLUMBING.head + inch(1.2), zw - inch(7)),
  ]);
  g.add(mesh(new THREE.TubeGeometry(arm, 12, inch(0.4), 10), std.chrome, { name: 'shower_arm' }));
  g.add(mesh(new THREE.CylinderGeometry(inch(1.4), inch(1.4), inch(0.3), 24).rotateX(Math.PI / 2).translate(px, PLUMBING.head + inch(3), zw - inch(0.15)), std.chrome));
  const head = new THREE.Mesh(new THREE.BoxGeometry(inch(4.2), inch(0.7), inch(4.2)), std.chrome);
  head.position.set(px, PLUMBING.head + inch(0.9), zw - inch(7.6));
  head.rotation.x = 0.55;
  head.castShadow = true;
  g.add(head);
  return g;
}
