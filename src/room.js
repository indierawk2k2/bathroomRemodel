// buildRoom(ctx) -> THREE.Group with the shell: floor, ceilings, drywall,
// wainscot (real 13 mm-proud geometry with its eased cap), tub-alcove tile
// with the accent band, the tiled column, window, both doors and the window
// daylight.  Measurements come from src/config.js (docs/SPEC.md section 3).
import * as THREE from 'three';
import { inch, mm } from './units.js';
import { boxUV, box, mesh, stdMaterials } from './fixtures/util.js';

// ------------------------------------------------------------ geometry utils

/**
 * Flat wall face with rectangular holes, in world space with metre UVs.
 *   axis 'z': plane z = at, spans x in [from, to];  normal +1 => faces +z
 *   axis 'x': plane x = at, spans z in [from, to];  normal +1 => faces +x
 * holes: [[a0, a1, y0, y1], ...] in the same (along-wall, y) coordinates.
 */
function wallFace({ axis, at, from, to, y0, y1, normal, holes = [] }) {
  // Shape coordinate s is chosen so that after the rotation the shape's +Z
  // normal ends up pointing along the requested direction.
  const toS = (a) => {
    if (axis === 'z') return normal > 0 ? a : -a;
    return normal > 0 ? -a : a;
  };
  const rect = (a0, a1, b0, b1, path) => {
    const s0 = toS(a0), s1 = toS(a1);
    path.moveTo(Math.min(s0, s1), b0);
    path.lineTo(Math.max(s0, s1), b0);
    path.lineTo(Math.max(s0, s1), b1);
    path.lineTo(Math.min(s0, s1), b1);
    path.closePath();
    return path;
  };
  const shape = rect(from, to, y0, y1, new THREE.Shape());
  for (const h of holes) shape.holes.push(rect(h[0], h[1], h[2], h[3], new THREE.Path()));
  const g = new THREE.ShapeGeometry(shape);
  if (axis === 'z') {
    if (normal < 0) g.rotateY(Math.PI);
    g.translate(0, 0, at);
  } else {
    g.rotateY(normal > 0 ? Math.PI / 2 : -Math.PI / 2);
    g.translate(at, 0, 0);
  }
  g.computeVertexNormals();
  return boxUV(g);
}

/**
 * Prism of a 2D cross-section swept along a straight wall run.
 *   profile: [[d, h], ...] closed polygon; d = distance out from the wall
 *            plane, h = height above yBase.
 *   run: { axis, at, from, to, normal } as in wallFace.
 */
