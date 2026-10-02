// Accent wall: the new tile / wallpaper on the north (vanity) wall between
// the tub column (x 36") and the window trim (x 74"), from the wainscot cap
// to the ceiling, with the three transition details of SPEC section 4.
//
//   buildAccentWall(ctx, { tile, transition, topIn, thicknessMmOverride,
//                          bottomIn?, x0In?, x1In?, buildOutMmOverride? }) -> THREE.Group
//   computeJunction(ctx, sameOpts) -> layer numbers (metres), also used by
//                                     the junction inspector.
//
// Coordinates per SPEC section 2: drywall face of the north wall is z = 0,
// +z points into the room.  The group is built in world coordinates (its own
// transform stays identity), so it can be added straight to the scene.
import { inch, mm, remodelDims, tex, physicalSize, repeatClone } from './cfg.js';
import { getTile, tiles } from '../options/index.js';

export const TRANSITIONS = [
  { id: 'keep-cap', name: 'Keep cap (start above bullnose)' },
  { id: 'remove-cap', name: 'Remove cap + Schluter edge' },
  { id: 'flush-fill', name: 'Build out, face flush with wainscot' },
];

const STRIP_LEG = mm(1.0);           // Schluter L: metal thickness
const STRIP_FACE = inch(1 / 8);      // visible lip height (1/8")
const JOINT = mm(1.5);               // caulk joint above strip / cap
const CAP_CHAMFER = mm(4);
const WALLPAPER_T = mm(0.4);

export function resolveTile(tile) {
  if (tile && typeof tile === 'object') return tile;
  return getTile(tile) || tiles()[0];
}

/**
 * All the numbers that describe the junction, in metres measured from the
 * drywall plane (z) / floor (y).
 *   wainscotProud  existing tile face (and cap face) proud of drywall (13 mm)
 *   capTop, capBottom
 *   buildOut       flush-fill substrate thickness (0 otherwise)
 *   thinset        3 mm under tile, 0 for wallpaper
 *   material       tile / wallpaper thickness (override applied)
 *   face           new finished face z (= buildOut + thinset + material)
 *   step           face - wainscotProud (+ = new face stands proud)
 *   bottom         y where the new material starts
 *   hasCap, hasStrip
 */
export function computeJunction(ctx, opts = {}) {
  const D = remodelDims(ctx);
  const option = resolveTile(opts.tile);
  const transition = TRANSITIONS.some((t) => t.id === opts.transition) ? opts.transition : 'keep-cap';
  const isWallpaper = option && option.kind === 'wallpaper';
  const ovr = opts.thicknessMmOverride;
  const tMm = (typeof ovr === 'number' && ovr >= 0 && Number.isFinite(ovr)) ? ovr : (option ? option.thicknessMm : 10);
  const material = isWallpaper ? Math.max(mm(tMm), WALLPAPER_T) : mm(tMm);
  const thinset = isWallpaper ? 0 : D.thinset;
  const capTop = opts.bottomIn != null ? inch(opts.bottomIn) : D.wainscotTop;
  const capBottom = capTop - D.capHeight;
  let buildOut = 0;
  if (transition === 'flush-fill') {
    // SPEC: drywall built out so the new face is flush with the wainscot face.
    buildOut = opts.buildOutMmOverride != null ? mm(opts.buildOutMmOverride)
      : Math.max(0, D.wainscotProud - thinset - material);
  }
  const face = buildOut + thinset + material;
  const bottom = transition === 'remove-cap' ? capBottom + STRIP_LEG + JOINT : capTop + JOINT;
  return {
    option, transition, isWallpaper,
    wainscotProud: D.wainscotProud, wainscotThinset: D.wainscotThinset,
    capTop, capBottom, capChamfer: CAP_CHAMFER,
    buildOut, thinset, material, face,
    step: face - D.wainscotProud,
    bottom,
    top: opts.topIn != null ? inch(opts.topIn) : Math.min(D.accentTop, D.ceiling),
    x0: opts.x0In != null ? inch(opts.x0In) : D.accentX0,
    x1: opts.x1In != null ? inch(opts.x1In) : D.accentX1,
    hasCap: transition !== 'remove-cap',
    hasStrip: transition === 'remove-cap',
    strip: { leg: STRIP_LEG, face: STRIP_FACE },
  };
}

/**
 * Box geometry with only the visible faces (front, left, right, top,
 * bottom) and UVs in texture repeats: u = (x - ox) / rw, v = (y - oy) / rh.
 * Groups: 0 = front face, 1 = edges.
 */
