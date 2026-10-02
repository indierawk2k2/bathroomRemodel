// Standalone test bench for the remodel components (accent wall + junction,
// oval mirror, light options) in a minimal scene.  Not part of the app.
//
// Query params: tile=<id> light=<id|none> transition=<id> view=front|junction|side|mirror|light
//               thick=<mm override> on=0|1 tex=0 (ignore texture pack) res=<reflector px>
//               top=<accent top in inches> exposure=<n> env=<env intensity>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { inch, mm } from './units.js';
import config from './config.js';
import { tiles, lights, getLight, getTile } from '../src/options/index.js';
import { buildAccentWall, TRANSITIONS } from '../src/remodel/accentWall.js';
import { buildOvalMirror } from '../src/remodel/ovalMirror.js';
import { createJunctionInspector } from '../src/remodel/junction.js';

const Q = new URLSearchParams(location.search);
const state = {
  scenario: 'remodel',
  tile: Q.get('tile') || 'sage-fan',
  light: Q.get('light') || 'rattan-linear',
  transition: Q.get('transition') || TRANSITIONS[0].id,
  thicknessMmOverride: Q.has('thick') ? Number(Q.get('thick')) : undefined,
  lightsOn: Q.get('on') !== '0',
  view: Q.get('view') || 'front',
};

// ---- texture pack loader (dev only; the app uses src/textures.js) --------
async function loadTexturePack() {
  const out = { physicalSize: {} };
  if (Q.get('tex') === '0') return out;
  let manifest;
  try {
    const r = await fetch('../assets/textures/manifest.json');
    if (!r.ok) return out;
    manifest = await r.json();
  } catch (e) { return out; }
  const entries = Array.isArray(manifest) ? manifest : (manifest.textures || Object.values(manifest));
  const loader = new THREE.TextureLoader();
  const load = (file, srgb) => new Promise((res) => {
    loader.load(`../assets/textures/${file}`, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 8;
      res(t);
    }, undefined, () => res(null));
  });
  await Promise.all(entries.filter((e) => e && e.name).map(async (e) => {
    const [map, nrm, rgh] = await Promise.all([
      e.map ? load(e.map, true) : null, e.normalMap ? load(e.normalMap, false) : null,
      e.roughnessMap ? load(e.roughnessMap, false) : null]);
    if (map) out[e.name] = map;
    if (nrm) out[`${e.name}_normal`] = nrm;
    if (rgh) out[`${e.name}_roughness`] = rgh;
    if (e.physicalSizeM) out.physicalSize[e.name] = e.physicalSizeM;
  }));
  return out;
}

// ---- renderer / scene ---------------------------------------------------
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = Number(Q.get('exposure') || 1.0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202326);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = Number(Q.get('env') || 0.35);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 30);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const textures = await loadTexturePack();
const ctx = { THREE, textures, config, state, scene, renderer, camera };