function prismAlong(profile, run, yBase, uvOrigin) {
  const { axis, at, from, to, normal } = run;
  const P = (d, h, a) =>
    axis === 'z' ? [a, yBase + h, at + normal * d] : [at + normal * d, yBase + h, a];
  const pos = [];
  const v3 = (p) => new THREE.Vector3(...p);
  // Push a triangle wound so its normal points along `out` (world).
  const tri = (p, q, r, out) => {
    const n = v3(q).sub(v3(p)).cross(v3(r).sub(v3(p)));
    if (n.dot(out) < 0) [q, r] = [r, q];
    pos.push(...p, ...q, ...r);
  };
  const n = profile.length;
  const cd = profile.reduce((s, p) => s + p[0], 0) / n, chh = profile.reduce((s, p) => s + p[1], 0) / n;
  const centre = v3(P(cd, chh, (from + to) / 2));
  for (let i = 0; i < n; i++) {
    const [d0, h0] = profile[i];
    const [d1, h1] = profile[(i + 1) % n];
    const a = P(d0, h0, from), b = P(d1, h1, from), c = P(d1, h1, to), e = P(d0, h0, to);
    const mid = v3(P((d0 + d1) / 2, (h0 + h1) / 2, (from + to) / 2));
    const out = mid.sub(centre);
    tri(a, b, c, out);
    tri(a, c, e, out);
  }
  // end caps (fan; profile is convex)
  const along = axis === 'z' ? new THREE.Vector3(Math.sign(to - from), 0, 0) : new THREE.Vector3(0, 0, Math.sign(to - from));
  for (let i = 1; i < n - 1; i++) {
    tri(P(...profile[0], from), P(...profile[i + 1], from), P(...profile[i], from), along.clone().negate());
    tri(P(...profile[0], to), P(...profile[i], to), P(...profile[i + 1], to), along);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return boxUV(g, uvOrigin);
}

const rectProfile = (d, h) => [[0, 0], [d, 0], [d, h], [0, h]];

// ------------------------------------------------------------------ builder

export function buildRoom(ctx) {
  const { config, textures } = ctx;
  const { ROOM, RECESS, WALL, WAINSCOT: W, ALCOVE, COLUMN, WINDOW, DOORS, MISC } = config;
  const group = new THREE.Group();
  group.name = 'room';
  const std = stdMaterials();

  // ---- materials
  const mat = {
    // the photo-derived albedo already carries the paint colour: tint only without it
    paint: textures.material('wall_paint', { color: textures.has('wall_paint') ? undefined : WALL.paint, roughness: 0.92 }),
    recessPaint: textures.material('wall_paint', { color: textures.has('wall_paint') ? undefined : WALL.recessPaint, roughness: 0.92 }),
    ceiling: new THREE.MeshStandardMaterial({ color: WALL.ceiling, roughness: 0.95 }),
    floor: textures.material('floor_plank', { roughness: 0.55 }),
    tile: textures.material('wainscot', { roughness: 0.5 }),
    band: textures.material('accent_band', { roughness: 0.5 }),
    cap: new THREE.MeshStandardMaterial({ color: W.capColor, roughness: 0.6, side: THREE.DoubleSide }),
    trim: new THREE.MeshStandardMaterial({ color: 0xf1f1ed, roughness: 0.45 }),
    doorTrim: new THREE.MeshStandardMaterial({ color: DOORS.trimColor, roughness: 0.5 }),
    door: textures.material('door_slab', { color: textures.has('door_slab') ? undefined : DOORS.slabColor, roughness: 0.55 }),
    groove: new THREE.MeshStandardMaterial({ color: 0x3f403e, roughness: 0.7 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xe8eef1,
      emissive: 0xd7e3ea,
      emissiveIntensity: 1.25,
      roughness: 0.35,
      emissiveMap: textures.frosted_glass || null,
      map: textures.frosted_glass || null,
    }),
  };
  // Tile surfaces are lined up with the course grid (grout at 4", 16"...).
  const courseOrigin = [0, W.courseOriginY, 0];

  const add = (o) => (group.add(o), o);

  // ---- floor (one polygon over room + recess)
  {
    const shape = new THREE.Shape(ROOM.polygon.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    boxUV(g);
    add(mesh(g, mat.floor, { name: 'floor', cast: false }));
  }

  // ---- ceilings
  {
    const main = new THREE.PlaneGeometry(ROOM.width, ROOM.depth);
    main.rotateX(Math.PI / 2);
    main.translate(ROOM.width / 2, ROOM.ceiling, ROOM.depth / 2);
    add(mesh(boxUV(main), mat.ceiling, { name: 'ceiling', cast: true }));
    const rw = RECESS.x1 - RECESS.x0, rd = RECESS.z1 - RECESS.z0;
    const rc = new THREE.PlaneGeometry(rw, rd);
    rc.rotateX(Math.PI / 2);
    rc.translate(RECESS.x0 + rw / 2, RECESS.ceiling, RECESS.z0 + rd / 2);
    add(mesh(boxUV(rc), mat.ceiling, { name: 'recessCeiling' }));
  }

  // ---- drywall
  const winHole = [WINDOW.trimX0 + WINDOW.trimW, WINDOW.trimX1 - WINDOW.trimW, WINDOW.sillTop, WINDOW.head - WINDOW.trimW];
  const D = DOORS;
  const walls = [
    ['wall_north', { axis: 'z', at: 0, from: 0, to: ROOM.width, y0: 0, y1: ROOM.ceiling, normal: 1, holes: [winHole] }],
    ['wall_west', { axis: 'x', at: 0, from: 0, to: ROOM.depth, y0: 0, y1: ROOM.ceiling, normal: 1 }],
    ['wall_east', { axis: 'x', at: ROOM.width, from: 0, to: ROOM.depth, y0: 0, y1: ROOM.ceiling, normal: -1,
      holes: [[D.east.z0, D.east.z1, 0, D.east.height]] }],
    ['wall_south_west', { axis: 'z', at: ROOM.depth, from: 0, to: RECESS.x0, y0: 0, y1: ROOM.ceiling, normal: -1 }],
    ['wall_south_east', { axis: 'z', at: ROOM.depth, from: RECESS.x1, to: ROOM.width, y0: 0, y1: ROOM.ceiling, normal: -1 }],
    // soffit face over the recess opening (96" -> 120")
    ['recess_header', { axis: 'z', at: RECESS.z0, from: RECESS.x0, to: RECESS.x1, y0: RECESS.ceiling, y1: ROOM.ceiling, normal: -1 }],
  ];
  for (const [name, w] of walls) add(mesh(wallFace({ ...w }), mat.paint, { name }));
  const recessWalls = [
    ['recess_west', { axis: 'x', at: RECESS.x0, from: RECESS.z0, to: RECESS.z1, y0: 0, y1: RECESS.ceiling, normal: 1 }],
    ['recess_east', { axis: 'x', at: RECESS.x1, from: RECESS.z0, to: RECESS.z1, y0: 0, y1: RECESS.ceiling, normal: -1 }],
    ['recess_south', { axis: 'z', at: RECESS.z1, from: RECESS.x0, to: RECESS.x1, y0: 0, y1: RECESS.ceiling, normal: -1,
      holes: [[D.recess.x0, D.recess.x1, 0, D.recess.height]] }],
  ];
  for (const [name, w] of recessWalls) add(mesh(wallFace({ ...w }), mat.recessPaint, { name }));

  // ---- wainscot: body + eased cap, 13 mm proud of the drywall
  const capH = W.capHeight, ch = W.capChamfer, t = W.proud;
  const capProfile = [[0, 0], [t, 0], [t, capH - ch], [t - ch, capH], [0, capH]];
  /** One straight wainscot run; returns {body, cap} meshes. */
  const wainscot = (name, run, top = W.top, material = mat.tile) => {
    const body = mesh(prismAlong(rectProfile(t, top - capH), run, 0, courseOrigin), material, { name: `wainscot_${name}` });
    const cap = mesh(prismAlong(capProfile, run, top - capH, courseOrigin), mat.cap, { name: `wainscotCap_${name}` });
    body.userData.run = cap.userData.run = { ...run, top, proud: t };
    add(body);
    add(cap);
    return { body, cap };
  };
  const R = config.REMODEL;
  // North wall.  Split at the accent-wall edges so the remodel scenario can
  // swap/hide the cap under the accent region only (x 30..76).
  wainscot('north_accent', { axis: 'z', at: 0, from: COLUMN.x1 + t, to: R.accentX1, normal: 1 });
  wainscot('north_east', { axis: 'z', at: 0, from: R.accentX1, to: ROOM.width - t, normal: 1 });
  // East wall up to the east door casing.
  wainscot('east', { axis: 'x', at: ROOM.width, from: 0, to: D.east.z0 - D.east.trim, normal: -1 });
  // South wall: east segment (thermostat wall) and the short piece between
  // the tub tile panel and the recess jamb.
  wainscot('south_east', { axis: 'z', at: ROOM.depth, from: RECESS.x1 - t, to: ROOM.width - t, normal: -1 });
  wainscot('south_west', { axis: 'z', at: ROOM.depth, from: ALCOVE.endPanelX1, to: RECESS.x0 + t, normal: -1 });
  // Recess side walls (wrap the outside corners at the opening).
  wainscot('recess_west', { axis: 'x', at: RECESS.x0, from: RECESS.z0 - t, to: RECESS.z1, normal: 1 });
  wainscot('recess_east', { axis: 'x', at: RECESS.x1, from: RECESS.z0 - t, to: RECESS.z1, normal: -1 });

  // ---- tub alcove tile (floor to 85", accent band 52..61")
  const tilePanel = (name, run) => {
    const y = [0, ALCOVE.bandBottom, ALCOVE.bandTop, ALCOVE.tileTop];
    add(mesh(prismAlong(rectProfile(t, y[1]), run, 0, courseOrigin), mat.tile, { name: `alcove_${name}_lower` }));
    add(mesh(prismAlong(rectProfile(t, y[2] - y[1]), run, y[1], [0, y[1], 0]), mat.band, { name: `alcove_${name}_band` }));
    add(mesh(prismAlong(rectProfile(t, y[3] - y[2] - capH), run, y[2], [0, y[2], 0]), mat.tile, { name: `alcove_${name}_upper` }));
    add(mesh(prismAlong(capProfile, run, y[3] - capH), mat.cap, { name: `alcove_${name}_cap` }));
  };
  tilePanel('west', { axis: 'x', at: 0, from: COLUMN.z1, to: ROOM.depth - t, normal: 1 });
  tilePanel('end', { axis: 'z', at: ROOM.depth, from: 0, to: ALCOVE.endPanelX1, normal: -1 });
  // exposed vertical edge of the end panel (photo 13: light eased edge)
  add(box(ALCOVE.endPanelX1 - mm(2), 0, ROOM.depth - t, ALCOVE.endPanelX1 + mm(1), ALCOVE.tileTop, ROOM.depth, mat.cap, { name: 'alcove_end_edge' }));

  // ---- column / chase at the north end of the alcove
  group.add(buildColumn(ctx, mat, courseOrigin));

  // ---- window
  group.add(buildWindow(ctx, mat, std));

  // ---- doors
  group.add(buildDoor(ctx, mat, std, 'recess'));
  group.add(buildDoor(ctx, mat, std, 'east'));

  // ---- daylight through the window
  addDaylight(ctx, group);

  return group;
}

// ------------------------------------------------------------------ column
function buildColumn(ctx, mat, courseOrigin) {
  const { COLUMN: C, ROOM } = ctx.config;
  const g = new THREE.Group();
  g.name = 'column';
  const o = { uvOrigin: courseOrigin };
  const [x0, x1, z0, z1] = [C.x0, C.x1, C.z0, C.z1];
  const cheek = x1 - C.sideWall;
  // ledge, top at 36"
  g.add(box(x0, 0, z0, x1, C.ledgeTop, z1, mat.tile, { ...o, name: 'column_ledge' }));
  // niche 1 (shampoo shelf): back + east cheek
  g.add(box(x0, C.niche1[0], z0, cheek, C.niche1[1], C.nicheBackZ, mat.tile, { ...o, name: 'column_niche1_back' }));
  g.add(box(cheek, C.niche1[0], z0, x1, C.niche1[1], z1, mat.tile, { ...o, name: 'column_niche1_cheek' }));
  // band box (dark accent band wraps its front, photo 26)
  g.add(box(x0, C.bandBox[0], z0, x1, C.bandBox[1], z1, mat.band, { uvOrigin: [0, C.bandBox[0], 0], name: 'column_band' }));
  // niche 2 (tissue box)
  g.add(box(x0, C.niche2[0], z0, cheek, C.niche2[1], C.nicheBackZ, mat.tile, { ...o, name: 'column_niche2_back' }));
  g.add(box(cheek, C.niche2[0], z0, x1, C.niche2[1], z1, mat.tile, { ...o, name: 'column_niche2_cheek' }));
  // top box carries the curtain rod flange
  g.add(box(x0, C.topBox[0], z0, x1, C.topBox[1], z1, mat.tile, { uvOrigin: [0, C.topBox[0], 0], name: 'column_top' }));
  // drywall chase from the tile top to the ceiling (photos 37, 40)
  g.add(box(x0, C.topBox[1], z0, x1, ROOM.ceiling, z1, mat.paint, { name: 'column_chase' }));
  return g;
}

// ------------------------------------------------------------------ window
function buildWindow(ctx, mat, std) {
  const { WINDOW: Wn } = ctx.config;
  const g = new THREE.Group();
  g.name = 'window';
  const tw = Wn.trimW, dep = Wn.jambDepth, pr = inch(0.6);
  const ix0 = Wn.trimX0 + tw, ix1 = Wn.trimX1 - tw, iy0 = Wn.sillTop, iy1 = Wn.head - tw;
  // casing (flat 2.5" trim, ~5/8" proud): sides + head
  g.add(box(Wn.trimX0, iy0, 0, ix0, Wn.head, pr, mat.trim, { name: 'window_casing_l' }));
  g.add(box(ix1, iy0, 0, Wn.trimX1, Wn.head, pr, mat.trim, { name: 'window_casing_r' }));
  g.add(box(ix0, iy1, 0, ix1, Wn.head, pr, mat.trim, { name: 'window_casing_head' }));
  // stool (sill) with 1.5" nose and short horns, apron below (photo 53)
  g.add(box(Wn.trimX0 - inch(0.5), iy0 - inch(0.75), -dep, Wn.trimX1 + inch(0.5), iy0, Wn.sillNose, mat.trim, { name: 'window_sill' }));
  g.add(box(Wn.trimX0, iy0 - inch(0.75) - inch(1.75), 0, Wn.trimX1, iy0 - inch(0.75), pr, mat.trim, { name: 'window_apron' }));
  // jamb returns (drywall wrapped, painted white like the trim)
  g.add(box(ix0 - inch(0.1), iy0, -dep, ix0, iy1, 0, mat.trim));
  g.add(box(ix1, iy0, -dep, ix1 + inch(0.1), iy1, 0, mat.trim));
  g.add(box(ix0, iy1, -dep, ix1, iy1 + inch(0.1), 0, mat.trim));
  // single-hung vinyl unit set back in the jamb
  const fz = -dep + inch(0.5);
  const fw = inch(1.25);
  const frame = (x0, y0, x1, y1, z0, z1, name) => {
    g.add(box(x0, y0, z0, x1, y0 + fw, z1, std.whitePlastic, { name }));
    g.add(box(x0, y1 - fw, z0, x1, y1, z1, std.whitePlastic));
    g.add(box(x0, y0, z0, x0 + fw, y1, z1, std.whitePlastic));
    g.add(box(x1 - fw, y0, z0, x1, y1, z1, std.whitePlastic));
  };
  frame(ix0, iy0, ix1, iy1, fz, fz + inch(2.5), 'window_frame');
  const midY = (iy0 + iy1) / 2;
  // upper (fixed) sash sits outboard, lower (sliding) sash inboard
  frame(ix0 + fw, midY - inch(0.6), ix1 - fw, iy1 - fw, fz, fz + inch(1), 'window_upper_sash');
  frame(ix0 + fw, iy0 + fw, ix1 - fw, midY + inch(0.6), fz + inch(1.1), fz + inch(2.1), 'window_lower_sash');
  // frosted (obscure) glass panes; they glow with daylight
  const pane = (y0, y1, z) => {
    const p = new THREE.PlaneGeometry(ix1 - ix0 - 4 * fw, y1 - y0);
    p.translate((ix0 + ix1) / 2, (y0 + y1) / 2, z);
    const m = mesh(boxUV(p), mat.glass, { name: 'window_glass', cast: false });
    g.add(m);
  };
  pane(midY + inch(0.6) - fw, iy1 - 2 * fw, fz + inch(0.5));
  pane(iy0 + 2 * fw, midY + inch(0.6) - fw, fz + inch(1.6));
  // sash lock on the meeting rail
  g.add(box((ix0 + ix1) / 2 - inch(1.2), midY + inch(0.55), fz + inch(1.6), (ix0 + ix1) / 2 + inch(1.2), midY + inch(0.95), fz + inch(2.4), std.whitePlastic));
  // little black 5x7 frame leaning on the sill (photo 37, right end)
  const pf = new THREE.Group();
  pf.add(box(-inch(2.75), 0, -inch(0.4), inch(2.75), inch(6.5), 0, std.black));
  const print = new THREE.MeshStandardMaterial({ color: 0x6d6a66, roughness: 0.8 });
  pf.add(box(-inch(1.6), inch(1.6), 0, inch(1.6), inch(5.0), inch(0.02), print));
  pf.position.set(Wn.trimX1 - inch(5.5), iy0, inch(0.3));
  pf.rotation.x = -0.18;
  pf.traverse((o) => (o.castShadow = o.receiveShadow = true));
  g.add(pf);
  return g;
}

// ------------------------------------------------------------------ doors
function buildDoor(ctx, mat, std, which) {
  const { DOORS } = ctx.config;
  const d = DOORS[which];
  const g = new THREE.Group();
  g.name = `door_${which}`;
  const W = inch(30), H = d.height, T = inch(1.375), tr = d.trim, jamb = inch(4.5), pr = inch(0.6);
  // Build in local space: opening spans x 0..W on the wall plane z = 0, room
  // side is +z, wall/hall side is -z.  Then place.
  const L = new THREE.Group();
  // casing on the room side
  L.add(box(-tr, 0, 0, 0, H + tr, pr, mat.doorTrim, { name: 'casing' }));
  L.add(box(W, 0, 0, W + tr, H + tr, pr, mat.doorTrim));
  L.add(box(0, H, 0, W, H + tr, pr, mat.doorTrim));
  // jamb
  L.add(box(-inch(0.75), 0, -jamb, 0, H, 0, mat.doorTrim));
  L.add(box(W, 0, -jamb, W + inch(0.75), H, 0, mat.doorTrim));
  L.add(box(0, H, -jamb, W, H + inch(0.75), 0, mat.doorTrim));
  // slab, closed, inset ~3/8" from the room face; 4 horizontal grooves
  const sz0 = -inch(0.375) - T, sz1 = -inch(0.375);
  L.add(box(inch(0.1), inch(0.5), sz0, W - inch(0.1), H - inch(0.1), sz1, mat.door, { name: 'slab' }));
  for (let i = 1; i <= 4; i++) {
    const y = (H / 5) * i;
    L.add(box(inch(0.1), y - inch(0.08), sz1 - inch(0.05), W - inch(0.1), y + inch(0.08), sz1 + inch(0.01), mat.groove));
  }
  // lever: satin nickel rose + handle, on the side away from the hinges
  // Both doors hinge at local x = 0 (recess: east jamb; east door: north jamb).
  const hingeAtX0 = true;
  const lx = hingeAtX0 ? W - inch(2.5) : inch(2.5);
  const dir = hingeAtX0 ? -1 : 1;
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(inch(1.25), inch(1.25), inch(0.4), 24), std.satinNickel);
  rose.rotation.x = Math.PI / 2;
  rose.position.set(lx, inch(36), sz1 + inch(0.2));
  L.add(rose);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(inch(4.2), inch(0.55), inch(0.55)), std.satinNickel);
  lever.position.set(lx + (dir * inch(4.2)) / 2 - dir * inch(0.4), inch(36), sz1 + inch(1.6));
  L.add(lever);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.3), inch(0.3), inch(1.4), 12), std.satinNickel);
  neck.rotation.x = Math.PI / 2;
  neck.position.set(lx, inch(36), sz1 + inch(0.9));
  L.add(neck);
  // hinges
  const hx = hingeAtX0 ? inch(0.05) : W - inch(0.05);
  for (const y of [inch(10), inch(40), inch(70)]) {
    L.add(box(hx - inch(0.1), y, sz1 - inch(0.2), hx + inch(0.1), y + inch(3.5), sz1 + inch(0.15), std.satinNickel));
  }
  L.traverse((o) => (o.castShadow = o.receiveShadow = true));

  if (which === 'recess') {
    // wall z = 110 facing -z (room side toward -z).  Local +z must map to
    // world -z, local +x to world -x: rotate 180 deg about Y.
    L.rotation.y = Math.PI;
    L.position.set(d.x1, 0, d.z);
  } else {
    // east wall x = 102 facing -x.  Local +z -> world -x, local +x -> world +z.
    L.rotation.y = -Math.PI / 2;
    L.position.set(d.x, 0, d.z0);
  }
  g.add(L);
  return g;
}

