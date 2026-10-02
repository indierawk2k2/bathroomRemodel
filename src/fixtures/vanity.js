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
  // Photo 52: a flat chrome band (~1.3" wide, 3/8" thick) rises from a
  // square foot and arcs forward and down into an open waterfall outlet; a
  // square lever block sits on the right side of the riser.
  const fz = inch(3.0), fy = V.height;
  {
    const f = new THREE.Group();
    f.name = 'vanity_faucet';
    const bandW = inch(1.2), t = inch(0.36);
    // Centre line in (z, y): straight riser, then an arc over the top that
    // ends pointing down-forward (the waterfall outlet).  A rectangular
    // section is swept along it with smooth normals on each face so the
    // chrome reflection runs cleanly around the bend.
    const Rm = inch(2.15), cy = inch(5.0), a1 = -0.42;
    const line = [];
    for (let i = 0; i <= 6; i++) line.push({ z: -Rm, y: (cy * i) / 6, nz: -1, ny: 0 });
    for (let i = 1; i <= 40; i++) {
      const a = Math.PI + ((a1 - Math.PI) * i) / 40;
      line.push({ z: Rm * Math.cos(a), y: cy + Rm * Math.sin(a), nz: Math.cos(a), ny: Math.sin(a) });
    }
    const pos = [], nrm = [], idx = [];
    const ring = (side) => {
      // side: 0 outer (+n), 1 inner (-n), 2 +x, 3 -x ; returns base index
      const base = pos.length / 3;
      for (const p of line) {
        const ox = p.nz * t / 2, oy = p.ny * t / 2;
        const corners = side === 0 ? [[-1, 1], [1, 1]] : side === 1 ? [[1, -1], [-1, -1]] : side === 2 ? [[1, 1], [1, -1]] : [[-1, -1], [-1, 1]];
        for (const [sx, sn] of corners) {
          pos.push(sx * bandW / 2, p.y + sn * oy, p.z + sn * ox);
          if (side === 0) nrm.push(0, p.ny, p.nz);
          else if (side === 1) nrm.push(0, -p.ny, -p.nz);
          else nrm.push(side === 2 ? 1 : -1, 0, 0);
        }
      }
      for (let i = 0; i < line.length - 1; i++) {
        const a = base + i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    };
    for (let s = 0; s < 4; s++) ring(s);
    // outlet cap (the bottom end of the riser sits in the base)
    {
      const p = line[line.length - 1], base = pos.length / 3;
      const tz = p.ny, ty = -p.nz;               // direction of travel at the end (clockwise)
      for (const [sx, sn] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        pos.push(sx * bandW / 2, p.y + sn * p.ny * t / 2, p.z + sn * p.nz * t / 2);
        nrm.push(0, ty, tz);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    sg.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    sg.setIndex(idx);
    const spout = mesh(sg, std.chrome, { name: 'faucet_spout' });
    spout.position.set(V.sinkX, fy + inch(0.55), fz + Rm);
    f.add(spout);
    // square foot + escutcheon
    f.add(box(V.sinkX - inch(0.85), fy, fz - inch(0.85), V.sinkX + inch(0.85), fy + inch(0.55), fz + inch(0.85), std.chrome, { name: 'faucet_base' }));
    // side lever: square boss on the riser + a short square handle to the right
    const ly = fy + inch(2.1);
    f.add(box(V.sinkX + bandW / 2, ly - inch(0.45), fz - inch(0.45), V.sinkX + bandW / 2 + inch(0.55), ly + inch(0.45), fz + inch(0.45), std.chrome, { name: 'faucet_boss' }));
    f.add(box(V.sinkX + bandW / 2 + inch(0.55), ly - inch(0.22), fz - inch(0.3), V.sinkX + bandW / 2 + inch(1.9), ly + inch(0.22), fz + inch(0.3), std.chrome, { name: 'faucet_lever' }));
    f.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    g.add(f);
  }

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
  // Lathe profiles: [radius, height] pairs in inches, bottom to top.
  const lathe = (profile, mat, x, z, y0 = V.height, segs = 32) => {
    const pts = profile.map(([r, h]) => new THREE.Vector2(inch(r), inch(h)));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, segs), mat);
    m.position.set(x, y0, z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  /** Pump head: collar + stem + nozzle head pointing toward +z (the room). */
  const pump = (x, z, top, mat, r = 0.42) => {
    lathe([[0, 0], [r, 0], [r, 0.55], [r * 0.85, 0.62], [0.13, 0.62], [0.13, 1.3], [0, 1.3]], mat, x, z, V.height + inch(top));
    g.add(box(x - inch(0.28), V.height + inch(top + 1.25), z - inch(0.3), x + inch(0.28), V.height + inch(top + 1.65), z + inch(0.95), mat));
  };
  const plastic = (color, rough = 0.3) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: 0.4, clearcoatRoughness: 0.2 });
  // orange hand soap: round shoulder, short neck
  lathe([[0, 0], [1.05, 0], [1.2, 0.15], [1.22, 3.6], [1.1, 4.4], [0.7, 4.9], [0.5, 5.1], [0.5, 5.45], [0, 5.45]],
    plastic(0xe39a66, 0.25), inch(41.5), inch(5));
  pump(inch(41.5), inch(5), 5.45, std.whitePlastic);
  // glass dispenser with a satin-nickel pump (transmission is off: the
  // tinted clear look reads fine and stays cheap with a planar mirror)
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xd9e3e1, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.55,
    clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false });
  lathe([[0, 0], [1.1, 0], [1.2, 0.2], [1.2, 3.4], [1.05, 4.0], [0.55, 4.25], [0.55, 4.5], [0, 4.5]], glass, inch(45.5), inch(4.5));
  lathe([[0, 0], [1.0, 0], [1.02, 2.4], [0, 2.4]], plastic(0xc9c3a4, 0.4), inch(45.5), inch(4.5), V.height + inch(0.25)); // liquid
  pump(inch(45.5), inch(4.5), 4.5, std.satinNickel, 0.5);
  // yellow lotion (photo 52): taller, slightly oval body, white pump
  {
    const b = lathe([[0, 0], [1.0, 0], [1.15, 0.2], [1.2, 5.4], [1.05, 6.1], [0.55, 6.4], [0.55, 6.6], [0, 6.6]],
      plastic(0xf1df8e, 0.35), inch(66.5), inch(4.5));
    b.scale.set(1.15, 1, 0.8);
    lathe([[0, 0], [1.2, 0], [1.2, 3.2], [0, 3.2]], new THREE.MeshStandardMaterial({ color: 0xf6f2e6, roughness: 0.6 }), inch(66.5), inch(4.5), V.height + inch(1.4)).scale.set(1.16, 1, 0.81); // label band
    pump(inch(66.5), inch(4.5), 6.6, std.whitePlastic);
  }
  // brown ceramic toothbrush cup, tapered, with a rim
  lathe([[0, 0], [0.95, 0], [1.0, 0.15], [1.2, 3.5], [1.25, 3.6], [1.14, 3.6], [1.0, 0.4], [0, 0.4]],
    new THREE.MeshPhysicalMaterial({ color: 0x7a6040, roughness: 0.35, clearcoat: 0.6 }), inch(63.5), inch(4));
  return g;
}
