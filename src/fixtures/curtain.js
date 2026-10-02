// buildCurtain(ctx): curved satin rod from the column top box to the end-wall
// tile panel (photos 12, 13, 26), rings, and a dark grey waffle curtain
// bunched toward the column as in photo 37.
import * as THREE from 'three';
import { inch } from '../units.js';
import { mesh, stdMaterials } from './util.js';

export function buildCurtain(ctx) {
  const { CURTAIN: C, COLUMN, ROOM, WAINSCOT } = ctx.config;
  const std = stdMaterials();
  const g = new THREE.Group();
  g.name = 'curtain';

  const y = C.rodY;
  const z0 = COLUMN.z1 + WAINSCOT.proud, z1 = ROOM.depth - WAINSCOT.proud;
  const [sx] = C.rodStart, [ex] = C.rodEnd;
  const rod = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sx, y, z0),
    new THREE.Vector3(sx + C.rodBow * 0.55, y, z0 + (z1 - z0) * 0.18),
    new THREE.Vector3((sx + ex) / 2 + C.rodBow, y, (z0 + z1) / 2),
    new THREE.Vector3(ex + C.rodBow * 0.55, y, z1 - (z1 - z0) * 0.18),
    new THREE.Vector3(ex, y, z1),
  ]);
  g.add(mesh(new THREE.TubeGeometry(rod, 80, inch(0.5), 12), std.satinNickel, { name: 'curtain_rod' }));
  for (const z of [z0, z1]) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(inch(1.4), inch(1.6), inch(0.9), 28), std.satinNickel);
    f.rotation.x = Math.PI / 2;
    f.position.set(z === z0 ? sx : ex, y, z === z0 ? z + inch(0.45) : z - inch(0.45));
    g.add(f);
  }

  // rings over the bunched stretch
  const nRings = 12;
  const ringGeo = new THREE.TorusGeometry(inch(0.8), inch(0.07), 6, 20);
  for (let i = 0; i < nRings; i++) {
    const u = C.bunchFrom + 0.01 + ((C.bunchTo - C.bunchFrom - 0.02) * i) / (nRings - 1);
    const p = rod.getPointAt(u), t = rod.getTangentAt(u);
    const r = new THREE.Mesh(ringGeo, std.satinNickel);
    r.position.copy(p).add(new THREE.Vector3(0, -inch(0.5), 0));
    r.lookAt(p.clone().add(t)); // ring plane perpendicular to the rod
    g.add(r);
  }

  // curtain: grid along the bunched part of the rod, pleated sideways
  const top = y - inch(1.6), bottom = C.bottom;
  const NU = 120, NV = 40;
  const pleats = 11, amp = inch(1.6);
  const pos = [], uv = [], idx = [];
  let acc = 0, prev = null;
  for (let i = 0; i <= NU; i++) {
    const s = i / NU;
    const u = C.bunchFrom + (C.bunchTo - C.bunchFrom) * s;
    const p = rod.getPointAt(u), t = rod.getTangentAt(u);
    const nrm = new THREE.Vector3(t.z, 0, -t.x).normalize();
    // fabric length travelled (for texture u) counts the pleat folds
    const fold = Math.sin(s * pleats * Math.PI * 2);
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      const yy = top - (top - bottom) * v;
      // folds widen a little toward the hem; the hem tucks inside the tub
      const a = amp * (0.85 + 0.35 * v) * fold;
      const tuck = -inch(3.5) * Math.max(0, v - 0.75) / 0.25;
      const wob = inch(0.4) * Math.sin(v * 7 + s * 13);
      const P = p.clone().addScaledVector(nrm, a + wob).add(new THREE.Vector3(tuck, 0, 0));
      P.y = yy - (v === 1 ? inch(0.6) * Math.sin(s * 23) : 0);
      pos.push(P.x, P.y, P.z);
    }
    if (prev) acc += prev.distanceTo(p) * 2.2; // ~2.2x fullness when bunched
    prev = p;
    for (let j = 0; j <= NV; j++) uv.push(acc, -((top - bottom) * j) / NV);
  }
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = a + NV + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // photo 37: the curtain reads darker than the swatch texture -> slight tint
  const fabric = ctx.textures.material('curtain', { roughness: 0.95, side: THREE.DoubleSide, color: undefined }); // albedo carries the colour: no second tint
  g.add(mesh(geo, fabric, { name: 'curtain_fabric' }));
  return g;
}
