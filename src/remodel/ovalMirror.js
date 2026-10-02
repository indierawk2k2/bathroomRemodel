// The owner's oval mirror (photos 08-10): 56" tall x 23" wide overall,
// 1.5"-wide x 3/4"-deep cherry/mahogany frame with an eased outer edge and a
// small inner bead, real planar reflection (Reflector) clipped to the oval,
// backing board.  It hangs flat on the wall like a framed picture (hidden
// wire / felt bumpers, frame back 3/16" off the finished face): the black
// steel arms in photos 08-10 belong to the TV-stand mount it sits on today,
// not to the mirror, so they are not modelled.
//
//   buildOvalMirror(ctx, { bottomIn = 42, centreXIn = 55, surfaceOffsetM = 0,
//                          heightIn = 56, widthIn = 23,
//                          reflector: { textureWidth, textureHeight, clipBias,
//                                       multisample, color } | false })
//     -> THREE.Group   (userData.reflector = the Reflector mesh, or null)
//
// The group is placed in world coordinates: its origin is the oval centre on
// the wall face (z = surfaceOffsetM); local +z points into the room.
import { Reflector } from 'three/addons/objects/Reflector.js';
import { inch, mm, remodelDims, tex, texCompanion, physicalSize, repeatClone } from './cfg.js';
import { cached, fbm, makeCanvas } from '../options/procedural.js';

function ellipsePath(THREE, a, b, segs = 256, cw = false) {
  const pts = [];
  for (let i = 0; i < segs; i++) {
    const t = (cw ? -1 : 1) * (i / segs) * Math.PI * 2;
    pts.push(new THREE.Vector2(a * Math.cos(t), b * Math.sin(t)));
  }
  return pts;
}