// ---- minimal room: floor, north wall, side walls, ceiling, fake wainscot --
const room = new THREE.Group();
scene.add(room);
const W = inch(102), Dp = inch(70), H = inch(120);
const capTop = config.ROOM.wainscotTop, capBottom = capTop - config.ROOM.wainscotCapHeight;
const P = config.ROOM.wainscotProud;
{
  const paint = new THREE.MeshStandardMaterial({ color: 0xb8bfbb, roughness: 0.9 });
  const plane = (w, h, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = true; return m; };
  const floor = plane(W, Dp, new THREE.MeshStandardMaterial({ color: 0x4a423b, roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, Dp / 2); room.add(floor);
  const ceil = plane(W, Dp, new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W / 2, H, Dp / 2); room.add(ceil);
  const north = plane(W, H, paint); north.position.set(W / 2, H / 2, 0); room.add(north);
  const west = plane(Dp, H, paint); west.rotation.y = Math.PI / 2; west.position.set(0, H / 2, Dp / 2); room.add(west);
  const east = plane(Dp, H, paint); east.rotation.y = -Math.PI / 2; east.position.set(W, H / 2, Dp / 2); room.add(east);
  // South wall (single-sided, faces -z so cameras outside the room see through
  // it) with a grey door, so the mirror has something to reflect.
  const south = plane(W, H, paint); south.rotation.y = Math.PI; south.position.set(W / 2, H / 2, Dp); room.add(south);
  const door = plane(inch(30), inch(80), new THREE.MeshStandardMaterial({ color: 0x8a8d8f, roughness: 0.5 }));
  door.rotation.y = Math.PI; door.position.set(inch(84), inch(40), Dp - mm(5)); room.add(door);
  const pic = plane(inch(16), inch(16), new THREE.MeshStandardMaterial({ color: 0xc0705a, roughness: 0.6 }));
  pic.rotation.y = Math.PI; pic.position.set(inch(40), inch(62), Dp - mm(5)); room.add(pic);

  // Wainscot: 12x24 running bond drawn on a canvas, 13 mm proud.
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#c4c2bd'; g.fillRect(0, 0, 1024, 512);
  for (let r = 0; r < 2; r++) for (let k = -1; k < 3; k++) {
    const x0 = k * 512 + (r ? 256 : 0) + 3, y0 = r * 256 + 3;
    const v = 128 + ((k * 7 + r * 3) % 5) * 4;
    g.fillStyle = `rgb(${v},${v - 3},${v - 7})`; g.fillRect(x0, y0, 506, 250);
  }
  const wt = new THREE.CanvasTexture(c); wt.colorSpace = THREE.SRGBColorSpace;
  wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
  const wMat = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.55 });
  const wb = new THREE.BoxGeometry(W, capBottom, P);
  // BoxGeometry UV 0..1 per face: set repeat so one 48"x24" repeat is honoured.
  wt.repeat.set(W / inch(48), capBottom / inch(24));
  const wainscot = new THREE.Mesh(wb, wMat);
  wainscot.position.set(W / 2, capBottom / 2, P / 2);
  wainscot.receiveShadow = true; wainscot.castShadow = true;
  room.add(wainscot);
  // The wainscot's eased top edge (light-sand lip) along the whole wall: the
  // accent wall sits on top of it in every transition.
  const capMat = new THREE.MeshStandardMaterial({ color: 0xc4b9a8, roughness: 0.6 });
  for (const [x0, x1] of [[0, W]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, capTop - capBottom, P), capMat);
    m.position.set((x0 + x1) / 2, (capTop + capBottom) / 2, P / 2);
    m.castShadow = m.receiveShadow = true;
    m.name = 'devCap';
    room.add(m);
  }
  // Vanity placeholder + counter.
  const v = config.ROOM.vanity;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(v.x1 - v.x0, v.height - inch(1.25), v.depth), new THREE.MeshStandardMaterial({ color: 0x77736c, roughness: 0.6 }));
  cab.position.set((v.x0 + v.x1) / 2, (v.height - inch(1.25)) / 2, v.depth / 2); cab.castShadow = cab.receiveShadow = true; room.add(cab);
  const top = new THREE.Mesh(new THREE.BoxGeometry(v.x1 - v.x0, inch(1.25), v.depth + inch(1)), new THREE.MeshPhysicalMaterial({ color: 0xeeeeea, roughness: 0.25, clearcoat: 0.5 }));
  top.position.set((v.x0 + v.x1) / 2, v.height - inch(0.625), (v.depth + inch(1)) / 2); top.castShadow = top.receiveShadow = true; room.add(top);
  // Window placeholder.
  const wn = config.ROOM.window;
  const trim = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xdfe6ea, emissive: 0xbfd0dc, emissiveIntensity: 0.6, roughness: 0.3 });
  const gw = new THREE.Mesh(new THREE.PlaneGeometry(wn.x1 - wn.x0 - inch(5), wn.head - wn.sill - inch(5)), glass);
  gw.position.set((wn.x0 + wn.x1) / 2, (wn.sill + wn.head) / 2, mm(2)); room.add(gw);
  for (const [cx, cy, w, h] of [
    [wn.x0 + inch(1.25), (wn.sill + wn.head) / 2, inch(2.5), wn.head - wn.sill],
    [wn.x1 - inch(1.25), (wn.sill + wn.head) / 2, inch(2.5), wn.head - wn.sill],
    [(wn.x0 + wn.x1) / 2, wn.head - inch(1.25), wn.x1 - wn.x0, inch(2.5)],
    [(wn.x0 + wn.x1) / 2, wn.sill + inch(0.75), wn.x1 - wn.x0 + inch(1), inch(1.5)]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, inch(0.75)), trim);
    m.position.set(cx, cy, inch(0.375)); m.castShadow = m.receiveShadow = true; room.add(m);
  }
  // Soft daylight through the window.
  const sun = new THREE.DirectionalLight(0xeef3ff, 0.6);
  sun.position.set(inch(86), inch(70), inch(-40));
  sun.target.position.set(inch(50), 0, inch(40));
  room.add(sun, sun.target);
}

