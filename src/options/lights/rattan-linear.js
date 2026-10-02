// Adara-style 4-light oval rattan linear chandelier (photo 00):
// ~32" x 12" x 10", two stepped stadium-shaped tiers of twisted seagrass /
// rattan weave (upper tier full size, lower tier inset), black metal frame,
// 4 candle sockets, chains to a hub and a ceiling canopy.
//
// build(ctx, { hangBottomIn = 100 (clamped to ceiling - 14"), centreXIn = 55, centreZIn = 11,
//              ceilingIn = 120, shadows = true })
// Lights: 2 shadow-casting PointLights (each stands for 2 candle bulbs) to
// keep the cube-shadow cost at 2 x 6 passes.
import { remodelDims, tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, hash2, smoothstep } from '../procedural.js';
import { bulbLight, glowMaterial, chain, rod, finishFixture, inch, mm } from './common.js';

const WEAVE_REPEAT = [inch(3), inch(3)];

function stadiumPoints(THREE, len, wid, n = 120) {
  // Closed stadium in the XZ plane, centred, long axis X.  Returns
  // [{x, z, s}] with arclength s, plus total perimeter.
  const R = wid / 2, S = len - wid;
  const per = 2 * S + 2 * Math.PI * R;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * per;
    let x, z;
    if (s < S) { x = -S / 2 + s; z = R; }
    else if (s < S + Math.PI * R) { const t = (s - S) / R; x = S / 2 + R * Math.sin(t); z = R * Math.cos(t); }
    else if (s < 2 * S + Math.PI * R) { x = S / 2 - (s - S - Math.PI * R); z = -R; }
    else { const t = (s - 2 * S - Math.PI * R) / R; x = -S / 2 - R * Math.sin(t); z = -R * Math.cos(t); }
    pts.push({ x, z, s });
  }
  return { pts, per };
}

