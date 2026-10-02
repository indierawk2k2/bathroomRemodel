// Boot: renderer, scene, environment, room + current fixtures, controls, UI,
// render loop.  Exposes window.__app for the integration pass:
//   window.__app = { ctx, scene, camera, renderer, controls, state, presets, ui,
//                    groups: { room, fixtures, currentVanityDecor }, applyPreset }
// ctx = { THREE, textures, config, state, scene, renderer, camera,
//         invalidateShadows() }  -- call invalidateShadows() after adding or
// moving shadow-casting objects (shadow maps are re-rendered only on demand).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

import config from './config.js';
import { createState } from './state.js';
import { loadTextures } from './textures.js';
import { buildRoom } from './room.js';
import { buildTub } from './fixtures/tub.js';
import { buildVanity } from './fixtures/vanity.js';
import { buildToilet } from './fixtures/toilet.js';
import { buildCurtain } from './fixtures/curtain.js';
import { buildCurrentMirror } from './fixtures/currentMirror.js';
import { buildCurrentLight } from './fixtures/currentLight.js';
import { buildMisc } from './fixtures/misc.js';
import { FirstPersonControls } from './controls.js';
import { buildUI } from './ui.js';

function parseHash() {
  const out = {};
  for (const part of location.hash.replace(/^#/, '').split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = v === undefined ? true : decodeURIComponent(v);
  }
  return out;
}

async function boot() {
  const hash = parseHash();
  const canvas = document.getElementById('view');

  // ---- renderer (SPEC section 5)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // static scene: re-render shadows on demand
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111214);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28; // soft bounce light; real lights do the rest

  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.02, 30);

  // ---- state
  const state = createState({
    scenario: hash.scenario === 'remodel' ? 'remodel' : 'current',
    uiVisible: hash.ui !== '0',
  });

  const textures = await loadTextures(THREE, renderer);

  let shadowFrames = 90;
  const invalidateShadows = (frames = 3) => (shadowFrames = Math.max(shadowFrames, frames));
  const ctx = { THREE, textures, config, state, scene, renderer, camera, invalidateShadows };

  // ---- scene content
  const room = buildRoom(ctx);
  scene.add(room);
  const fixtures = new THREE.Group();
  fixtures.name = 'fixtures';
  fixtures.add(buildTub(ctx), buildVanity(ctx), buildToilet(ctx), buildCurtain(ctx), buildMisc(ctx));
  scene.add(fixtures);
  // Current mirror + light bar: hidden by the remodel scenario.
  const currentVanityDecor = new THREE.Group();
  currentVanityDecor.name = 'currentVanityDecor';
  currentVanityDecor.add(buildCurrentMirror(ctx), buildCurrentLight(ctx));
  scene.add(currentVanityDecor);

  // Debug: #off=window_sun,currentLight_bulb,... disables lights by name.
  if (hash.off) {
    const names = String(hash.off).split(',');
    scene.traverse((o) => { if (o.isLight && names.includes(o.name)) o.visible = false; });
  }

  // ---- controls + presets
  const controls = new FirstPersonControls(camera, canvas, {
    walkRects: config.ROOM.walkRects,
    minY: 0.3,
    maxY: config.ROOM.ceiling - 0.15,
  });
  const presets = config.PRESETS;
  const applyPreset = (id) => {
    const p = presets.find((q) => q.id === +id);
    if (!p) return;
    camera.fov = p.fov || 62;
    camera.updateProjectionMatrix();
    controls.setPose(p.pos, p.target);
  };
  applyPreset(hash.preset || 3);
  // Debug pose: #cam=x,y,z,tx,ty,tz[,fov] in inches (used for headless shots).
  if (hash.cam) {
    const v = String(hash.cam).split(',').map(Number);
    if (v.length >= 6 && v.every(Number.isFinite)) {
      const m = v.map((n) => n * 0.0254);
      if (v[6]) (camera.fov = v[6]), camera.updateProjectionMatrix();
      controls.setPose(m.slice(0, 3), m.slice(3, 6));
    }
  }

  const ui = buildUI({ state, controls, presets, applyPreset });

  // scenario -> visibility; any state change may move shadow casters
  state.subscribe((s, changed) => {
    if (changed.includes('scenario')) currentVanityDecor.visible = s.scenario === 'current';
    invalidateShadows();
  });
  currentVanityDecor.visible = state.scenario === 'current';

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  });
  addEventListener('hashchange', () => {
    const h = parseHash();
    if (h.preset) applyPreset(h.preset);
    if (h.scenario) state.set({ scenario: h.scenario === 'remodel' ? 'remodel' : 'current' });
  });

  window.__app = {
    ctx, scene, camera, renderer, controls, state, presets, ui, applyPreset,
    groups: { room, fixtures, currentVanityDecor },
  };

  // Warm up: compile shaders and draw one frame before boot() resolves.
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);

  // ---- loop
  const clock = new THREE.Clock();
  let first = true;
  renderer.setAnimationLoop((now) => {
    const dt = clock.getDelta();
    controls.update(dt);
    if (shadowFrames > 0) {
      renderer.shadowMap.needsUpdate = true;
      shadowFrames--;
    }
    renderer.render(scene, camera);
    ui.frame(now);
    if (first) {
      first = false;
      document.getElementById('loading')?.remove();
      document.title = 'Bathroom Viewer — ready';
    }
  });
}

// Top-level await keeps the document's load event pending until the scene is
// built and one frame is drawn, so headless screenshots catch a real frame.
await boot().catch((e) => {
  (window.__showError || console.error)('Boot failed: ' + (e.stack || e));
});
