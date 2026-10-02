// buildMisc(ctx): towel ring + towel, GFCI outlet, thermostat and switches,
// framed flower photo in the recess, exhaust grille, recessed can (with its
// SpotLight), and the shampoo / tissue-box clutter in the column niches.
import * as THREE from 'three';
import { inch } from '../units.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { box, mesh, stdMaterials } from './util.js';

export function buildMisc(ctx) {
  const { MISC, ROOM, RECESS, COLUMN, WAINSCOT } = ctx.config;
  const std = stdMaterials();
  const g = new THREE.Group();
  g.name = 'misc';

  // ---- towel ring on the north drywall just east of the column (photo 37)
  {
    const ring = new THREE.Group();
    ring.name = 'towelRing';
    const { x, y } = MISC.towelRing;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.9), inch(0.9), inch(0.6), 20), std.chrome);
    post.rotation.x = Math.PI / 2;
    post.position.set(x, y, inch(0.3));
    ring.add(post);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(inch(0.5), inch(0.8), inch(1.4)), std.chrome);
    arm.position.set(x, y - inch(0.3), inch(1.2));
    ring.add(arm);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(inch(3.1), inch(0.16), 10, 48), std.chrome);
    torus.position.set(x, y - inch(3.6), inch(1.6));
    torus.castShadow = true;
    ring.add(torus);
    // dark navy waffle towel draped through the ring
    const towelMat = ctx.textures.material('curtain', { color: ctx.textures.has('curtain') ? 0x6f7a92 : 0x343b4c, roughness: 1 });
    const tw = inch(6), tl = inch(17);
    const geo = new THREE.PlaneGeometry(tw, tl, 6, 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = (p.getY(i) + tl / 2) / tl; // 0 bottom .. 1 top
      p.setZ(i, inch(0.8) * Math.sin(p.getX(i) / tw * Math.PI * 3) * (1 - v) + inch(1.2) * v * v);
    }
    geo.computeVertexNormals();
    const towel = mesh(geo, towelMat, { name: 'towel' });
    towel.material.side = THREE.DoubleSide;
    towel.position.set(x, y - inch(6.6) - tl / 2 + inch(3), inch(2.4));
    ring.add(towel);
    ring.traverse((o) => (o.castShadow = o.receiveShadow = true));
    g.add(ring);
  }

  // ---- device plates
  const plate = (w, h, name) => {
    const m = mesh(new THREE.BoxGeometry(w, h, inch(0.25)), std.whitePlastic, { name });
    return m;
  };
  const onNorth = (o, x, y) => (o.position.set(x, y, inch(0.125)), o);
  const onSouth = (o, x, y) => (o.position.set(x, y, ROOM.depth - inch(0.125)), o);
  const onRecessWest = (o, z, y) => (o.position.set(RECESS.x0 + inch(0.125), y, z), (o.rotation.y = Math.PI / 2), o);

  // GFCI outlet right of the mirror (photos 37, 52, 53)
  {
    const o = new THREE.Group();
    o.name = 'outlet_vanity';
    // Decora GFCI (photos 52, 53): bevelled wall plate, rectangular face with
    // two receptacles (two slots + a round-top ground each), TEST / RESET
    // buttons between them and a green LED; two plate screws.
    o.add(plate(inch(3.1), inch(4.9)));
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xf4f3ee, roughness: 0.35 });
    const face = new THREE.Mesh(new THREE.BoxGeometry(inch(1.32), inch(2.62), inch(0.2)), faceMat);
    face.position.z = inch(0.17);
    o.add(face);
    const zf = inch(0.275);
    const hole = (w, h, x, y) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, inch(0.02)), std.darkGap);
      m.position.set(x, y, zf);
      o.add(m);
    };
    for (const cy of [0.82, -0.82]) {
      hole(inch(0.07), inch(0.3), -inch(0.25), inch(cy + 0.08)); // neutral (taller)
      hole(inch(0.07), inch(0.24), inch(0.25), inch(cy + 0.08)); // hot
      const gnd = new THREE.Mesh(new THREE.CircleGeometry(inch(0.09), 12), std.darkGap);
      gnd.position.set(0, inch(cy - 0.24), zf + inch(0.011));
      o.add(gnd);
    }
    for (const [y, w] of [[0.16, 0.62], [-0.16, 0.62]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(inch(w), inch(0.22), inch(0.08)), faceMat);
      b.position.set(0, inch(y), zf + inch(0.02));
      o.add(b);
    }
    const led = new THREE.Mesh(new THREE.CircleGeometry(inch(0.035), 8), new THREE.MeshStandardMaterial({ color: 0x1d5a2a, emissive: 0x2bd14b, emissiveIntensity: 0.6 }));
    led.position.set(inch(0.5), -inch(1.12), zf + inch(0.011));
    o.add(led);
    for (const y of [2.15, -2.15]) {
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.09), inch(0.09), inch(0.04), 12), std.satinNickel);
      sc.rotation.x = Math.PI / 2;
      sc.position.set(0, inch(y), inch(0.14));
      o.add(sc);
    }
    g.add(onNorth(o, MISC.outlet.x, MISC.outlet.y));
  }
  // thermostat + 2-gang switch on the z = 70 wall east of the recess opening (photos 44, 49)
  {
    const t = new THREE.Group();
    t.name = 'thermostat';
    t.add(box(-inch(2.1), -inch(2.9), -inch(0.5), inch(2.1), inch(2.9), 0, std.whitePlastic));
    t.add(box(-inch(1.4), inch(0.1), inch(0.01) - inch(0.5) - inch(0.02), inch(1.4), inch(2.2), -inch(0.5), new THREE.MeshStandardMaterial({ color: 0x9aa39a, roughness: 0.3 })));
    g.add(onSouth(t, MISC.thermostat.x, MISC.thermostat.y));
    const s2 = new THREE.Group();
    s2.name = 'switch_2gang';
    s2.add(plate(inch(4.6), inch(4.6)));
    for (const dx of [-1.15, 1.15]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(inch(1.3), inch(2.6), inch(0.25)), std.whitePlastic);
      r.position.set(inch(dx), 0, -inch(0.2));
      s2.add(r);
    }
    g.add(onSouth(s2, MISC.switch2.x, MISC.switch2.y));
    const s1 = new THREE.Group();
    s1.name = 'switch_recess';
    s1.add(plate(inch(2.9), inch(4.6)));
    const r = new THREE.Mesh(new THREE.BoxGeometry(inch(1.3), inch(2.6), inch(0.25)), std.whitePlastic);
    r.position.z = inch(0.2);
    s1.add(r);
    g.add(onRecessWest(s1, MISC.switch1.z, MISC.switch1.y));
  }

  // ---- framed flower photo on the recess west wall (photos 45, 46)
  {
    const f = new THREE.Group();
    f.name = 'frame_flower';
    const s = MISC.frame.size, d = inch(1.4), bw = inch(1.6);
    const fr = std.black;
    f.add(box(-s / 2, -s / 2, 0, s / 2, -s / 2 + bw, d, fr));
    f.add(box(-s / 2, s / 2 - bw, 0, s / 2, s / 2, d, fr));
    f.add(box(-s / 2, -s / 2, 0, -s / 2 + bw, s / 2, d, fr));
    f.add(box(s / 2 - bw, -s / 2, 0, s / 2, s / 2, d, fr));
    f.add(box(-s / 2 + bw, -s / 2 + bw, inch(0.3), s / 2 - bw, s / 2 - bw, inch(0.35), new THREE.MeshStandardMaterial({ color: 0xece9e4, roughness: 0.8 })));
    const printMat = new THREE.MeshStandardMaterial({ color: 0x8c7f84, roughness: 0.7 });
    // the print itself, cropped from the reference photo of the frame
    new THREE.TextureLoader().load('photos/thumb/20261001_233623797_iOS.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(0.34, 0.45);
      tex.offset.set(0.31, 0.28);
      printMat.map = tex;
      printMat.color.set(0xffffff);
      printMat.needsUpdate = true;
    });
    const ps = s - 2 * bw - inch(3);
    const pg = new THREE.PlaneGeometry(ps, ps);
    pg.translate(0, 0, inch(0.37));
    f.add(new THREE.Mesh(pg, printMat));
    f.traverse((o) => (o.castShadow = o.receiveShadow = true));
    f.rotation.y = Math.PI / 2;
    f.position.set(RECESS.x0, MISC.frame.y, MISC.frame.z);
    g.add(f);
  }

  // ---- exhaust grille (photo 38)
  {
    const v = new THREE.Group();
    v.name = 'vent';
    const s = MISC.vent.size;
    v.add(box(-s / 2, -inch(0.3), -s / 2, s / 2, 0, s / 2, std.whitePlastic));
    for (let i = 0; i < 9; i++) {
      const z = -s / 2 + inch(1.4) + i * ((s - inch(2.8)) / 8);
      v.add(box(-s / 2 + inch(1.2), -inch(0.32), z - inch(0.18), s / 2 - inch(1.2), -inch(0.3), z + inch(0.18), std.darkGap));
    }
    v.position.set(MISC.vent.x, ROOM.ceiling, MISC.vent.z);
    g.add(v);
  }

  // ---- recessed can over the tub + its SpotLight
  {
    const c = new THREE.Group();
    c.name = 'recessedCan';
    const r = MISC.can.dia / 2;
    const trim = new THREE.Mesh(new THREE.TorusGeometry(r + inch(0.4), inch(0.35), 8, 40), std.whitePlastic);
    trim.rotation.x = Math.PI / 2;
    c.add(trim);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xfff1dc, emissiveIntensity: 2.0,
    }));
    lens.rotation.x = Math.PI / 2;
    lens.position.y = inch(0.05);
    c.add(lens);
    c.position.set(MISC.can.x, ROOM.ceiling - inch(0.05), MISC.can.z);
    g.add(c);
    const spot = new THREE.SpotLight(0xfff0dc, 6, 0, THREE.MathUtils.degToRad(52), 0.75, 2);
    spot.name = 'recessedCan_light';
    spot.position.set(MISC.can.x, ROOM.ceiling - inch(0.6), MISC.can.z);
    spot.target.position.set(MISC.can.x, 0, MISC.can.z);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0006;
    spot.shadow.normalBias = 0.015;
    spot.shadow.radius = 5;
    spot.shadow.camera.near = 0.1;
    g.add(spot, spot.target);
  }

  // ---- niche clutter (photos 26, 37): shampoo bottles, blue tissue box
  {
    const zMid = (COLUMN.nicheBackZ + COLUMN.z1) / 2;
    const colors = [0x1d1d22, 0x2a2a30, 0x5a2333, 0x3b6fb3, 0x6b4a2b];
    const heights = [9.5, 10, 9, 6.5, 8];
    let x = inch(3);
    colors.forEach((col, i) => {
      const h = inch(heights[i]);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(inch(1.15), inch(1.25), h, 16), new THREE.MeshStandardMaterial({ color: col, roughness: 0.25 }));
      b.position.set(x, COLUMN.ledgeTop + h / 2, zMid);
      b.castShadow = b.receiveShadow = true;
      g.add(b);
      x += inch(2.7);
    });
    // Tissue box (photo 37): blue printed carton with rounded edges, an oval
    // opening on top and a tissue puff standing out of it.
    const tb = new THREE.Group();
    tb.name = 'tissueBox';
    const tw = inch(9.4), th = inch(4.6), td = inch(4.6);
    const carton = new RoundedBoxGeometry(tw, th, td, 2, inch(0.12));
    tb.add(mesh(carton, new THREE.MeshStandardMaterial({ color: 0x5577b8, roughness: 0.55 })));
    const slot = new THREE.Mesh(new THREE.CircleGeometry(1, 24), std.darkGap);
    slot.scale.set(inch(2.6), inch(0.7), 1);
    slot.rotation.x = -Math.PI / 2;
    slot.position.y = th / 2 + inch(0.005);
    tb.add(slot);
    const puffGeo = new THREE.SphereGeometry(1, 16, 10);
    const pp = puffGeo.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      pp.setXYZ(i, x * inch(1.9) + Math.sin(y * 6) * inch(0.15), Math.max(0, y) * inch(2.1), z * inch(0.35) * (1 - Math.max(0, y) * 0.6));
    }
    puffGeo.computeVertexNormals();
    const puff = mesh(puffGeo, new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.95, side: THREE.DoubleSide }));
    puff.position.y = th / 2 - inch(0.1);
    puff.rotation.z = 0.12;
    tb.add(puff);
    tb.position.set(inch(21.3), COLUMN.niche2[0] + th / 2, COLUMN.nicheBackZ + inch(0.3) + td / 2);
    tb.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    g.add(tb);
  }
  return g;
}
