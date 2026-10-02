// Pair of allen+roth "Harlan" 2-light brass sconces (photos 02-04):
// rectangular brushed-brass backplate, short arm, central brass collar
// holding one up-facing and one down-facing filament bulb, all inside a
// single fluted (ribbed) clear-glass cylinder ~4.25" x 14".
//
// build(ctx, { hangBottomIn = 59 (glass bottom; SPEC centre 66"),
//              centreXIn = 55, spacingIn = 16 (each side of centre),
//              surfaceOffsetM = 0 (accent finish face), shadows = true })
// Lights: one shadow-casting PointLight per sconce at the collar.
import { remodelDims, warmWhite } from '../../remodel/cfg.js';
import { bulbLight, glowMaterial, finishFixture, inch, mm } from './common.js';

function flutedCylinder(THREE, R, H, ribs = 36, amp = mm(1.6)) {
  const per = 8, seg = ribs * per;
  const g = new THREE.CylinderGeometry(R, R, H, seg, 1, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const th = Math.atan2(z, x);
    const f = (((th / (Math.PI * 2)) * ribs) % 1 + 1) % 1;
    const r = R - amp + amp * Math.sqrt(Math.max(0, 1 - (2 * f - 1) ** 2));
    const k = r / Math.hypot(x, z);
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function sconce(THREE, mats, glowMat, shadows, candela) {
  const s = new THREE.Group();
  const GR = inch(2.125), GH = inch(14);
  const plateW = inch(2.6), plateH = inch(5.2), plateD = inch(0.75);
  const glassZ = plateD + inch(0.45) + GR;

  // Backplate (rounded box via extruded rounded rect).
  {
    const r = mm(3), w = plateW, h = plateH;
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2 + r, -h / 2); sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const g = new THREE.ExtrudeGeometry(sh, { depth: plateD - mm(2), bevelEnabled: true, bevelThickness: mm(1), bevelSize: mm(1), bevelSegments: 2, curveSegments: 4 });
    const m = new THREE.Mesh(g, mats.brass);
    m.position.z = mm(1);
    m.castShadow = m.receiveShadow = true;
    m.name = 'backplate';
    s.add(m);
    // Two tiny set screws on the plate's sides (photo 04).
    const sg = new THREE.CylinderGeometry(mm(2.2), mm(2.2), mm(2), 10);
    sg.rotateX(Math.PI / 2);
    for (const sy of [-1, 1]) {
      const sc = new THREE.Mesh(sg, mats.brass);
      sc.position.set(0, sy * plateH * 0.38, plateD + mm(1));
      s.add(sc);
    }
  }
  // Arm (square tube) from plate to collar.
  {
    const len = glassZ - plateD;
    const m = new THREE.Mesh(new THREE.BoxGeometry(inch(0.55), inch(0.55), len), mats.brass);
    m.position.set(0, 0, plateD + len / 2);
    m.castShadow = true;
    s.add(m);
  }
  // Collar (does not cast shadows: the light sits inside it).
  {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(inch(1.1), inch(1.1), inch(3.0), 32), mats.brass);
    m.position.z = glassZ;
    m.name = 'collar';
    s.add(m);
    for (const sy of [-1, 1]) {        // glass-retaining thumb screws
      const k = new THREE.Mesh(new THREE.SphereGeometry(mm(3.2), 10, 8), mats.brass);
      k.position.set(-inch(1.1) - mm(5), sy * inch(0.8), glassZ);
      s.add(k);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(mm(1), mm(1), mm(8), 6), mats.brass);
      st.rotation.z = Math.PI / 2; st.position.set(-inch(1.1) - mm(2), sy * inch(0.8), glassZ);
      s.add(st);
    }
    for (const sy of [-1, 1]) {        // socket necks
      const n = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.45), inch(0.5), inch(0.9), 20), mats.brass);
      n.position.set(0, sy * inch(1.95), glassZ);
      s.add(n);
    }
  }
  // Filament bulbs: clear envelope + glowing filaments.
  for (const sy of [-1, 1]) {
    const env = new THREE.Mesh(new THREE.SphereGeometry(inch(0.95), 20, 14), mats.bulbGlass);
    env.scale.set(1, 1.35, 1);
    env.position.set(0, sy * inch(3.7), glassZ);
    s.add(env);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const f = new THREE.Mesh(new THREE.CylinderGeometry(mm(0.7), mm(0.7), inch(1.4), 4), glowMat);
      f.position.set(Math.cos(a) * mm(4), sy * inch(3.7), glassZ + Math.sin(a) * mm(4));
      f.castShadow = false;
      f.name = 'filament';
      s.add(f);
    }
  }
  // Fluted glass cylinder.
  {
    const m = new THREE.Mesh(flutedCylinder(THREE, GR, GH), mats.glass);
    m.position.z = glassZ;
    m.name = 'ribbedGlass';
    m.renderOrder = 2;
    s.add(m);
    // Polished rim rings top and bottom catch the light (photo 02).
    for (const sy of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(GR - mm(0.8), mm(1.4), 6, 64), mats.rim);
      r.rotation.x = Math.PI / 2; r.position.set(0, sy * GH / 2, glassZ);
      s.add(r);
    }
  }
  const l = bulbLight(THREE, { candela, shadow: shadows, mapSize: 512 });
  l.position.set(0, 0, glassZ + inch(1.2));
  s.add(l);
  s.userData.light = l;
  s.userData.glassZ = glassZ;
  return s;
}

export default {
  id: 'harlan-sconces',
  name: 'Harlan brass sconces, ribbed glass (pair)',
  order: 30,
  description: 'Two 2-light brass sconces with fluted clear glass, x = 55 +/- 16"',
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const D = remodelDims(ctx);
    const GH = inch(14);
    const bottom = opts.hangBottomIn != null ? inch(opts.hangBottomIn) : inch(66) - GH / 2;
    const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX;
    const spacing = inch(opts.spacingIn ?? 16);
    const surface = opts.surfaceOffsetM ?? 0;
    const shadows = opts.shadows !== false;

    const group = new THREE.Group();
    group.name = 'light:harlan-sconces';
    const mats = {
      brass: new THREE.MeshPhysicalMaterial({ color: 0xc9a467, metalness: 1, roughness: 0.34, anisotropy: 0.4 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: 0.04, ior: 1.5, specularIntensity: 1,
        transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6,
        clearcoat: 1, clearcoatRoughness: 0.02,
      }),
      rim: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.45, metalness: 0 }),
      bulbGlass: new THREE.MeshPhysicalMaterial({
        color: 0xfff1dc, roughness: 0.02, transparent: true, opacity: 0.22, depthWrite: false,
        emissive: warmWhite(THREE), emissiveIntensity: 0.25,
      }),
    };
    mats.bulbGlass.userData.onIntensity = 0.25;
    const glow = glowMaterial(THREE, { intensity: 14, color: 0xffe2b0 });
    const lights = [];
    for (const side of [-1, 1]) {
      const s = sconce(THREE, mats, glow, shadows, opts.candela ?? 3);
      s.name = side < 0 ? 'sconceWest' : 'sconceEast';
      s.position.set(cx + side * spacing, bottom + GH / 2, surface);
      group.add(s);
      lights.push(s.userData.light);
    }
    group.userData.size = { glassDiameter: inch(4.25), glassHeight: GH };
    return finishFixture(group, lights, [glow, mats.bulbGlass]);
  },
};
