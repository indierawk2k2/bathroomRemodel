// Placeholder wallpaper: muted botanical print, 0 mm (sits on the drywall,
// no thinset).  Exists to prove the wallpaper path.  Uses
// ctx.textures.wallpaper_sample when present, otherwise paints a seamless
// 21" x 21" repeat on a canvas.
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, hash2, makeCanvas, tileMaterial } from '../procedural.js';

const IN = 0.0254;
const REPEAT_M = [21 * IN, 21 * IN];

function makeWallpaper(THREE) {
  const S = 1024;
  const c = makeCanvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#dcd8c6';
  g.fillRect(0, 0, S, S);
  const greens = ['#7f8f6e', '#97a385', '#66755c', '#a9b199', '#5d6b57'];
  let seed = 1;
  const rnd = () => hash2(seed++, 7, 3);

  // Draw a primitive 9 times (wrapped) so the repeat is seamless.
  const wrap = (fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { g.save(); g.translate(dx, dy); fn(); g.restore(); } };

  const leaf = (x, y, len, wid, ang, col) => {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(len * 0.3, -wid, len * 0.75, -wid * 0.8, len, 0);
    g.bezierCurveTo(len * 0.75, wid * 0.8, len * 0.3, wid, 0, 0);
    g.fill();
    g.strokeStyle = 'rgba(235,232,215,0.55)'; g.lineWidth = Math.max(1, wid * 0.08);
    g.beginPath(); g.moveTo(len * 0.05, 0); g.lineTo(len * 0.9, 0); g.stroke();
    g.restore();
  };

  // Sprigs: a curved stem with alternating leaves.
  for (let k = 0; k < 14; k++) {
    const x0 = rnd() * S, y0 = rnd() * S, ang = rnd() * Math.PI * 2, L = 140 + rnd() * 120;
    const col = greens[Math.floor(rnd() * greens.length)];
    const bend = (rnd() - 0.5) * 0.9, n = 5 + Math.floor(rnd() * 4), lw = 26 + rnd() * 14;
    const leaves = [];
    for (let i = 0; i < n; i++) leaves.push([(i + 1) / (n + 1), i & 1 ? 1 : -1, 0.8 + rnd() * 0.4]);
    wrap(() => {
      g.save(); g.translate(x0, y0); g.rotate(ang);
      g.strokeStyle = '#6c7a5f'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, L * bend * 0.5, L, L * bend * 0.2); g.stroke();
      for (const [t, side, s] of leaves) {
        const px = L * t, py = L * bend * t * (1 - t) + L * bend * 0.2 * t * t;
        leaf(px, py, lw * 2.2 * s, lw * 0.55 * s, side * (0.7 + 0.2 * s), col);
      }
      leaf(L, L * bend * 0.2, lw * 2.0, lw * 0.5, 0.1, col);
      g.restore();
    });
  }
  // Small dusty-rose / ochre buds for a little warmth.
  for (let k = 0; k < 40; k++) {
    const x = rnd() * S, y = rnd() * S, r = 5 + rnd() * 6;
    const col = rnd() < 0.5 ? '#b99a86' : '#c2ab7d';
    wrap(() => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
  }
  // Paper grain.
  const img = g.getImageData(0, 0, S, S), d = img.data;
  const height = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = fbm(x, y, S, S, 128, 2, 13);
    const i = y * S + x;
    height[i] = n;
    const k = (n - 0.5) * 10;
    d[i * 4] += k; d[i * 4 + 1] += k; d[i * 4 + 2] += k;
  }
  g.putImageData(img, 0, 0);
  const rough = new Float32Array(S * S).fill(0.85);
  const coat = new Float32Array(S * S).fill(0);
  return buildMaps(THREE, { w: S, h: S, height, rough, coat }, { albedoCanvas: c, normalStrength: 1.5 });
}

export default {
  id: 'wallpaper-sample',
  name: 'Wallpaper: muted botanical (sample)',
  kind: 'wallpaper',
  order: 50,
  thicknessMm: 0,
  textureName: 'wallpaper_sample',
  repeatM: REPEAT_M,
  edgeColor: '#cfcab4',
  description: 'Placeholder wallpaper; 0 mm, no thinset',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    return tileMaterial(ctx, {
      textureName: 'wallpaper_sample',
      repeatClone,
      flatRoughness: 0.85,
      texLookup: {
        map: tex(ctx, 'wallpaper_sample'),
        normal: texCompanion(ctx, 'wallpaper_sample', 'normal'),
        roughness: texCompanion(ctx, 'wallpaper_sample', 'roughness'),
      },
      procedural: () => cached(THREE, 'wallpaper-sample', () => makeWallpaper(THREE)),
      params: { color: 0xffffff, roughness: 1.0, metalness: 0, normalScale: 0.6 },
    });
  },
  repeatFor(ctx) { return physicalSize(ctx, 'wallpaper_sample', REPEAT_M); },
};
