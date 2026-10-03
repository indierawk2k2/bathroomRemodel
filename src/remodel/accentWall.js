// Accent wall: the new tile / wallpaper on the north (vanity) wall, from the
// top of the existing wainscot to the ceiling, with the three transition
// details of SPEC section 4.  Two extents (`extent`):
//   'full-wall'     (default) from the tub column (x 30") across the vanity
//                   strip, round the window (cut out to the outer edge of its
//                   casing, stool and apron, with a caulk joint) and into the
//                   east inside corner (x 102").
//   'vanity-strip'  the tub column (x 30") to the window trim (x 76") only.
// The pattern origin is the bottom-left of the vanity strip in both, so the
// strip looks the same and the full wall simply continues the pattern east.
//
//   buildAccentWall(ctx, { tile, transition, topIn, thicknessMmOverride, extent?,
//                          bottomIn?, x0In?, x1In?, buildOutMmOverride? }) -> THREE.Group
//   computeJunction(ctx, sameOpts) -> layer numbers (metres), also used by
//                                     the junction inspector.
//
// The existing wainscot (photos 51-53) has NO separate cap: the top course is
// the 12x24 field tile, 13 mm proud of the drywall, finished with a factory
// eased edge (a ~6 mm light-sand lip with a 4 mm chamfer).  That edge belongs
// to the room (src/room.js `wainscotCap_*`) and stays in every transition;
// the accent wall only adds what goes ON TOP of it.
//
// Coordinates per SPEC section 2: drywall face of the north wall is z = 0,
// +z points into the room.  The group is built in world coordinates (its own
// transform stays identity), so it can be added straight to the scene.
import { inch, mm, remodelDims, physicalSize } from './cfg.js';
import { getTile, tiles } from '../options/index.js';

export const TRANSITIONS = [
  { id: 'butt-joint', name: 'Butt joint + caulk',
    description: 'New tile sits on the existing edge, colour-matched caulk joint' },
  { id: 'metal-edge', name: 'Metal edge strip (1/8" nickel)',
    description: '1/8" brushed-nickel Schluter strip between old and new' },
  { id: 'flush-fill', name: 'Flush (build wall out)',
    description: 'Wall built out so faces are flush' },
];
const DEFAULT_TRANSITION = TRANSITIONS[0].id;

export const EXTENTS = [
  { id: 'full-wall', name: 'Full wall, around window',
    description: 'Across the whole vanity wall, round the window trim, into the corner' },
  { id: 'vanity-strip', name: 'Vanity strip only',
    description: 'Tub column to the window trim (x 30-76")' },
];
const DEFAULT_EXTENT = EXTENTS[0].id;

const STRIP_LEG = mm(1.0);           // Schluter profile: metal thickness
const STRIP_FACE = inch(1 / 8);      // visible strip height (1/8")
const JOINT = mm(1.5);               // caulk joint on top of the old edge
const CAP_CHAMFER = mm(4);
const WALLPAPER_T = mm(0.4);

export function resolveTile(tile) {
  if (tile && typeof tile === 'object') return tile;
  return getTile(tile) || tiles()[0];
}

/**
 * All the numbers that describe the junction, in metres measured from the
 * drywall plane (z) / floor (y).
 *   wainscotProud  existing tile face proud of drywall (13 mm)
 *   capTop         top of the existing wainscot (40")
 *   capBottom      bottom of its eased lip (capTop - 6 mm)
 *   buildOut       flush-fill substrate thickness (0 otherwise)
 *   isWallpaper    wallpaper or a 0 mm paint finish (isPaint): no thinset / caulk
 *   thinset        3 mm under tile, 0 for wallpaper
 *   material       tile / wallpaper thickness (override applied)
 *   face           new finished face z (= buildOut + thinset + material)
 *   step           face - wainscotProud (+ = new face stands proud)
 *   bottom         y where the new material starts
 *   joint          caulk joint height (0 when a strip or wallpaper)
 *   hasCap         the existing eased edge is visible (always true)
 *   hasStrip       metal-edge transition
 */
