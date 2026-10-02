// Shared geometry helpers for room.js and the fixture builders.
// All UVs written here are in METRES (box projection in world space), so a
// texture with repeat = 1/physicalSize tiles at its real-world size and grout
// lines line up across separate meshes.
import * as THREE from 'three';

/**
 * Box-projected metre UVs.  Faces facing +-X use (z, y), +-Y use (x, z),
 * +-Z use (x, y).  `origin` shifts the grid (e.g. so wainscot courses start
 * at 4" above the floor).
 */
export function boxUV(geo, origin = [0, 0, 0]) {
  const pos = geo.attributes.position;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  const [ox, oy, oz] = origin;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) - ox, y = pos.getY(i) - oy, z = pos.getZ(i) - oz;
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az) {
      u = nrm.getX(i) > 0 ? -z : z;
      v = y;
    } else if (ay >= az) {
      u = x;
      v = -z;
    } else {
      u = nrm.getZ(i) > 0 ? x : -x;
      v = y;
    }
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** Axis-aligned box from min/max corners (metres), metre UVs. */
export function boxGeo(x0, y0, z0, x1, y1, z1, uvOrigin) {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return boxUV(g, uvOrigin);
}

export function mesh(geo, mat, { name, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (name) m.name = name;
  return m;
}

export function box(x0, y0, z0, x1, y1, z1, mat, opts = {}) {
  return mesh(boxGeo(x0, y0, z0, x1, y1, z1, opts.uvOrigin), mat, opts);
}

/** Rounded rectangle THREE.Shape centred at (cx, cy). */
export function roundedRectShape(w, h, r, cx = 0, cy = 0, shape = new THREE.Shape()) {
  const x = cx - w / 2, y = cy - h / 2;
  r = Math.min(r, w / 2, h / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/** Rounded rectangle as a closed ring of `n` points (true arcs, even spacing by angle). */
export function roundedRectRing(w, h, r, n = 64) {
  r = Math.min(r, w / 2 - 1e-5, h / 2 - 1e-5);
  const pts = [];
  // superellipse-free approach: walk angle around, intersect with rounded rect
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const dx = Math.cos(t), dy = Math.sin(t);
    // ray from centre; find hit on rounded rect by bisection of inside test
    let lo = 0, hi = Math.hypot(w, h);
    for (let k = 0; k < 28; k++) {
      const mid = (lo + hi) / 2;
      const px = Math.abs(dx * mid), py = Math.abs(dy * mid);
      const qx = px - (w / 2 - r), qy = py - (h / 2 - r);
      const inside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r <= 0;
      if (inside) lo = mid; else hi = mid;
    }
    pts.push(new THREE.Vector2(dx * lo, dy * lo));
  }
  return pts;
}

/**
 * Loft between rings: rings[k] = {pts: Vector2[] (x,z), y}.  All rings must
 * have the same point count.  Returns a BufferGeometry (closed around, open
 * at the ends).  `flip` reverses winding (for surfaces seen from inside).
 */
export function loftRings(rings, flip = false) {
  const n = rings[0].pts.length;
  const pos = [];
  const idx = [];
  rings.forEach((r) => r.pts.forEach((p) => pos.push(p.x, r.y, p.y)));
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const a = k * n + i, b = k * n + ((i + 1) % n), c = (k + 1) * n + i, d = (k + 1) * n + ((i + 1) % n);
      if (flip) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Flat polygon cap from a ring at height y (fan). Faces up unless down=true. */
export function ringCap(pts, y, down = false) {
  const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.y)));
  const g = new THREE.ShapeGeometry(shape, 8);
  g.rotateX(-Math.PI / 2); // shape (x, y) -> world (x, 0, -y)
  g.translate(0, y, 0);
  if (down) {
    g.rotateX(Math.PI);
    g.translate(0, 2 * y, 0);
  }
  return g;
}

/** Common materials that do not depend on textures. */
export function stdMaterials() {
  return {
    chrome: new THREE.MeshStandardMaterial({ color: 0xe8e8ea, metalness: 1, roughness: 0.08, envMapIntensity: 3.5 }),
    satinNickel: new THREE.MeshStandardMaterial({ color: 0xb9b6ae, metalness: 1, roughness: 0.32, envMapIntensity: 3 }),
    porcelain: new THREE.MeshPhysicalMaterial({
      color: 0xf7f7f4, roughness: 0.18, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 2,
    }),
    whitePlastic: new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.45 }),
    whiteTrim: new THREE.MeshStandardMaterial({ color: 0xf0f0ec, roughness: 0.5 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5 }),
    darkGap: new THREE.MeshStandardMaterial({ color: 0x1b1a19, roughness: 0.9 }),
  };
}