function wallGeometry(THREE, len, wid, y0, y1, rep) {
  const { pts } = stadiumPoints(THREE, len, wid, 160);
  const P = [], U = [], I = [];
  pts.forEach((p, i) => {
    P.push(p.x, y0, p.z, p.x, y1, p.z);
    U.push(p.s / rep[0], y0 / rep[1], p.s / rep[0], y1 / rep[1]);
    if (i > 0) { const a = (i - 1) * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

function rimTube(THREE, len, wid, y, radius, material) {
  const { pts } = stadiumPoints(THREE, len, wid, 64);
  const curve = new THREE.CatmullRomCurve3(pts.slice(0, -1).map((p) => new THREE.Vector3(p.x, y, p.z)), true);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, radius, 8, true), material);
  m.castShadow = true;
  return m;
}

/** Twisted seagrass weave: horizontal weavers over/under vertical stakes. */
function makeWeave(THREE) {
  const S = 512, w = S, h = S;
  const stakes = 4, rows = 6;                    // per 3" repeat: 0.5" weavers
  const sw = w / stakes, rh = h / rows;
  const albedo = new Float32Array(w * h * 3), height = new Float32Array(w * h);
  const alpha = new Float32Array(w * h), rough = new Float32Array(w * h);
  const light = [0.78, 0.66, 0.48], dark = [0.42, 0.33, 0.22], stakeC = [0.50, 0.40, 0.27];
  for (let y = 0; y < h; y++) {
    const row = Math.floor(y / rh), ly = (y % rh) / rh;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const col = Math.floor(x / sw), lx = (x % sw) / sw;
      const over = ((col + row) & 1) === 0;
      const n = fbm(x, y, w, h, 16, 3, 31);
      // Weaver: rounded cross-section, rising over a stake, dipping under.
      const bulge = over ? 0.5 + 0.5 * Math.cos((lx - 0.5) * Math.PI * 2) : 0.5 - 0.5 * Math.cos((lx - 0.5) * Math.PI * 2);
      const prof = Math.sin(Math.PI * ly);
      // Light only gets through small pockets where the weaver dives under a
      // stake; elsewhere neighbouring rows press together.
      const gap = (0.02 + 0.10 * Math.pow(1 - bulge, 3)) * (0.7 + 0.6 * hash2(row, col, 3));
      const inWeaver = ly > gap && ly < 1 - gap;
      // Stake: thin vertical strand centred in each column, visible where the
      // weaver goes under it (and through the gaps).
      const sd = Math.abs(lx - 0.5) * sw;
      const inStake = sd < sw * 0.14;
      const stakeOnTop = inStake && !over && bulge > 0.55;
      let c, ht, a = 1;
      if (inWeaver && !stakeOnTop) {
        const twist = 0.5 + 0.5 * Math.sin((x * 0.5 + ly * rh * 1.6) * 0.42);  // twisted rope
        const t = smoothstep(0.0, 1.0, prof) * (0.55 + 0.45 * twist) * (0.75 + 0.25 * bulge);
        c = [0, 1, 2].map((k) => dark[k] + (light[k] - dark[k]) * (t * 0.85 + n * 0.3));
        ht = 0.35 + 0.45 * prof * (0.6 + 0.4 * bulge) + 0.08 * twist;
      } else if (inStake) {
        const sp = Math.cos((sd / (sw * 0.14)) * Math.PI / 2);
        c = stakeC.map((v) => v * (0.7 + 0.4 * sp) * (0.9 + 0.2 * n));
        ht = stakeOnTop ? 0.55 + 0.3 * sp : 0.25 * sp;
      } else {
        c = dark.map((v) => v * 0.5); ht = 0; a = 0;     // see-through gap
      }
      albedo[i * 3] = c[0]; albedo[i * 3 + 1] = c[1]; albedo[i * 3 + 2] = c[2];
      height[i] = ht; alpha[i] = a; rough[i] = 0.85;
    }
  }
  return buildMaps(THREE, { w, h, albedo, height, alpha, rough }, { normalStrength: 8 });
}

export default {
  id: 'rattan-linear',
  name: 'Rattan oval linear, 4-light (Adara)',
  order: 10,
  description: '32" x 12" x 10" two-tier rattan oval, black frame',
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const D = remodelDims(ctx);
    const ceiling0 = opts.ceilingIn != null ? inch(opts.ceilingIn) : D.ceiling;
    // Body is 10" tall; keep >= 4" of chain + canopy above it.
    const bottom = Math.min(opts.hangBottomIn != null ? inch(opts.hangBottomIn) : inch(100), ceiling0 - inch(14));
    const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX;
    const cz = opts.centreZIn != null ? inch(opts.centreZIn) : D.lightCentreZ;
    const ceiling = ceiling0;
    const shadows = opts.shadows !== false;

    const group = new THREE.Group();
    group.name = 'light:rattan-linear';
    group.position.set(cx, bottom, cz);

    // Rattan material: texture pack map if present, else procedural weave.
    const named = tex(ctx, 'rattan');
    const rep = named ? physicalSize(ctx, 'rattan', WEAVE_REPEAT) : WEAVE_REPEAT;
    const maps = named
      ? { map: repeatClone(THREE, named, true), normalMap: repeatClone(THREE, texCompanion(ctx, 'rattan', 'normal'), false),
          alphaMap: repeatClone(THREE, texCompanion(ctx, 'rattan', 'alpha'), false) }
      : cached(THREE, 'rattan-weave', () => makeWeave(THREE));
    // Weave gaps: the pack ships a separate alphaMap; the procedural weave
    // carries alpha in its albedo.  alphaTest keeps it opaque-sorted and
    // lets the shadow map see the holes (dappled light on wall + ceiling).
    const rattan = new THREE.MeshStandardMaterial({
      map: maps.map, normalMap: maps.normalMap || null, alphaMap: maps.alphaMap || null,
      roughness: 0.85, metalness: 0, side: THREE.DoubleSide, alphaTest: 0.5,
    });
    rattan.normalScale.set(1.2, 1.2);
    const rimMat = new THREE.MeshStandardMaterial({ map: maps.map, normalMap: maps.normalMap || null, roughness: 0.9, color: 0xd8c8b0 });
    const black = new THREE.MeshPhysicalMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.45, clearcoat: 0.2 });

    const L = inch(32), Wd = inch(12), HT = inch(10);
    const lowerH = inch(5.0), upperY0 = inch(4.6);
    const inset = inch(1.3);
    // Lower tier (inset), upper tier (full size, overlapping the lower one).
    const lower = new THREE.Mesh(wallGeometry(THREE, L - 2 * inset, Wd - 2 * inset, 0, lowerH, rep), rattan);
    const upper = new THREE.Mesh(wallGeometry(THREE, L, Wd, upperY0, HT, rep), rattan);
    for (const m of [lower, upper]) { m.castShadow = true; m.receiveShadow = true; group.add(m); }
    lower.name = 'rattanLowerTier'; upper.name = 'rattanUpperTier';
    group.add(rimTube(THREE, L - 2 * inset, Wd - 2 * inset, mm(5), mm(6), rimMat));
    group.add(rimTube(THREE, L, Wd, upperY0 + mm(5), mm(7), rimMat));
    group.add(rimTube(THREE, L, Wd, HT - mm(4), mm(6), rimMat));
    // Shoulder: a flat rattan ledge joining the two tiers (seen in the photo).
    {
      const sh = new THREE.Shape();
      const outerS = stadiumPoints(THREE, L, Wd, 96).pts, innerS = stadiumPoints(THREE, L - 2 * inset, Wd - 2 * inset, 96).pts;
      outerS.forEach((p, i) => (i ? sh.lineTo(p.x, p.z) : sh.moveTo(p.x, p.z)));
      const hole = new THREE.Path();
      innerS.slice().reverse().forEach((p, i) => (i ? hole.lineTo(p.x, p.z) : hole.moveTo(p.x, p.z)));
      sh.holes.push(hole);
      const g = new THREE.ShapeGeometry(sh, 1);
      g.rotateX(Math.PI / 2);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / rep[0], uv.getY(i) / rep[1]);
      const m = new THREE.Mesh(g, rattan);
      m.position.y = upperY0 + mm(2);
      m.castShadow = m.receiveShadow = true;
      group.add(m);
    }

    // Black frame: top ring inside the upper rim, a spine bar for sockets.
    const topRing = rimTube(THREE, L - inch(0.6), Wd - inch(0.6), HT - mm(10), mm(3), black);
    group.add(topRing);
    const barY = inch(2.2);
    group.add(rod(THREE, new THREE.Vector3(-L / 2 + inch(4), barY, 0), new THREE.Vector3(L / 2 - inch(4), barY, 0), mm(5), black));
    for (const sx of [-1, 1]) {
      // Bar hangers up to the top ring.
      group.add(rod(THREE, new THREE.Vector3(sx * (L / 2 - inch(4)), barY, 0), new THREE.Vector3(sx * (L / 2 - inch(4)), HT - mm(10), Wd / 2 - inch(0.3)), mm(2.5), black));
      group.add(rod(THREE, new THREE.Vector3(sx * (L / 2 - inch(4)), barY, 0), new THREE.Vector3(sx * (L / 2 - inch(4)), HT - mm(10), -Wd / 2 + inch(0.3)), mm(2.5), black));
    }

    // 4 candle sockets + bulbs.
    const glow = glowMaterial(THREE, { intensity: 8 });
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5, metalness: 0.4 });
    const sockGeo = new THREE.CylinderGeometry(inch(0.5), inch(0.5), inch(3), 16);
    const cupGeo = new THREE.CylinderGeometry(inch(0.85), inch(0.6), inch(0.5), 20);
    const bulbGeo = new THREE.SphereGeometry(inch(0.55), 16, 12);
    bulbGeo.scale(1, 1.6, 1);
    const xs = [-11.5, -3.8, 3.8, 11.5].map(inch);
    for (const x of xs) {
      const cup = new THREE.Mesh(cupGeo, sleeve); cup.position.set(x, barY + inch(0.25), 0); cup.castShadow = true;
      const s = new THREE.Mesh(sockGeo, sleeve); s.position.set(x, barY + inch(1.75), 0); s.castShadow = true;
      const b = new THREE.Mesh(bulbGeo, glow); b.position.set(x, barY + inch(3.9), 0); b.castShadow = false;
      b.name = 'bulb';
      group.add(cup, s, b);
    }
    const lights = [];
    for (const x of [-7.7, 7.7].map(inch)) {
      const l = bulbLight(THREE, { candela: opts.candela ?? 3.5, shadow: shadows, mapSize: 512 });
      l.position.set(x, barY + inch(4.2), 0);
      group.add(l);
      lights.push(l);
    }
    // Light that scatters through and off the weave (no shadow): keeps the
    // wall and ceiling around the shade from going black between the specks.
    const fill = bulbLight(THREE, { candela: (opts.candela ?? 3.5) * 0.35, shadow: false });
    fill.position.set(0, barY + inch(4.2), 0);
    group.add(fill);
    lights.push(fill);

    // Chains: 4 drops from the top ring to a hub, one chain to the canopy.
    const topY = ceiling - bottom - inch(0.75);
    const hubY = Math.min(HT + inch(7), topY - inch(1.5));
    const chainMat = black;
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const a = new THREE.Vector3(sx * inch(9), HT - mm(8), sz * (Wd / 2 - inch(0.4)));
      group.add(chain(THREE, a, new THREE.Vector3(0, hubY, 0), { material: chainMat, linkLen: inch(0.8), wire: mm(1.6) }));
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(inch(0.45), 16, 10), black);
    hub.position.y = hubY; hub.castShadow = true; group.add(hub);
    group.add(chain(THREE, new THREE.Vector3(0, hubY, 0), new THREE.Vector3(0, topY, 0), { material: chainMat }));
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(inch(2.5), inch(2.7), inch(0.75), 32), black);
    canopy.position.y = topY + inch(0.375);
    canopy.castShadow = true; group.add(canopy);

    group.userData.size = { length: L, width: Wd, height: HT };
    return finishFixture(group, lights, [glow]);
  },
};