// ---- components ---------------------------------------------------------
let accent = null, mirror = null, fixture = null;
const inspector = createJunctionInspector(ctx, { force: true, keepCanvas: true });

function disposeObj(o) { if (!o) return; scene.remove(o); if (o.userData.dispose) o.userData.dispose(); }

function rebuild() {
  disposeObj(accent); disposeObj(mirror); disposeObj(fixture);
  accent = buildAccentWall(ctx, { tile: state.tile, transition: state.transition, thicknessMmOverride: state.thicknessMmOverride, topIn: Q.has('top') ? Number(Q.get('top')) : undefined });
  scene.add(accent);
  const surf = accent.userData.surfaceOffsetM;
  const res = Number(Q.get('res') || 1536);
  mirror = buildOvalMirror(ctx, { surfaceOffsetM: surf, reflector: { textureWidth: res, textureHeight: res } });
  scene.add(mirror);
  const L = getLight(state.light);
  fixture = L ? L.build(ctx, { surfaceOffsetM: surf }) : null;
  if (fixture) { scene.add(fixture); fixture.userData.onOff(state.lightsOn); }
}

const VIEWS = {
  front: [[55, 64, 96], [55, 68, 0]],
  junction: [[61, 45, 16], [55, 40, 0]],
  side: [[71, 43, 7], [55, 40.5, 0]],
  mirror: [[60, 70, 44], [55, 70, 0]],
  light: [[52, 82, 62], [55, 96, 8]],
};
function setView(name) {
  const v = VIEWS[name] || VIEWS.front;
  camera.position.set(...v[0].map(inch));
  controls.target.set(...v[1].map(inch));
  controls.update();
}

// ---- UI -----------------------------------------------------------------
const fill = (sel, items, val) => {
  sel.innerHTML = items.map((o) => `<option value="${o.id}">${o.name}</option>`).join('');
  sel.value = val;
};
const $ = (id) => document.getElementById(id);
fill($('tile'), tiles(), state.tile);
fill($('transition'), TRANSITIONS, state.transition);
fill($('light'), [...lights(), { id: 'none', name: '(none)' }], state.light);
$('thick').value = state.thicknessMmOverride ?? '';
$('on').checked = state.lightsOn;
$('tile').onchange = (e) => { state.tile = e.target.value; rebuild(); };
$('transition').onchange = (e) => { state.transition = e.target.value; rebuild(); };
$('light').onchange = (e) => { state.light = e.target.value; rebuild(); };
$('thick').onchange = (e) => { const v = e.target.value; state.thicknessMmOverride = v === '' ? undefined : Number(v); rebuild(); };
$('on').onchange = (e) => { state.lightsOn = e.target.checked; fixture && fixture.userData.onOff(state.lightsOn); };
document.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => setView(b.dataset.view)));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

rebuild();
setView(state.view);

let frames = 0, fpsT = performance.now(), fps = 0;
function frame() {
  controls.update();
  inspector.update(camera.position, state);
  renderer.render(scene, camera);
  frames++;
  const now = performance.now();
  if (now - fpsT > 1000) {
    fps = frames * 1000 / (now - fpsT); frames = 0; fpsT = now;
    const i = renderer.info.render;
    $('stats').textContent = `fps ${fps.toFixed(0)}  tris ${i.triangles}  calls ${i.calls}\n` +
      `textures: ${Object.keys(textures).filter((k) => k !== 'physicalSize').length ? 'pack' : 'procedural'}`;
  }
}
// Render once synchronously so a headless screenshot sees a frame, then loop.
frame();
document.title = 'Components — ready';
renderer.setAnimationLoop(frame);
window.__dev = { THREE, scene, renderer, camera, ctx, state, rebuild, setView, getTile, getLight };
