// Boot: renderer, scene, environment, room + current fixtures, remodel
// scenario, controls, UI, quality pipeline, render loop.
//   window.__app = { ctx, scene, camera, renderer, controls, state, presets, ui,
//                    groups: { room, fixtures, currentVanityDecor, remodel },
//                    remodel, quality, applyPreset, measure(frames), frameRef }
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
import { setupRemodel, guardReflector } from './remodel/index.js';
import { createQuality, savedLevel, LEVELS } from './quality.js';
import { createEnvProbe } from './envProbe.js';
import { setUnsavedPaint } from './options/paints/custom.js';

function parseHash() {
  const out = {};
  for (const part of location.hash.replace(/^#/, '').split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = v === undefined ? true : decodeURIComponent(v);
  }
  return out;
}
const flag = (v) => v === true || v === '1' || v === 'true' || v === 'on';

/** Hash keys that map straight onto state (see README "URL hash options"). */
function hashState(h) {
  const s = {};
  if (h.scenario) s.scenario = h.scenario === 'remodel' ? 'remodel' : 'current';
  if (h.tile) s.tile = h.tile;
  // Unsaved custom paint colour: tile=custom&paint=<hex>&finish=<finish>&pname=<name>
  if (h.tile === 'custom' && !setUnsavedPaint({ hex: h.paint, finish: h.finish, name: typeof h.pname === 'string' ? h.pname : '' })) delete s.tile;
  if (h.light) s.light = h.light;
  if (h.transition) s.transition = h.transition;
  if (h.extent) s.accentExtent = { full: 'full-wall', strip: 'vanity-strip' }[h.extent] || h.extent;
  if (h.night !== undefined) s.night = flag(h.night);
  if (h.lights !== undefined) s.lightsOn = flag(h.lights);
  for (const [k, key] of [['top', 'accentTopIn'], ['mirror', 'mirrorBottomIn'], ['hang', 'lightHangBottomIn'], ['sconce', 'sconceCentreIn'], ['fromwall', 'lightFromWallIn'], ['thick', 'tileThicknessMmOverride']]) {
    if (h[k] !== undefined && Number.isFinite(+h[k])) s[key] = +h[k];
  }
  return s;
}

// Daylight levels (exposure 1).  Night keeps a trace of blue sky so the
// window still reads as a window.
const DAY = { sun: 0.9, area: 2.2, glass: 2.4, env: 0.28, glassColor: 0xd7e3ea };
const NIGHT = { sun: 0.0, area: 0.03, glass: 0.04, env: 0.05, glassColor: 0x55657a };

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
  scene.environmentIntensity = DAY.env; // soft bounce light; real lights do the rest

  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.02, 30);

  // ---- state
  const qHash = LEVELS[hash.q] ? hash.q : null;
  const state = createState({
    scenario: 'current',
    uiVisible: hash.ui !== '0',
    quality: qHash || savedLevel() || 'high',
    ...hashState(hash),
  });

  const textures = await loadTextures(THREE, renderer);

  let shadowFrames = 90;
  const invalidateShadows = (frames = 3) => (shadowFrames = Math.max(shadowFrames, frames));
  const ctx = { THREE, textures, config, state, scene, renderer, camera, invalidateShadows };
  const frameRef = { frame: 0, inOverride: false };

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
  const currentMirror = buildCurrentMirror(ctx);
  const currentLight = buildCurrentLight(ctx);
  currentVanityDecor.add(currentMirror, currentLight);
  scene.add(currentVanityDecor);
  guardReflector(currentMirror.userData.reflector, frameRef);

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
    app.presetId = p.id;
  };
  const app = {
    ctx, scene, camera, renderer, controls, state, presets, applyPreset, frameRef, presetId: 3,
    groups: { room, fixtures, currentVanityDecor },
  };
  window.__app = app;
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

  // ---- quality pipeline (composer, AO, bloom, reflector + shadow sizes)
  const quality = createQuality({
    THREE, renderer, scene, camera, ctx, frameRef,
    initial: state.quality,
    auto: hash.auto !== '0' && !qHash,
    onChange: (q) => {
      if (state.quality !== q.level) state.set({ quality: q.level });
      app.ui?.setQualityLabel(q.label);
    },
  });
  app.quality = quality;

  // ---- remodel scenario (options, accent wall, oval mirror, light, inspector)
  const remodel = setupRemodel(app);
  app.remodel = remodel;
  app.groups.remodel = remodel.groups.root;
  quality.applyShadows();
  quality.sizeReflectors();

  // ---- day / night + vanity fixture on/off
  const sun = room.getObjectByName('window_sun');
  const area = room.getObjectByName('window_area');
  const glassMat = room.getObjectByName('window_glass')?.material;
  const barLights = currentLight.userData.lights || [];
  const barGlow = currentLight.userData.glowMaterials || [];
  for (const l of barLights) l.userData.baseIntensity ??= l.intensity;
  for (const m of barGlow) m.userData.onIntensity ??= m.emissiveIntensity;
  function applyLighting() {
    const L = state.night ? NIGHT : DAY;
    if (sun) sun.intensity = L.sun;
    if (area) area.intensity = L.area;
    if (glassMat) {
      glassMat.emissiveIntensity = L.glass;
      glassMat.emissive.set(L.glassColor);
      // at night the obscure glass shows the dark outside, not a lit white pane
      glassMat.color.setScalar(state.night ? 0.22 : 1);
    }
    scene.environmentIntensity = L.env;
    const on = state.lightsOn !== false;
    for (const l of barLights) l.intensity = on ? l.userData.baseIntensity : 0;
    for (const m of barGlow) m.emissiveIntensity = on ? m.userData.onIntensity : 0;
  }
  applyLighting();

  // Debug: #off=window_sun,currentLight_bulb,... disables lights by name.
  if (hash.off) {
    const names = String(hash.off).split(',');
    scene.traverse((o) => { if (o.isLight && names.includes(o.name)) o.visible = false; });
  }

  // ---- reflection probe of the real room for chrome / glaze / brass
  const probe = createEnvProbe({
    THREE, renderer, scene, frameRef,
    position: new THREE.Vector3(...[54, 54, 34].map((n) => n * 0.0254)),
  });
  app.probe = probe;
  probe.request(4);
  const PROBE_KEYS = ['scenario', 'tile', 'light', 'transition', 'accentExtent', 'night', 'lightsOn', 'accentTopIn',
    'mirrorBottomIn', 'lightHangBottomIn', 'lightFromWallIn', 'sconceCentreIn', 'tileThicknessMmOverride'];

  const ui = buildUI({ state, controls, presets, applyPreset, quality, remodel });
  app.ui = ui;
  ui.setQualityLabel(quality.label);

  state.subscribe((s, changed) => {
    if (changed.includes('scenario')) currentVanityDecor.visible = s.scenario === 'current';
    if (changed.includes('night') || changed.includes('lightsOn')) applyLighting();
    if (changed.includes('quality') && s.quality !== quality.level) quality.set(s.quality);
    if (changed.some((k) => PROBE_KEYS.includes(k))) probe.request(12);
    invalidateShadows();
  });
  currentVanityDecor.visible = state.scenario === 'current';

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    quality.resize();
  });
  addEventListener('hashchange', () => {
    const h = parseHash();
    if (h.preset) applyPreset(h.preset);
    const wasCustom = state.tile === 'custom';
    const hs = hashState(h);
    if (hs.tile === 'custom') remodel.refreshOptions();   // the hash re-registered it
    state.set(hs);
    if (hs.tile === 'custom' && wasCustom) remodel.rebuild({ accent: true });
  });

  /** n synchronous frames at the current pose -> ms/frame (real GPU timing). */
  app.measure = (frames = 60) => {
    controls.update(0);
    remodel.frame(camera);
    return { ...quality.measure(frames), preset: app.presetId, scenario: state.scenario, light: state.light };
  };

  // Warm up: compile shaders and draw one frame before boot() resolves.
  renderer.shadowMap.needsUpdate = true;
  remodel.frame(camera);
  quality.render();
  probe.captureNow(); // first frame already shows the room's reflections

  // ---- loop
  const clock = new THREE.Clock();
  let first = true;
  renderer.setAnimationLoop((now) => {
    const dt = clock.getDelta();
    controls.update(dt);
    remodel.frame(camera);
    if (shadowFrames > 0) {
      renderer.shadowMap.needsUpdate = true;
      shadowFrames--;
    }
    probe.frame();
    quality.render();
    ui.frame(now);
    quality.tick(now, ui.fps);
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