export function computeJunction(ctx, opts = {}) {
  const D = remodelDims(ctx);
  const option = resolveTile(opts.tile);
  const transition = TRANSITIONS.some((t) => t.id === opts.transition) ? opts.transition : DEFAULT_TRANSITION;
  // Paint (kind 'paint', 0 mm) sits on the drywall like wallpaper: no
  // thinset, no caulk line, trimmed tight; the glazed-subway paint finish
  // (8 mm) is a tile.
  const isPaint = !!option && option.kind === 'paint' && !(option.thicknessMm > 0);
  const isWallpaper = !!option && (option.kind === 'wallpaper' || isPaint);
  const ovr = opts.thicknessMmOverride;
  const tMm = (typeof ovr === 'number' && ovr > 0 && Number.isFinite(ovr)) ? ovr : (option ? option.thicknessMm : 10);
  const material = isWallpaper ? Math.max(mm(tMm), WALLPAPER_T) : mm(tMm);
  const thinset = isWallpaper ? 0 : D.thinset;
  const capTop = opts.bottomIn != null ? inch(opts.bottomIn) : D.wainscotTop;
  const capBottom = capTop - D.capHeight;
  let buildOut = 0;
  if (transition === 'flush-fill') {
    // Drywall built out so the new face is flush with the wainscot face.
    buildOut = opts.buildOutMmOverride != null ? mm(opts.buildOutMmOverride)
      : Math.max(0, D.wainscotProud - thinset - material);
  }
  const face = buildOut + thinset + material;
  const hasStrip = transition === 'metal-edge';
  const joint = hasStrip || isWallpaper ? 0 : JOINT;
  const bottom = capTop + (hasStrip ? STRIP_FACE : joint);
  const extent = EXTENTS.some((e) => e.id === opts.extent) ? opts.extent : DEFAULT_EXTENT;
  const full = extent === 'full-wall';
  const x0 = opts.x0In != null ? inch(opts.x0In) : D.accentX0;
  const x1 = opts.x1In != null ? inch(opts.x1In) : (full ? D.fullWallX1 : D.accentX1);
  // Window outline (casing + apron, and the stool with its horns) as
  // rectangles [x0, x1, y0, y1] on the wall plane; only cut out when the
  // region actually reaches the window (the full wall).
  const W = D.window;
  const stoolBottom = W.sillTop - W.stoolThick;
  const outline = [
    [W.trimX0, W.trimX1, stoolBottom - W.apronH, W.head],
    [W.trimX0 - W.stoolHorn, W.trimX1 + W.stoolHorn, stoolBottom, W.sillTop],
  ].filter((r) => full && r[1] > x0 && r[0] < x1);
  return {
    option, transition, isWallpaper, isPaint, extent,
    wainscotProud: D.wainscotProud, wainscotThinset: D.wainscotThinset,
    capTop, capBottom, capChamfer: CAP_CHAMFER,
    buildOut, thinset, material, face,
    step: face - D.wainscotProud,
    bottom, joint,
    top: opts.topIn != null ? inch(opts.topIn) : Math.min(D.accentTop, D.ceiling),
    x0, x1,
    // window cut-out: raw trim outline, the tile's caulk gap round it (0 for
    // wallpaper, which is trimmed tight to the casing), casing projection
    // and how far the new face stands past it (+ = proud of the casing)
    window: outline,
    trimGap: outline.length && !isWallpaper ? JOINT : 0,
    casingProud: W.casingProud,
    stoolNose: W.stoolNose,
    caseStep: face - W.casingProud,
    // the slab dies into the east wall at the inside corner (no end face)
    endsInCorner: x1 >= D.roomWidth - mm(0.5),
    hasCap: true,
    hasStrip,
    strip: { leg: STRIP_LEG, face: STRIP_FACE, depth: Math.max(face, D.wainscotProud) + mm(0.5) },
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

const inRect = (r, x, y) => x > r[0] && x < r[1] && y > r[2] && y < r[3];
const grow = (r, d) => [r[0] - d, r[1] + d, r[2] - d, r[3] + d];

/**
 * Slab on the wall plane over the region b = {x0, x1, y0, y1, z0, z1}
 * minus the rectangles `holes` ([x0, x1, y0, y1]), optionally limited to
 * cells inside one of `only` (used for the caulk ring round the window).
 * The region is split on a grid at every rectangle edge; each filled cell
 * gets its front face, and every cell side with no filled neighbour gets an
 * edge face (the slab's real thickness, also round the cut-out), except the
 * east end when `openRight` (it dies into the east wall).  UVs as in
 * slabGeometry (texture repeats from ox, oy; edges continue the pattern
 * across the thickness), so a grout grid runs straight through the cut-out.
 * Groups: 0 = front face, 1 = edges.
 */
export function regionGeometry(THREE, b, holes, rw, rh, ox = 0, oy = 0, { only = null, openRight = false } = {}) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  const cuts = (lo, hi, k0, k1) => {
    const v = [lo, hi];
    for (const r of [...holes, ...(only || [])]) for (const c of [r[k0], r[k1]]) if (c > lo && c < hi) v.push(c);
    v.sort((a, c) => a - c);
    return v.filter((c, i) => i === 0 || c - v[i - 1] > 1e-6);
  };
  const xs = cuts(x0, x1, 0, 1), ys = cuts(y0, y1, 2, 3);
  const nx = xs.length - 1, ny = ys.length - 1;
  const fill = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
    fill[j * nx + i] = !holes.some((r) => inRect(r, cx, cy)) && (!only || only.some((r) => inRect(r, cx, cy)));
  }
  const F = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && fill[j * nx + i];
  const P = [], N = [], U = [];
  const quad = (a, bb, c, d, n, uv) => {
    for (const [p, t] of [[a, uv[0]], [bb, uv[1]], [c, uv[2]], [a, uv[0]], [c, uv[2]], [d, uv[3]]]) {
      P.push(...p); N.push(...n); U.push(...t);
    }
  };
  const ux = (x) => (x - ox) / rw, vy = (y) => (y - oy) / rh;
  const du = (z1 - z0) / rw, dv = (z1 - z0) / rh;
  // front faces, merged into horizontal runs per row
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      if (!F(i, j)) continue;
      let k = i;
      while (F(k + 1, j)) k++;
      const a = xs[i], c = xs[k + 1], lo = ys[j], hi = ys[j + 1];
      quad([a, lo, z1], [c, lo, z1], [c, hi, z1], [a, hi, z1], [0, 0, 1],
        [[ux(a), vy(lo)], [ux(c), vy(lo)], [ux(c), vy(hi)], [ux(a), vy(hi)]]);
      i = k;
    }
  }
  const front = P.length / 3;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!F(i, j)) continue;
    const a = xs[i], c = xs[i + 1], lo = ys[j], hi = ys[j + 1];
    if (!F(i - 1, j)) // -x
      quad([a, lo, z0], [a, lo, z1], [a, hi, z1], [a, hi, z0], [-1, 0, 0],
        [[ux(a) - du, vy(lo)], [ux(a), vy(lo)], [ux(a), vy(hi)], [ux(a) - du, vy(hi)]]);
    if (!F(i + 1, j) && !(openRight && i === nx - 1)) // +x
      quad([c, lo, z1], [c, lo, z0], [c, hi, z0], [c, hi, z1], [1, 0, 0],
        [[ux(c), vy(lo)], [ux(c) + du, vy(lo)], [ux(c) + du, vy(hi)], [ux(c), vy(hi)]]);
    if (!F(i, j - 1)) // -y
      quad([a, lo, z0], [c, lo, z0], [c, lo, z1], [a, lo, z1], [0, -1, 0],
        [[ux(a), vy(lo) - dv], [ux(c), vy(lo) - dv], [ux(c), vy(lo)], [ux(a), vy(lo)]]);
    if (!F(i, j + 1)) // +y
      quad([a, hi, z1], [c, hi, z1], [c, hi, z0], [a, hi, z0], [0, 1, 0],
        [[ux(a), vy(hi)], [ux(c), vy(hi)], [ux(c), vy(hi) + dv], [ux(a), vy(hi) + dv]]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.addGroup(0, front, 0);
  g.addGroup(front, P.length / 3 - front, 1);
  return g;
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
  // Plain rectangle (vanity strip: exactly the old geometry) or the full
  // wall with the window cut out (holes grown by `d`) and the east end open.
  const shaped = J.window.length > 0 || J.endsInCorner;
  const cutout = (d) => J.window.map((r) => grow(r, J.trimGap + d));
  const slab = (b, d = 0) => (shaped
    ? regionGeometry(THREE, b, cutout(d), rw, rh, x0, y0, { openRight: J.endsInCorner })
    : slabGeometry(THREE, b, rw, rh, x0, y0));
  let z = 0;
  if (J.buildOut > 0) {
    const boMat = keep(new THREE.MeshStandardMaterial({ color: 0xc4c6c0, roughness: 0.95 }));
    const g = keep(slab({ x0, x1, y0, y1, z0: z, z1: z + J.buildOut }));
    const m = new THREE.Mesh(g, [boMat, boMat]);
    m.name = 'buildOut'; m.receiveShadow = true; m.castShadow = true;
    group.add(m);
    z += J.buildOut;
  }
  if (J.thinset > 0) {
    const tsMat = keep(new THREE.MeshStandardMaterial({ color: 0x8d8b85, roughness: 1 }));
    const inset = mm(2);
    const g = keep(slab({ x0: x0 + inset, x1: x1 - inset, y0: y0 + inset, y1, z0: z, z1: z + J.thinset }, inset));
    const m = new THREE.Mesh(g, [tsMat, tsMat]);
    m.name = 'thinset'; m.receiveShadow = true;
    group.add(m);
    z += J.thinset;
  }
  {
    const g = keep(slab({ x0, x1, y0, y1, z0: z, z1: z + J.material }));
    const m = new THREE.Mesh(g, [faceMat, edgeMat]);
    m.name = 'accentFace'; m.receiveShadow = true; m.castShadow = !J.isWallpaper;
    group.add(m);
  }
  const caulkMat = () => keep(new THREE.MeshStandardMaterial({ color: option && option.groutColor ? option.groutColor : 0xdedcd6, roughness: 0.6 }));
  if (J.trimGap > 0) {
    // Caulk joint where the tile butts the window casing, stool horns and
    // apron: fills the gap from the drywall to 0.3 mm behind the shallower
    // of the tile face and the casing face.  (A tile that stands proud of
    // the casing shows its cut edge beyond the casing; nothing hides it.)
    const dep = Math.max(Math.min(J.face, J.casingProud) - mm(0.3), mm(0.6));
    const g = keep(regionGeometry(THREE, { x0, x1, y0, y1, z0: 0, z1: dep }, J.window, rw, rh, x0, y0,
      { only: cutout(0), openRight: J.endsInCorner }));
    const m = new THREE.Mesh(g, caulkMat());
    m.name = 'trimCaulk'; m.receiveShadow = true;
    group.add(m);
  }

  if (J.hasStrip) {
    // Brushed-nickel square-edge profile (Schluter QUADEC-style) sitting on
    // the existing eased edge: a 1/8" band whose front is flush with the
    // prouder of the two faces, its anchoring leg up behind the new tile.
    const nickel = keep(new THREE.MeshPhysicalMaterial({ color: 0xc4c3bd, metalness: 1, roughness: 0.3, anisotropy: 0.6 }));
    const d = J.strip.depth;
    const band = keep(new THREE.BoxGeometry(x1 - x0, J.strip.face, d));
    const bandM = new THREE.Mesh(band, nickel);
    bandM.position.set((x0 + x1) / 2, J.capTop + J.strip.face / 2, d / 2);
    const parts = [bandM];
    if (J.thinset > 0) {
      // perforated anchoring leg, buried in the thinset behind the new tile
      const lt = Math.min(J.strip.leg, J.thinset - mm(0.5));
      const leg = keep(new THREE.BoxGeometry(x1 - x0, inch(0.75), lt));
      const legM = new THREE.Mesh(leg, nickel);
      legM.position.set((x0 + x1) / 2, J.capTop + J.strip.face + inch(0.375), J.buildOut + lt / 2);
      parts.push(legM);
    }
    for (const m of parts) { m.castShadow = m.receiveShadow = true; m.name = 'schluterStrip'; group.add(m); }
  }
  if (J.joint > 0) {
    // Colour-matched caulk bead in the joint between the old edge and the
    // new material (stops 0.3 mm behind the new face).
    const caulk = caulkMat();
    const dep = Math.max(Math.min(J.face, J.wainscotProud) - mm(0.3), mm(0.6));
    const g = keep(new THREE.BoxGeometry(x1 - x0, J.joint, dep));
    const m = new THREE.Mesh(g, caulk);
    m.name = 'joint';
    m.position.set((x0 + x1) / 2, J.capTop + J.joint / 2, dep / 2);
    m.receiveShadow = true;
    group.add(m);
  }

  group.userData.junction = J;
  group.userData.surfaceOffsetM = J.face;   // pass to buildOvalMirror / sconces
  group.userData.dispose = () => { for (const d of disposables) d.dispose && d.dispose(); };
  return group;
}