export function slabGeometry(THREE, b, rw, rh, ox = 0, oy = 0) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  const P = [], N = [], U = [];
  const quad = (a, bb, c, d, n, uv) => {
    for (const [p, t] of [[a, uv[0]], [bb, uv[1]], [c, uv[2]], [a, uv[0]], [c, uv[2]], [d, uv[3]]]) {
      P.push(...p); N.push(...n); U.push(...t);
    }
  };
  const ux = (x) => (x - ox) / rw, vy = (y) => (y - oy) / rh;
  // front (+z)
  quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1],
    [[ux(x0), vy(y0)], [ux(x1), vy(y0)], [ux(x1), vy(y1)], [ux(x0), vy(y1)]]);
  const front = P.length / 3;
  // left (-x)
  quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0],
    [[ux(x0) - (z1 - z0) / rw, vy(y0)], [ux(x0), vy(y0)], [ux(x0), vy(y1)], [ux(x0) - (z1 - z0) / rw, vy(y1)]]);
  // right (+x)
  quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0],
    [[ux(x1), vy(y0)], [ux(x1) + (z1 - z0) / rw, vy(y0)], [ux(x1) + (z1 - z0) / rw, vy(y1)], [ux(x1), vy(y1)]]);
  // bottom (-y)
  quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0],
    [[ux(x0), vy(y0) - (z1 - z0) / rh], [ux(x1), vy(y0) - (z1 - z0) / rh], [ux(x1), vy(y0)], [ux(x0), vy(y0)]]);
  // top (+y)
  quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0],
    [[ux(x0), vy(y1)], [ux(x1), vy(y1)], [ux(x1), vy(y1) + (z1 - z0) / rh], [ux(x0), vy(y1) + (z1 - z0) / rh]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.addGroup(0, front, 0);
  g.addGroup(front, P.length / 3 - front, 1);
  return g;
}

/** Existing-style chamfered cap profile extruded along x (reference copy). */
export function capGeometry(THREE, J, x0, x1) {
  const s = new THREE.Shape();
  const P = J.wainscotProud, ct = J.capTop, cb = J.capBottom, ch = J.capChamfer;
  // Shape in (z, y); extruded along +Z then rotated so extrusion runs along +x.
  s.moveTo(0, cb);
  s.lineTo(P, cb);
  s.lineTo(P, ct - ch);
  s.quadraticCurveTo(P, ct - ch * 0.15, P - ch, ct);  // softened chamfer
  s.lineTo(0, ct);
  s.lineTo(0, cb);
  const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false, curveSegments: 4 });
  // (z, y, x') -> world: x = x0 + x', y = y, z = shape x
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i), sy = pos.getY(i), sz = pos.getZ(i);
    pos.setXYZ(i, x0 + sz, sy, sx);
  }
  g.computeVertexNormals();
  // Mirror flips handedness: fix winding.
  const idx = g.index;
  if (idx) { for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i + 1); idx.setX(i + 1, idx.getX(i + 2)); idx.setX(i + 2, a); } }
  else {
    const swap = (attr, n) => { for (let i = 0; i < attr.count; i += 3) for (let k = 0; k < n; k++) { const a = attr.array[(i + 1) * n + k]; attr.array[(i + 1) * n + k] = attr.array[(i + 2) * n + k]; attr.array[(i + 2) * n + k] = a; } };
    for (const name of Object.keys(g.attributes)) swap(g.attributes[name], g.attributes[name].itemSize);
  }
  g.computeVertexNormals();
  return g;
}

export function capMaterial(ctx) {
  const { THREE } = ctx;
  const t = tex(ctx, 'wainscot');
  const m = new THREE.MeshPhysicalMaterial({ color: t ? 0xffffff : 0x8e8b87, roughness: 0.55, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.4 });
  if (t) m.map = t;
  return m;
}