/** Cherry/mahogany grain that follows the oval (UVs are bbox-normalised). */
function woodGrainTexture(THREE, aspect) {
  return cached(THREE, 'oval-wood-grain', () => {
    const W = 512, H = Math.round(512 * aspect);
    const c = makeCanvas(W, H), g = c.getContext('2d');
    const img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W * 2 - 1, v = y / H * 2 - 1;
      const rr = Math.hypot(u, v);                   // elliptical "radius"
      const ang = Math.atan2(v, u);
      const n = fbm(x, y, W, H, 8, 3, 21);
      const ring = 0.5 + 0.5 * Math.sin((rr * 260 + n * 9 + Math.sin(ang * 23) * 0.6) );
      const fleck = fbm(x, y, W, H, 64, 2, 5);
      const t = 0.55 * ring + 0.45 * fleck;
      const i = (y * W + x) * 4;
      d[i] = 92 + 38 * t; d[i + 1] = 33 + 14 * t; d[i + 2] = 22 + 9 * t; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}

export function buildOvalMirror(ctx, opts = {}) {
  const { THREE } = ctx;
  const D = remodelDims(ctx);
  const H = inch(opts.heightIn ?? 56), W = inch(opts.widthIn ?? 23);
  const bottom = opts.bottomIn != null ? inch(opts.bottomIn) : D.mirrorBottom;
  const cx = opts.centreXIn != null ? inch(opts.centreXIn) : D.mirrorCentreX;
  const surface = opts.surfaceOffsetM ?? 0;
  const FW = inch(1.5), FD = inch(0.75), BEV = mm(3.5);
  const STANDOFF = inch(0.1875);       // felt bumpers: frame back 3/16" off the wall
  const a = W / 2, b = H / 2;          // outer semi-axes
  const ai = a - FW, bi = b - FW;      // inner (sight) semi-axes

  const group = new THREE.Group();
  group.name = 'ovalMirror';
  group.position.set(cx, bottom + b, surface);
  const disposables = [];
  const keep = (o) => { disposables.push(o); return o; };

  // ---- frame: elliptical ring, extruded with a bevel -----------------------
  const outer = new THREE.Shape(ellipsePath(THREE, a - BEV, b - BEV));
  outer.holes.push(new THREE.Path(ellipsePath(THREE, ai + BEV, bi + BEV, 256, true)));
  const frameGeo = keep(new THREE.ExtrudeGeometry(outer, {
    depth: FD - 2 * BEV, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV,
    bevelSegments: 4, curveSegments: 1, steps: 1,
  }));
  frameGeo.translate(0, 0, BEV + STANDOFF);  // back of frame at z = STANDOFF
  const woodTex = tex(ctx, 'wood_frame');
  // UVs: texture pack -> grain (the map's V axis) follows the oval, in
  // repeats of the pack's physical size; procedural -> bbox-normalised.
  const ps = physicalSize(ctx, 'wood_frame', [0.1016, 0.1016]);
  // Arc length round the frame's centre-line ellipse, so the grain keeps its
  // true scale everywhere (the angle parameter alone squashes it 0.6x at the
  // top and bottom of a 23x56 oval and stretches it 1.4x at the sides).
  const am = a - FW / 2, bm = b - FW / 2, NS = 1024;
  const arc = new Float32Array(NS + 1);
  for (let k = 1; k <= NS; k++) {
    const t = -Math.PI + (2 * Math.PI * (k - 0.5)) / NS;
    arc[k] = arc[k - 1] + Math.hypot(am * Math.sin(t), bm * Math.cos(t)) * (2 * Math.PI / NS);
  }
  const perim = arc[NS];
  const vRepeats = Math.max(1, Math.round(perim / ps[1]));   // whole repeats round the oval
  const arcAt = (t) => {
    const f = ((t + Math.PI) / (2 * Math.PI)) * NS, k = Math.min(NS - 1, Math.max(0, Math.floor(f)));
    return arc[k] + (arc[k + 1] - arc[k]) * (f - k);
  };
  const meanR = (am + bm) / 2;
  const ovalUV = (g) => {
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      if (!woodTex) { uv.setXY(i, x / W + 0.5, y / H + 0.5); continue; }
      const t = Math.atan2(y / b, x / a);                      // seam at the west side
      // across the grain: distance out from the centre line, plus depth, so
      // the side walls and bevels unroll at true scale too
      const r = (Math.hypot(x / a, y / b) - 1) * meanR - p.getZ(i);
      uv.setXY(i, r / ps[0], (arcAt(t) / perim) * vRepeats);
    }
    if (!woodTex || g.index) return;
    // non-indexed: unwrap triangles that straddle the seam
    for (let i = 0; i < p.count; i += 3) {
      const v = [uv.getY(i), uv.getY(i + 1), uv.getY(i + 2)];
      if (Math.max(...v) - Math.min(...v) > vRepeats / 2) {
        for (let k = 0; k < 3; k++) if (v[k] < vRepeats / 2) uv.setY(i + k, v[k] + vRepeats);
      }
    }
  };
  ovalUV(frameGeo);
  const woodMat = keep(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.42, metalness: 0,
    clearcoat: 0.55, clearcoatRoughness: 0.28,
    map: woodTex ? repeatClone(THREE, woodTex, true) : woodGrainTexture(THREE, H / W),
  }));
  if (woodTex) {
    const n = texCompanion(ctx, 'wood_frame', 'normal');
    if (n) woodMat.normalMap = repeatClone(THREE, n, false);
  }
  // The pack's wood_frame albedo is already the cherry colour (photo 09):
  // keep the material colour white so it is not multiplied in twice.
  // Side walls + bevels (ExtrudeGeometry group 1) are only ~1 cm wide and seen
  // at grazing angles, where the long-grain map aliases into stripes: they get
  // the wood's mean colour (photo 09) under the same clearcoat instead.
  const sideMat = keep(new THREE.MeshPhysicalMaterial({ color: woodTex ? 0x7a4238 : 0x6a3424, roughness: 0.45, clearcoat: 0.55, clearcoatRoughness: 0.28 }));
  const frame = new THREE.Mesh(frameGeo, [woodMat, sideMat]);
  frame.name = 'mirrorFrame';
  frame.castShadow = frame.receiveShadow = true;
  group.add(frame);

  // Inner bead: a thin raised lip just inside the frame (photo 09 shows a
  // second facet line along the sight edge).
  {
    const s = new THREE.Shape(ellipsePath(THREE, ai + mm(1), bi + mm(1)));
    s.holes.push(new THREE.Path(ellipsePath(THREE, ai - mm(5), bi - mm(5), 256, true)));
    const g = keep(new THREE.ExtrudeGeometry(s, { depth: mm(4), bevelEnabled: true, bevelThickness: mm(1.5), bevelSize: mm(1.5), bevelSegments: 2, curveSegments: 1 }));
    g.translate(0, 0, STANDOFF + mm(6));
    ovalUV(g);
    const bead = new THREE.Mesh(g, [woodMat, sideMat]);
    bead.name = 'mirrorBead';
    bead.castShadow = true;
    group.add(bead);
  }

  // ---- glass: Reflector clipped to the oval ------------------------------
  const glassZ = STANDOFF + mm(7);
  const glassGeo = keep(new THREE.ShapeGeometry(new THREE.Shape(ellipsePath(THREE, ai + mm(3), bi + mm(3), 128)), 1));
  let reflector = null;
  if (opts.reflector !== false) {
    const r = opts.reflector || {};
    reflector = new Reflector(glassGeo, {
      textureWidth: r.textureWidth || 1536,
      textureHeight: r.textureHeight || 1536,
      clipBias: r.clipBias ?? 0.003,
      multisample: r.multisample ?? 4,
      color: r.color ?? 0x7a7a7a,     // ~0.5 = neutral; slightly below = silvered loss
    });
    reflector.name = 'mirrorGlass';
  } else {
    reflector = new THREE.Mesh(glassGeo, keep(new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.02 })));
    reflector.name = 'mirrorGlass (env only)';
  }
  reflector.position.z = glassZ;
  group.add(reflector);

  // ---- backing board -----------------------------------------------------
  {
    const s = new THREE.Shape(ellipsePath(THREE, a - mm(8), b - mm(8), 128));
    const g = keep(new THREE.ExtrudeGeometry(s, { depth: inch(0.25), bevelEnabled: false, curveSegments: 1 }));
    g.translate(0, 0, STANDOFF - inch(0.25) + mm(2));
    const m = new THREE.Mesh(g, keep(new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.9 })));
    m.name = 'mirrorBacking';
    m.castShadow = true;
    group.add(m);
  }

  // ---- contact shadow on the wall --------------------------------------
  // The mirror hangs flat like a framed picture: a hidden wire on the back,
  // felt bumpers holding the frame STANDOFF off the finished face, and the
  // backing board (above) closing that gap so no light shows behind it.
  // Point-light shadow maps are far too coarse to resolve a 3/16" gap, so the
  // frame's contact shadow is a soft dark ring drawn on the wall just outside
  // the frame (vertex alpha, darkest where the frame meets the wall), offset
  // a touch downwards because the light comes from above.
  {
    const rings = [[-0.25, 0.8], [0.0, 0.7], [0.08, 0.5], [0.2, 0.26], [0.4, 0.09], [0.7, 0]];   // [inches out, alpha]
    const SEG = 192, P = [], C = [], I = [];
    rings.forEach(([d, al], r) => {
      for (let i = 0; i < SEG; i++) {
        const t = (i / SEG) * Math.PI * 2;
        P.push((a + inch(d)) * Math.cos(t), (b + inch(d)) * Math.sin(t) - inch(0.12), mm(0.6));
        C.push(0, 0, 0, al);
        if (r > 0) {
          const j = (i + 1) % SEG, o = (r - 1) * SEG, n = r * SEG;
          I.push(o + i, n + i, n + j, o + i, n + j, o + j);
        }
      }
    });
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 4));
    g.setIndex(I);
    const m = new THREE.Mesh(g, keep(new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    })));
    m.name = 'mirrorContactShadow';
    m.renderOrder = 1;
    group.add(m);
  }

  group.userData.reflector = reflector;
  group.userData.dims = { H, W, frameWidth: FW, frameDepth: FD, standoff: STANDOFF, bottom, centreX: cx };
  group.userData.dispose = () => {
    for (const d of disposables) d.dispose && d.dispose();
    if (reflector && reflector.dispose) reflector.dispose();
  };
  return group;
}
