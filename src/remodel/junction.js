// Junction inspector: when the camera is within 30" of the accent/wainscot
// junction (x 55", y 40", z 0) in the remodel scenario, show
//  (a) a 2D cross-section inset on <canvas id="junction-inset"> (bottom-left)
//  (b) thin 3D dimension lines + sprite labels at the junction.
//
//   const insp = createJunctionInspector(ctx, { force?, radiusIn?, parent? });
//   insp.update(cameraPosition, state);   // call every frame; self-throttles to 10 Hz
//   insp.dispose();
//
// `state` may be a plain object or an observable with get(key); keys read:
//   scenario ('current' | 'remodel'), tile (option id), transition,
//   thicknessMmOverride | tileThicknessMm (number, optional),
//   accentBottomIn (optional).
import { inch, mm, remodelDims, readState } from './cfg.js';
import { computeJunction, resolveTile, TRANSITIONS } from './accentWall.js';

/** "13 mm (1/2\")" style label; inches rounded to the nearest 1/16. */
export function fmtMmIn(m, { signed = false } = {}) {
  const v = m * 1000;
  const sign = v < -0.05 ? '-' : (signed && v > 0.05 ? '+' : '');
  const a = Math.abs(v);
  const mmTxt = a < 0.05 ? '0' : (a < 9.95 ? a.toFixed(1).replace(/\.0$/, '') : Math.round(a).toString());
  return `${sign}${mmTxt} mm (${sign}${fracIn(a / 25.4)})`;
}

export function fracIn(inches) {
  let n = Math.round(inches * 16);
  if (n === 0) return inches > 1 / 64 ? '<1/16"' : '0"';
  const whole = Math.floor(n / 16);
  n -= whole * 16;
  let d = 16;
  while (n && n % 2 === 0) { n /= 2; d /= 2; }
  const frac = n ? `${n}/${d}` : '';
  return whole ? `${whole}${frac ? ' ' + frac : ''}"` : `${frac}"`;
}

function stateOpts(state) {
  const ovr = readState(state, 'tileThicknessMmOverride',
    readState(state, 'thicknessMmOverride', readState(state, 'tileThicknessMm', null)));
  return {
    tile: readState(state, 'tile', undefined),
    transition: readState(state, 'transition', TRANSITIONS[0].id),
    thicknessMmOverride: typeof ovr === 'number' && ovr > 0 ? ovr : undefined,
  };
}