export function buildAccentWall(ctx, opts = {}) {
  const { THREE } = ctx;
  const J = computeJunction(ctx, opts);
  const option = J.option;
  const group = new THREE.Group();
  group.name = 'accentWall';
  const disposables = [];
  const keep = (o) => { disposables.push(o); return o; };

  const [rw, rh] = option && option.repeatFor ? option.repeatFor(ctx)
    : physicalSize(ctx, option && option.textureName, (option && option.repeatM) || [0.3, 0.3]);
  const faceMat = keep(option ? option.makeMaterial(ctx) : new THREE.MeshStandardMaterial({ color: 0xcccccc }));
  if (J.isWallpaper) { faceMat.polygonOffset = true; faceMat.polygonOffsetFactor = -1; faceMat.polygonOffsetUnits = -2; }
  const edgeMat = faceMat; // tile edges show the same glaze / print

  const x0 = J.x0, x1 = J.x1, y0 = J.bottom, y1 = J.top;
  let z = 0;
  if (J.buildOut > 0) {
    const boMat = keep(new THREE.MeshStandardMaterial({ color: 0xc4c6c0, roughness: 0.95 }));
    const g = keep(slabGeometry(THREE, { x0, x1, y0: y0 - JOINT, y1, z0: z, z1: z + J.buildOut }, rw, rh, x0, y0));
    const m = new THREE.Mesh(g, [boMat, boMat]);
    m.name = 'buildOut'; m.receiveShadow = true; m.castShadow = true;
    group.add(m);
    z += J.buildOut;
  }
  if (J.thinset > 0) {
    const tsMat = keep(new THREE.MeshStandardMaterial({ color: 0x8d8b85, roughness: 1 }));
    const inset = mm(2);
    const g = keep(slabGeometry(THREE, { x0: x0 + inset, x1: x1 - inset, y0: y0 + inset, y1, z0: z, z1: z + J.thinset }, rw, rh, x0, y0));
    const m = new THREE.Mesh(g, [tsMat, tsMat]);
    m.name = 'thinset'; m.receiveShadow = true;
    group.add(m);
    z += J.thinset;
  }
  {
    const g = keep(slabGeometry(THREE, { x0, x1, y0, y1, z0: z, z1: z + J.material }, rw, rh, x0, y0));
    const m = new THREE.Mesh(g, [faceMat, edgeMat]);
    m.name = 'accentFace'; m.receiveShadow = true; m.castShadow = !J.isWallpaper;
    group.add(m);
  }

  if (J.hasCap) {
    const g = keep(capGeometry(THREE, J, x0, x1));
    const cm = keep(capMaterial(ctx));
    const cap = new THREE.Mesh(g, cm);
    cap.name = 'existingCapReference';
    cap.castShadow = cap.receiveShadow = true;
    group.add(cap);
    group.userData.capReference = cap;
  }
  if (J.hasStrip) {
    // Brushed-nickel L-angle: a horizontal leg on top of the cut wainscot
    // tile and a 1/8" lip down its face.
    const nickel = keep(new THREE.MeshPhysicalMaterial({ color: 0xb9b8b2, metalness: 1, roughness: 0.32, anisotropy: 0.6 }));
    const leg = keep(new THREE.BoxGeometry(x1 - x0, J.strip.leg, J.wainscotProud + J.strip.leg));
    const legM = new THREE.Mesh(leg, nickel);
    legM.position.set((x0 + x1) / 2, J.capBottom + J.strip.leg / 2, (J.wainscotProud + J.strip.leg) / 2);
    const lip = keep(new THREE.BoxGeometry(x1 - x0, J.strip.face, J.strip.leg));
    const lipM = new THREE.Mesh(lip, nickel);
    lipM.position.set((x0 + x1) / 2, J.capBottom + J.strip.leg - J.strip.face / 2, J.wainscotProud + J.strip.leg / 2);
    for (const m of [legM, lipM]) { m.castShadow = m.receiveShadow = true; m.name = 'schluterStrip'; group.add(m); }
    // Tell the room which span of its own cap must disappear.
    group.userData.removesCap = { x0, x1 };
  }
  // Caulk bead in the joint between new material and cap / strip.
  {
    const caulk = keep(new THREE.MeshStandardMaterial({ color: option && option.groutColor ? option.groutColor : 0xdedcd6, roughness: 0.6 }));
    const g = keep(new THREE.BoxGeometry(x1 - x0, JOINT, Math.max(J.face, mm(0.6))));
    const m = new THREE.Mesh(g, caulk);
    m.name = 'joint';
    m.position.set((x0 + x1) / 2, y0 - JOINT / 2, Math.max(J.face, mm(0.6)) / 2 - mm(0.3));
    m.receiveShadow = true;
    group.add(m);
  }

  group.userData.junction = J;
  group.userData.surfaceOffsetM = J.face;   // pass to buildOvalMirror / sconces
  group.userData.dispose = () => { for (const d of disposables) d.dispose && d.dispose(); };
  return group;
}
