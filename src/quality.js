// Render pipeline + quality levels (br-uio).
//
//   const q = createQuality({ THREE, renderer, scene, camera, ctx, frameRef, initial, auto });
//   q.render()            draw one frame (composer or direct, per level)
//   q.resize()            after a window resize
//   q.set('medium')       change level (manual choices are saved in localStorage)
//   q.tick(now, fps)      once per frame: automatic step-down
//   q.sizeReflectors()    keep every Reflector's target in step with the view
//   q.measure(n)          n synchronous frames -> { msPerFrame, fps, level, buffer }
//
// High   pixel ratio 2, MSAA 4, GTAO (half-res), bloom, reflector 1200 px tall,
//        sun shadow 2048, point/spot shadows 1024
// Medium pixel ratio 1.5, MSAA 4, AO off, bloom, reflector 900, shadows 2048 / 512
// Low    pixel ratio 1, no post (direct render + MSAA), reflector 600, shadows 1024 / 256
// Auto step-down: if the rolling fps stays under 30 for 3 s, drop one level.
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const LEVELS = {
  high: { id: 'high', name: 'High', pixelRatio: 2, post: true, ao: true, bloom: true, msaa: 4,
    reflectorSize: 1200, reflectorSamples: 4, sunShadow: 2048, pointShadow: 1024, spotShadow: 1024 },
  medium: { id: 'medium', name: 'Medium', pixelRatio: 1.5, post: true, ao: false, bloom: true, msaa: 4,
    reflectorSize: 900, reflectorSamples: 2, sunShadow: 2048, pointShadow: 512, spotShadow: 512 },
  low: { id: 'low', name: 'Low', pixelRatio: 1, post: false, ao: false, bloom: false, msaa: 0,
    reflectorSize: 600, reflectorSamples: 0, sunShadow: 1024, pointShadow: 256, spotShadow: 512 },
};
export const ORDER = ['high', 'medium', 'low'];
const STORE_KEY = 'bathroomViewer.quality';

export function savedLevel() {
  try {
    const v = localStorage.getItem(STORE_KEY);
    return LEVELS[v] ? v : null;
  } catch {
    return null;
  }
}
function saveLevel(id) {
  try { localStorage.setItem(STORE_KEY, id); } catch { /* private mode etc. */ }
}