// ------------------------------------------------------------------ daylight
function addDaylight(ctx, group) {
  const { WINDOW: Wn } = ctx.config;
  const cx = (Wn.trimX0 + Wn.trimX1) / 2;
  const cy = (Wn.sillTop + Wn.head) / 2;
  // Overcast north light: a soft directional "sky" coming in and down through
  // the window, plus an area light at the glass.
  const sun = new THREE.DirectionalLight(0xe4ecf7, 0.9);
  sun.name = 'window_sun';
  sun.position.set(cx - inch(10), cy + inch(70), -inch(80));
  sun.target.position.set(cx - inch(20), 0, inch(55));
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = sun.shadow.camera;
  s.left = -2.2; s.right = 2.2; s.top = 2.2; s.bottom = -2.2; s.near = 0.5; s.far = 8;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 6;
  group.add(sun, sun.target);

  const w = Wn.trimX1 - Wn.trimX0 - 2 * Wn.trimW;
  const h = Wn.head - Wn.trimW - Wn.sillTop;
  const area = new THREE.RectAreaLight(0xe8f0fa, 2.2, w, h);
  area.name = 'window_area';
  area.position.set(cx, Wn.sillTop + h / 2, -inch(1.5));
  area.lookAt(cx, Wn.sillTop + h / 2, 1);
  group.add(area);
}