// ---------------------------------------------------------------- 2D inset
function drawInset(canvas, J, title) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const CW = 360, CH = 240;
  if (canvas.width !== CW * dpr) { canvas.width = CW * dpr; canvas.height = CH * dpr; }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, CW, CH);
  g.fillStyle = 'rgba(20,22,24,0.86)';
  g.fillRect(0, 0, CW, CH);
  let fs = 12;
  do { g.font = `600 ${fs}px system-ui, sans-serif`; fs -= 0.5; } while (fs > 8 && g.measureText(title).width > CW - 20);
  g.fillStyle = '#f2efe8';
  g.fillText(title, 10, 17);

  // Plot box and isotropic mm scale.
  const box = { x: 14, y: 26, w: 206, h: 204 };
  const toMm = (m) => m * 1000;
  const zMin = -9, zMax = Math.max(toMm(J.face), toMm(J.wainscotProud)) + 8;
  const yMid = (toMm(J.capBottom) - 10 + toMm(J.capTop) + 16) / 2;
  const s = Math.min(box.w / (zMax - zMin), box.h / (toMm(J.capTop) - toMm(J.capBottom) + 26));
  const X = (zm) => box.x + (toMm(zm) - zMin) * s;
  const Y = (ym) => box.y + box.h / 2 - (toMm(ym) - yMid) * s;
  const yHi = (yMid + box.h / 2 / s) / 1000, yLo = (yMid - box.h / 2 / s) / 1000;
  g.save();
  g.beginPath(); g.rect(box.x, box.y, box.w, box.h); g.clip();
  const rect = (z0, z1, y0, y1, fill, stroke) => {
    g.fillStyle = fill; g.fillRect(X(z0), Y(y1), X(z1) - X(z0), Y(y0) - Y(y1));
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.strokeRect(X(z0), Y(y1), X(z1) - X(z0), Y(y0) - Y(y1)); }
  };
  // Drywall (hatched)
  rect(-0.0127, 0, yLo, yHi, '#d9d5cc');
  g.strokeStyle = 'rgba(0,0,0,0.18)';
  for (let k = -20; k < 40; k++) { g.beginPath(); g.moveTo(X(-0.0127), Y(yLo) - k * 10); g.lineTo(X(0), Y(yLo) - k * 10 - (X(0) - X(-0.0127))); g.stroke(); }
  // Existing wainscot: 12x24 field tile on 3 mm thinset, 13 mm proud, its
  // top course finished with a factory eased edge (light-sand lip).
  const P = J.wainscotProud, wt = J.wainscotThinset, ch = J.capChamfer;
  rect(0, wt, yLo, J.capTop, '#7d7a74');
  g.fillStyle = '#9a968f'; g.strokeStyle = '#55524d'; g.lineWidth = 1;
  g.beginPath();
  g.moveTo(X(wt), Y(yLo)); g.lineTo(X(P), Y(yLo));
  g.lineTo(X(P), Y(J.capTop - ch)); g.lineTo(X(P - ch), Y(J.capTop));
  g.lineTo(X(wt), Y(J.capTop)); g.closePath(); g.fill(); g.stroke();
  // the eased lip reads as a light-sand band on the top ~6 mm
  g.fillStyle = 'rgba(214,200,176,0.85)';
  // (a thin skin over the chamfer and the top face of the tile)
  const sk = mm(0.9);
  g.beginPath();
  g.moveTo(X(P), Y(J.capBottom)); g.lineTo(X(P), Y(J.capTop - ch)); g.lineTo(X(P - ch), Y(J.capTop));
  g.lineTo(X(wt), Y(J.capTop)); g.lineTo(X(wt), Y(J.capTop - sk));
  g.lineTo(X(P - ch - sk * 0.4), Y(J.capTop - sk)); g.lineTo(X(P - sk), Y(J.capTop - ch - sk * 0.4));
  g.lineTo(X(P - sk), Y(J.capBottom)); g.closePath(); g.fill();
  if (J.hasStrip) {
    rect(0, J.strip.depth, J.capTop, J.capTop + J.strip.face, '#e2e2dc', '#77776f');
    if (J.thinset > 0) rect(J.buildOut, J.buildOut + Math.min(J.strip.leg, J.thinset - 0.0005), J.capTop + J.strip.face, J.capTop + J.strip.face + 0.019, '#e2e2dc');
  }
  if (J.joint > 0) rect(0, Math.max(Math.min(J.face, P) - 0.0003, 0.0006), J.capTop, J.capTop + J.joint, (J.option && J.option.groutColor) || '#dedcd6', '#8a8780');
  // New build-up
  let z = 0;
  if (J.buildOut > 0) { rect(0, J.buildOut, J.bottom, yHi, '#c4c6c0', '#7c7e78'); z += J.buildOut; }
  if (J.thinset > 0) { rect(z, z + J.thinset, J.bottom, yHi, '#77756f'); z += J.thinset; }
  rect(z, z + J.material, J.bottom, yHi, (J.option && J.option.edgeColor) || '#8fa088', '#2d3a2a');
  // Face guide lines
  g.setLineDash([3, 3]); g.strokeStyle = '#ffb347'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(P), Y(yLo)); g.lineTo(X(P), Y(yHi)); g.stroke();
  g.strokeStyle = '#7fd4ff';
  g.beginPath(); g.moveTo(X(J.face), Y(yLo)); g.lineTo(X(J.face), Y(yHi)); g.stroke();
  g.setLineDash([]);
  // 40" datum
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.beginPath(); g.moveTo(X(-0.0127), Y(J.capTop)); g.lineTo(box.x + box.w, Y(J.capTop)); g.stroke();
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.strokeRect(box.x, box.y, box.w, box.h);
  g.font = '10px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,0.6)';
  g.fillText('drywall', box.x + 2, box.y + box.h - 4);
  g.fillText(`${(J.capTop / 0.0254).toFixed(2).replace(/\.?0+$/, '')}" AFF`, box.x + box.w - 44, Y(J.capTop) - 3);

  // Legend / dimensions
  const lx = 230; let ly = 44;
  const line = (label, value, col) => {
    g.fillStyle = col; g.fillRect(lx, ly - 8, 8, 8);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '10px system-ui, sans-serif';
    g.fillText(label, lx + 12, ly);
    g.fillStyle = '#ffffff'; g.font = '600 11px system-ui, sans-serif';
    g.fillText(value, lx + 12, ly + 13);
    ly += 31;
  };
  line('Wainscot face', fmtMmIn(P), '#ffb347');
  if (J.buildOut > 0) line('Build-out', fmtMmIn(J.buildOut), '#c4c6c0');
  line(J.isPaint ? 'Paint' : J.isWallpaper ? 'Wallpaper' : `Tile + ${Math.round(J.thinset * 1000)} mm thinset`, fmtMmIn(J.material + J.thinset), (J.option && J.option.edgeColor) || '#8fa088');
  line('New face', fmtMmIn(J.face), '#7fd4ff');
  const st = J.step;
  const stepTxt = Math.abs(st) < 0.0005 ? 'flush' : (st > 0 ? 'new face proud' : 'new face recessed');
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '10px system-ui, sans-serif';
  g.fillText('Step at the junction', lx, ly);
  g.fillStyle = Math.abs(st) < 0.0015 ? '#9be89b' : '#ffd36b'; g.font = '700 13px system-ui, sans-serif';
  g.fillText(fmtMmIn(st, { signed: true }), lx, ly + 15);
  g.font = '10px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillText(stepTxt, lx, ly + 28);
}