export function createQuality({ THREE, renderer, scene, camera, ctx, frameRef, initial = 'high', auto = true, onChange }) {
  let level = LEVELS[initial] || LEVELS.high;
  let autoDropped = false;
  let composer = null, gtao = null, bloom = null;
  let belowSince = 0, graceUntil = 0;

  const size = () => [innerWidth, innerHeight];
  const pixelRatio = () => Math.min(level.pixelRatio, window.devicePixelRatio || 1);

  function buildComposer() {
    disposeComposer();
    if (!level.post) return;
    const [w, h] = size();
    const pr = pixelRatio();
    const rt = new THREE.WebGLRenderTarget(Math.round(w * pr), Math.round(h * pr), {
      type: THREE.HalfFloatType, samples: level.msaa,
    });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    if (level.ao) {
      gtao = new GTAOPass(scene, camera, w, h);
      // AO at half resolution: the blend upsamples it with linear filtering.
      const setSize = gtao.setSize.bind(gtao);
      gtao.setSize = (W, H) => setSize(Math.max(1, Math.round(W / 2)), Math.max(1, Math.round(H / 2)));
      gtao.setSize(Math.round(w * pr), Math.round(h * pr));
      gtao.blendIntensity = 0.85;
      gtao.updateGtaoMaterial({ radius: 0.22, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 });
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      // Glass, sprites and labels must not occlude; the Reflector must not
      // re-render its reflection for the normal/depth pass.
      const ov = gtao.overrideVisibility.bind(gtao), rv = gtao.restoreVisibility.bind(gtao);
      gtao.overrideVisibility = () => {
        ov();
        frameRef.inOverride = true;
        scene.traverse((o) => {
          if (o.isSprite || o.isReflector || o.userData.noAO) o.visible = false;
          else if (o.isMesh && [].concat(o.material).some((m) => m && (m.transparent || m.alphaTest > 0))) o.visible = false;
        });
      };
      gtao.restoreVisibility = () => { rv(); frameRef.inOverride = false; };
      composer.addPass(gtao);
    }
    if (level.bloom) {
      // Bloom on the HDR buffer, before tone mapping: only emissive glass
      // and hot speculars (> ~1.0 linear) bleed.
      bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.14, 0.3, 1.1);
      composer.addPass(bloom);
    }
    composer.addPass(new OutputPass());
  }
  function disposeComposer() {
    if (!composer) return;
    for (const p of composer.passes) p.dispose && p.dispose();
    composer.renderTarget1.dispose();
    composer.renderTarget2.dispose();
    composer = gtao = bloom = null;
  }

  function sizeReflectors() {
    const [w, h] = size();
    const H = level.reflectorSize, W = Math.round(H * (w / h));
    scene.traverse((o) => {
      if (!o.isReflector || !o.getRenderTarget) return;
      const rt = o.getRenderTarget();
      if (rt.samples !== level.reflectorSamples) { rt.samples = level.reflectorSamples; rt.dispose(); }
      if (rt.width !== W || rt.height !== H) rt.setSize(W, H);
    });
  }

  function applyShadows() {
    scene.traverse((o) => {
      if (!o.isLight || !o.shadow) return;
      const s = o.isDirectionalLight ? level.sunShadow : o.isSpotLight ? level.spotShadow : level.pointShadow;
      if (o.shadow.mapSize.x === s) return;
      o.shadow.mapSize.set(s, s);
      if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
    });
    ctx.invalidateShadows(4);
  }

  function apply() {
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(innerWidth, innerHeight, false);
    buildComposer();
    sizeReflectors();
    applyShadows();
    graceUntil = performance.now() + 3000;
    belowSince = 0;
    onChange && onChange(api);
  }

  const api = {
    LEVELS, ORDER,
    get level() { return level.id; },
    get levelInfo() { return level; },
    get auto() { return auto; },
    get autoDropped() { return autoDropped; },
    get label() { return level.name + (autoDropped ? ' (auto)' : ''); },
    get composer() { return composer; },
    set(id, { manual = true } = {}) {
      if (!LEVELS[id]) return;
      if (manual) { saveLevel(id); autoDropped = false; }
      level = LEVELS[id];
      apply();
    },
    render() {
      frameRef.frame++;
      if (composer) composer.render();
      else renderer.render(scene, camera);
    },
    resize() {
      renderer.setPixelRatio(pixelRatio());
      renderer.setSize(innerWidth, innerHeight, false);
      if (composer) { composer.setPixelRatio(pixelRatio()); composer.setSize(innerWidth, innerHeight); }
      sizeReflectors();
    },
    sizeReflectors,
    /** Shadow sizes for lights added later (fixture rebuilds). */
    applyShadows,
    /** Once per frame with the rolling fps. */
    tick(now, fps) {
      if (!auto || document.hidden || now < graceUntil || !fps) { belowSince = 0; return; }
      if (fps >= 30) { belowSince = 0; return; }
      if (!belowSince) belowSince = now;
      if (now - belowSince > 3000) {
        const i = ORDER.indexOf(level.id);
        if (i < ORDER.length - 1) {
          console.info(`[quality] ${fps.toFixed(1)} fps for 3 s: ${level.id} -> ${ORDER[i + 1]}`);
          autoDropped = true;
          level = LEVELS[ORDER[i + 1]];
          apply();
        }
        belowSince = 0;
      }
    },
    /** n synchronous renders (GPU-synced with readPixels) -> ms/frame. */
    measure(n = 60) {
      const gl = renderer.getContext();
      const px = new Uint8Array(4);
      const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      api.render(); sync();               // warm (compile) + flush
      const t0 = performance.now();
      for (let i = 0; i < n; i++) api.render();
      sync();
      const ms = (performance.now() - t0) / n;
      const b = renderer.getDrawingBufferSize(new THREE.Vector2());
      return { msPerFrame: +ms.toFixed(2), fps: +(1000 / ms).toFixed(1), level: level.id, buffer: [b.x, b.y], frames: n };
    },
  };
  apply();
  return api;
}
