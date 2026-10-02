// Monteaux 3-light faceted frosted-glass pendant (photos 05-07):
// ~16" dia x 18" tall octagonal lantern: a band of 8 tall rectangles, 8
// trapezoids tapering to a top octagon, and below the band a ring of
// kite/triangle facets closing to a small bottom octagon.  Frosted white
// panels, antique-brass edge frame, 3 chains to a hub, rod + canopy.
//
// build(ctx, { hangBottomIn = 88, centreXIn = 55, centreZIn = 11,
//              ceilingIn = 120, shadows = true })
// Lights: 1 shadow-casting PointLight at the cluster centre (the 3 bulbs);
// the glass does not cast shadows (it would black out the light), only the
// brass frame does.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { remodelDims, warmWhite } from '../../remodel/cfg.js';
import { bulbLight, glowMaterial, chain, finishFixture, inch, mm } from './common.js';

export default {
  id: 'monteaux-pendant',
  name: 'Monteaux faceted glass pendant, 3-light',
  order: 20,
  description: '16" x 18" octagonal frosted-glass lantern, antique brass',
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const D = remodelDims(ctx);
    const bottom = opts.hangBottomIn != null ? inch(opts.hangBottomIn) : inch(88);
    const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX;
    const cz = opts.centreZIn != null ? inch(opts.centreZIn) : D.lightCentreZ;
    const ceiling = opts.ceilingIn != null ? inch(opts.ceilingIn) : D.ceiling;
    const shadows = opts.shadows !== false;

    const group = new THREE.Group();
    group.name = 'light:monteaux-pendant';
    group.position.set(cx, bottom, cz);

    const R = inch(8), HT = inch(18), N = 8;
    const rot0 = Math.PI / N;            // a flat face toward +z (the viewer)
    // Rings: [radius, y, angular offset in half-steps]
    const rings = [
      [R * 0.42, HT, 0],          // top octagon
      [R, HT * 0.74, 0],          // top of the vertical band
      [R, HT * 0.40, 0],          // bottom of the band
      [R * 0.66, HT * 0.13, 1],   // rotated ring: kites + triangles
      [R * 0.24, 0, 1],           // bottom octagon
    ];
    const V = rings.map(([r, y, off]) => Array.from({ length: N }, (_, i) => {
      const t = rot0 + (i + off * 0.5) * (Math.PI * 2 / N);
      return new THREE.Vector3(r * Math.sin(t), y, r * Math.cos(t));
    }));
    const tris = [];
    const quad = (a, b, c, d) => { tris.push(a, b, c, a, c, d); };
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      quad(V[1][i], V[1][j], V[0][j], V[0][i]);   // upper trapezoids
      quad(V[2][i], V[2][j], V[1][j], V[1][i]);   // band rectangles
      tris.push(V[2][i], V[3][i], V[2][j]);       // downward triangles
      tris.push(V[3][i], V[3][j], V[2][j]);       // ... and between
      quad(V[3][i], V[4][i], V[4][j], V[3][j]);   // lower trapezoids
    }
    const glassGeo = new THREE.BufferGeometry().setFromPoints(tris);
    glassGeo.computeVertexNormals();               // non-indexed -> flat facets
    // Fix orientation: make every facet face outward.
    {
      const p = glassGeo.attributes.position, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      const n = new THREE.Vector3(), mid = new THREE.Vector3();
      for (let i = 0; i < p.count; i += 3) {
        a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
        n.subVectors(b, a).cross(c.clone().sub(a));
        mid.addVectors(a, b).add(c).divideScalar(3); mid.y -= HT * 0.5;
        if (n.dot(mid) < 0) { p.setXYZ(i + 1, c.x, c.y, c.z); p.setXYZ(i + 2, b.x, b.y, b.z); }
      }
      glassGeo.computeVertexNormals();
    }
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xf3f1ec, roughness: 0.55, metalness: 0,
      emissive: warmWhite(THREE), emissiveIntensity: 0.9,
      sheen: 0.3, sheenColor: 0xffffff, sheenRoughness: 0.6,
      side: THREE.DoubleSide,
    });
    glass.userData.onIntensity = glass.emissiveIntensity;
    const shell = new THREE.Mesh(glassGeo, glass);
    shell.name = 'frostedPanels';
    shell.castShadow = false; shell.receiveShadow = false;
    group.add(shell);

    // Antique brass frame along every facet edge, merged into one mesh.
    const brass = new THREE.MeshPhysicalMaterial({ color: 0x8a6a3a, metalness: 1, roughness: 0.42, clearcoat: 0.1 });
    const edges = new Map();
    const addEdge = (a, b) => {
      const k = [a, b].map((v) => v.toArray().map((x) => x.toFixed(4)).join(',')).sort().join('|');
      if (!edges.has(k)) edges.set(k, [a, b]);
    };
    for (let i = 0; i < tris.length; i += 3) { addEdge(tris[i], tris[i + 1]); addEdge(tris[i + 1], tris[i + 2]); addEdge(tris[i + 2], tris[i]); }
    // Skip the quad diagonals (edges not on a facet boundary): a quad split
    // shares its diagonal between two coplanar triangles.
    const planeKey = (i) => { const a = tris[i], b = tris[i + 1], c = tris[i + 2]; return new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize(); };
    const edgeFaces = new Map();
    for (let i = 0; i < tris.length; i += 3) {
      const n = planeKey(i);
      for (const [a, b] of [[tris[i], tris[i + 1]], [tris[i + 1], tris[i + 2]], [tris[i + 2], tris[i]]]) {
        const k = [a, b].map((v) => v.toArray().map((x) => x.toFixed(4)).join(',')).sort().join('|');
        if (!edgeFaces.has(k)) edgeFaces.set(k, []);
        edgeFaces.get(k).push(n);
      }
    }
    const parts = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (const [k, [a, b]] of edges) {
      const ns = edgeFaces.get(k);
      if (ns.length === 2 && Math.abs(ns[0].dot(ns[1])) > 0.9999) continue; // coplanar diagonal
      const dir = new THREE.Vector3().subVectors(b, a);
      const g = new THREE.CylinderGeometry(mm(2.2), mm(2.2), dir.length() + mm(3), 6, 1);
      const m = new THREE.Matrix4().compose(
        a.clone().addScaledVector(dir, 0.5),
        new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()),
        new THREE.Vector3(1, 1, 1));
      g.applyMatrix4(m);
      parts.push(g);
    }
    // Top cap + finial collar, bottom cap.
    const topCap = new THREE.CylinderGeometry(R * 0.44, R * 0.44, mm(5), N, 1);
    topCap.rotateY(rot0); topCap.translate(0, HT + mm(2), 0); parts.push(topCap);
    const collar = new THREE.CylinderGeometry(inch(0.9), inch(1.1), inch(1.0), 20);
    collar.translate(0, HT + inch(0.5), 0); parts.push(collar);
    const botCap = new THREE.CylinderGeometry(R * 0.25, R * 0.25, mm(4), N, 1);
    botCap.rotateY(rot0 + Math.PI / N); botCap.translate(0, -mm(1), 0); parts.push(botCap);
    const frame = new THREE.Mesh(mergeGeometries(parts.map((g) => g.toNonIndexed())), brass);
    parts.forEach((g) => g.dispose());
    frame.name = 'brassFrame';
    frame.castShadow = true;
    group.add(frame);

    // 3 chains from the top cap to a hub, then a rod to the canopy.
    const hubY = HT + inch(4.5);
    for (let i = 0; i < 3; i++) {
      const t = (i / 3) * Math.PI * 2;
      const a = new THREE.Vector3(R * 0.36 * Math.sin(t), HT + mm(4), R * 0.36 * Math.cos(t));
      group.add(chain(THREE, a, new THREE.Vector3(0, hubY, 0), { material: brass, linkLen: inch(0.75), wire: mm(1.5) }));
    }
    const topY = ceiling - bottom - inch(0.75);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.45), inch(0.6), inch(0.8), 16), brass);
    hub.position.y = hubY + inch(0.2); hub.castShadow = true; group.add(hub);
    const rodLen = Math.max(inch(1), topY - hubY - inch(0.6));
    const rodM = new THREE.Mesh(new THREE.CylinderGeometry(mm(6), mm(6), rodLen, 12), brass);
    rodM.position.y = hubY + inch(0.6) + rodLen / 2; rodM.castShadow = true; group.add(rodM);
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(inch(2.4), inch(2.6), inch(0.75), 32), brass);
    canopy.position.y = topY + inch(0.375); canopy.castShadow = true; group.add(canopy);

    // Interior: 3 bulbs (seen through the frosting as a brighter core).
    const glow = glowMaterial(THREE, { intensity: 6 });
    const bg = new THREE.SphereGeometry(inch(0.9), 16, 12);
    for (let i = 0; i < 3; i++) {
      const t = (i / 3) * Math.PI * 2;
      const b = new THREE.Mesh(bg, glow);
      b.position.set(inch(1.4) * Math.sin(t), HT * 0.55, inch(1.4) * Math.cos(t));
      b.castShadow = false; b.name = 'bulb';
      group.add(b);
    }
    const l = bulbLight(THREE, { candela: opts.candela ?? 8, shadow: shadows, mapSize: 1024 });
    l.position.set(0, HT * 0.55, 0);
    group.add(l);

    group.userData.size = { diameter: 2 * R, height: HT };
    return finishFixture(group, [l], [glow, glass]);
  },
};