// ---------------------------------------------------------------- 3D lines
function labelSprite(THREE, text, colour = '#ffd36b') {
  const c = document.createElement('canvas');
  const g0 = c.getContext('2d');
  const font = '600 26px system-ui, sans-serif';
  g0.font = font;
  const tw = Math.ceil(g0.measureText(text).width) + 28;
  c.width = tw; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(15,15,15,0.78)';
  g.beginPath(); if (g.roundRect) g.roundRect(2, 8, tw - 4, 48, 10); else g.rect(2, 8, tw - 4, 48); g.fill();
  g.font = font; g.fillStyle = colour; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, tw / 2, 33);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, toneMapped: false });
  const s = new THREE.Sprite(m);
  const hM = inch(0.6);
  s.scale.set(hM * tw / 64, hM, 1);
  s.renderOrder = 999;
  return s;
}

function buildDims(THREE, J, x) {
  const grp = new THREE.Group();
  grp.name = 'junctionDims';
  const pts = [];
  const seg = (a, b) => pts.push(...a, ...b);
  const tick = inch(0.18);
  // Dimension along z at height y, from z0 to z1, with end ticks.
  const dimZ = (y, z0, z1) => {
    seg([x, y, z0], [x, y, z1]);
    seg([x, y - tick, z0], [x, y + tick, z0]);
    seg([x, y - tick, z1], [x, y + tick, z1]);
  };
  const yW = J.capBottom - inch(0.6);
  const yN = J.bottom + inch(0.9);
  dimZ(yW, 0, J.wainscotProud);
  dimZ(yN, 0, J.face);
  // Extension lines up/down the faces, and the step between faces at 40".
  seg([x, yW, J.wainscotProud], [x, J.capTop, J.wainscotProud]);
  seg([x, J.capTop, J.face], [x, yN, J.face]);
  if (Math.abs(J.step) > 0.0003) dimZ(J.capTop + inch(0.25), J.wainscotProud, J.face);
  // A short run along x marking the junction line itself.
  seg([x - inch(3), J.capTop, J.wainscotProud + mm(0.5)], [x + inch(3), J.capTop, J.wainscotProud + mm(0.5)]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const lm = new THREE.LineBasicMaterial({ color: 0xffa630, depthTest: false, transparent: true, toneMapped: false });
  const ls = new THREE.LineSegments(g, lm);
  ls.renderOrder = 998;
  grp.add(ls);
  const l1 = labelSprite(THREE, `wainscot ${fmtMmIn(J.wainscotProud)}`, '#ffb347');
  l1.position.set(x + inch(1.6), yW - inch(0.35), J.wainscotProud + inch(0.6));
  const l2 = labelSprite(THREE, `new face ${fmtMmIn(J.face)}`, '#7fd4ff');
  l2.position.set(x + inch(1.6), yN + inch(0.35), J.face + inch(0.6));
  const l3 = labelSprite(THREE, `step ${fmtMmIn(J.step, { signed: true })}`, Math.abs(J.step) < 0.0015 ? '#9be89b' : '#ffd36b');
  l3.position.set(x - inch(2.2), J.capTop + inch(0.45), Math.max(J.face, J.wainscotProud) + inch(0.6));
  grp.add(l1, l2, l3);
  return grp;
}

export function createJunctionInspector(ctx, opts = {}) {
  const { THREE, scene } = ctx;
  const D = remodelDims(ctx);
  const point = new THREE.Vector3(D.junctionX, D.junctionY, D.junctionZ);
  const radius = opts.radiusIn != null ? inch(opts.radiusIn) : D.junctionRadius;
  let canvas = null;
  if (typeof document !== 'undefined') {
    canvas = document.getElementById('junction-inset');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'junction-inset';
      (opts.parent || document.body).appendChild(canvas);
    }
    Object.assign(canvas.style, {
      position: 'fixed', left: '12px', bottom: '12px', width: '360px', height: '240px',
      borderRadius: '8px', boxShadow: '0 4px 18px rgba(0,0,0,0.45)', pointerEvents: 'none',
      zIndex: 20, display: 'none',
    });
  }
  let dims = null, key = '', last = -1e9, shown = false;
  const holder = new THREE.Group();
  holder.name = 'junctionInspector';
  holder.visible = false;
  if (scene) scene.add(holder);

  function clearDims() {
    if (!dims) return;
    dims.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    holder.remove(dims);
    dims = null;
  }

  function setShown(v) {
    shown = v;
    holder.visible = v;
    if (canvas) canvas.style.display = v ? 'block' : 'none';
  }

  return {
    group: holder,
    get visible() { return shown; },
    update(cameraPos, state) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (now - last < 100) return;           // <= 10 Hz
      last = now;
      const scen = readState(state, 'scenario', 'remodel');
      const near = cameraPos ? cameraPos.distanceTo(point) < radius : false;
      const want = !!(opts.force || (scen === 'remodel' && near));
      if (!want) { if (shown) setShown(false); return; }
      const so = stateOpts(state);
      // the option object too: an edited custom paint keeps its id but
      // changes colour / thickness
      const o = resolveTile(so.tile);
      const k = JSON.stringify(so) + (o ? `|${o.edgeColor}|${o.thicknessMm}|${o.name}` : '');
      if (k !== key || !dims) {
        key = k;
        const J = computeJunction(ctx, so);
        clearDims();
        dims = buildDims(THREE, J, D.junctionX);
        holder.add(dims);
        if (canvas) {
          const tname = J.option ? J.option.name.replace(/\s*\(.*\)$/, '') : '';
          const tr = TRANSITIONS.find((t) => t.id === J.transition);
          drawInset(canvas, J, `${tname} — ${tr ? tr.name : J.transition}`);
        }
      }
      if (!shown) setShown(true);
    },
    dispose() {
      clearDims();
      if (scene) scene.remove(holder);
      if (canvas && canvas.parentNode && !opts.keepCanvas) canvas.parentNode.removeChild(canvas);
    },
  };
}
