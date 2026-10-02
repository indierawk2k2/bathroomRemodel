// Remodel scenario wiring (br-uio): connects the option registry and the
// remodel components (accent wall, oval mirror, light fixtures, junction
// inspector) to the real app's state.
//
//   const remodel = setupRemodel(app);   // app = window.__app (before loop)
//   remodel.frame(camera)                // every frame (inspector, re-mounts)
//   remodel.setQuality({ reflectorSize, pointShadowSize })
//   remodel.groups -> { root, accent, mirror, light }
//
// State keys read: scenario, tile, light, transition, accentTopIn,
// mirrorBottomIn, lightHangBottomIn (ceiling fixtures), sconceCentreIn (wall
// fixtures), tileThicknessMmOverride, lightsOn.
//
// Nothing here knows option ids except the two defaults: every list comes
// from the registry, so adding an option is still one file + one line in
// src/options/index.js.
import { tiles, lights, getTile, getLight } from '../options/index.js';
import { buildAccentWall, TRANSITIONS } from './accentWall.js';
import { buildOvalMirror } from './ovalMirror.js';
import { createJunctionInspector } from './junction.js';

export const DEFAULT_TILE = 'sage-fan';
export const DEFAULT_LIGHT = 'harlan-sconces';

const SLIDER_KEYS = ['accentTopIn', 'mirrorBottomIn', 'lightHangBottomIn', 'sconceCentreIn', 'tileThicknessMmOverride'];
const DEBOUNCE_MS = 80;

/** Option lists for the UI: [{id, name, description}] */
function optionLists() {
  const pick = (o) => ({ id: o.id, name: o.name, description: o.description || '' });
  return {
    tiles: tiles().map(pick),
    lights: lights().map((o) => ({ ...pick(o), mount: o.mount || 'ceiling' })),
    transitions: TRANSITIONS.map(pick),
  };
}

/** Make every Reflector render at most once per frame (the GTAO normal pass
 *  and the bloom pass would otherwise re-trigger onBeforeRender). */
export function guardReflector(reflector, frameRef) {
  if (!reflector || !reflector.onBeforeRender || reflector.userData.guarded) return;
  const orig = reflector.onBeforeRender;
  let last = -1;
  reflector.onBeforeRender = function (renderer, scene, camera, ...rest) {
    if (frameRef.inOverride) return;        // depth/normal-only passes
    if (frameRef.frame === last) return;
    last = frameRef.frame;
    orig.call(this, renderer, scene, camera, ...rest);
  };
  reflector.userData.guarded = true;
}

export function setupRemodel(app) {
  const { ctx, state, scene, groups } = app;
  const { THREE, config } = ctx;
  const R = config.REMODEL;
  const frameRef = app.frameRef || (app.frameRef = { frame: 0, inOverride: false });

  // ---- options + defaults (hash values set before this call win)
  const lists = optionLists();
  const has = (list, id) => list.some((o) => o.id === id);
  const patch = { options: lists };
  if (!has(lists.tiles, state.tile)) patch.tile = has(lists.tiles, DEFAULT_TILE) ? DEFAULT_TILE : lists.tiles[0]?.id ?? null;
  if (!has(lists.lights, state.light)) patch.light = has(lists.lights, DEFAULT_LIGHT) ? DEFAULT_LIGHT : lists.lights[0]?.id ?? null;
  if (!has(lists.transitions, state.transition)) patch.transition = lists.transitions[0].id;
  state.set(patch);

  const root = new THREE.Group();
  root.name = 'remodel';
  scene.add(root);
  const g = { root, accent: null, mirror: null, light: null };
  const qi = () => app.quality?.levelInfo || { reflectorSize: 1200, reflectorSamples: 4 };

  const dispose = (o) => {
    if (!o) return;
    root.remove(o);
    o.userData.dispose && o.userData.dispose();
  };
  const surface = () => (g.accent ? g.accent.userData.surfaceOffsetM : 0);

  function buildAccent() {
    dispose(g.accent);
    g.accent = buildAccentWall(ctx, {
      tile: state.tile,
      transition: state.transition,
      topIn: state.accentTopIn,
      thicknessMmOverride: state.tileThicknessMmOverride ?? undefined,
    });
    // The new tile is static: let it receive the fixtures' shadows.
    root.add(g.accent);
  }
  function buildMirror() {
    dispose(g.mirror);
    g.mirror = buildOvalMirror(ctx, {
      bottomIn: state.mirrorBottomIn,
      centreXIn: R.mirrorCentreX / 0.0254,
      surfaceOffsetM: surface(),
      // The Reflector's texture is projected in SCREEN space, so it is sized
      // to the view aspect (src/quality.js keeps it in step on resize).
      reflector: {
        textureWidth: Math.round(qi().reflectorSize * (ctx.camera?.aspect || 1.6)),
        textureHeight: qi().reflectorSize,
        multisample: qi().reflectorSamples,
      },
    });
    guardReflector(g.mirror.userData.reflector, frameRef);
    root.add(g.mirror);
    app.quality?.sizeReflectors();
  }
  function buildLight() {
    dispose(g.light);
    g.light = null;
    const opt = getLight(state.light);
    if (!opt) return;
    const wall = opt.mount === 'wall';
    g.light = opt.build(ctx, {
      hangBottomIn: wall ? undefined : state.lightHangBottomIn,
      mountCentreIn: wall ? state.sconceCentreIn : undefined,
      spacingIn: wall ? R.sconceSpacingIn : undefined,   // pairs: each side of centre
      centreXIn: R.lightCentreX / 0.0254,
      centreZIn: R.lightCentreZ / 0.0254,
      ceilingIn: config.ROOM.ceiling / 0.0254,
      surfaceOffsetM: surface(),
      shadows: true,
    });
    g.light.userData.onOff(state.lightsOn !== false);
    root.add(g.light);
    app.quality?.applyShadows();      // shadow-map size for the current level
  }

  // ---- fixtures on the accent wall: towel ring + vanity GFCI ride on the
  // new finished face in the remodel and go back to the drywall in current.
  const remount = [];
  for (const name of ['towelRing', 'outlet_vanity']) {
    const o = groups.fixtures.getObjectByName(name);
    if (o) remount.push({ o, z0: o.position.z });
  }
  // The plates sit on drywall at z = 0; in the accent area they need a
  // box extender, so the outlet plate just moves out to the tile face.
  function applyMounts() {
    const off = state.scenario === 'remodel' ? surface() : 0;
    for (const { o, z0 } of remount) o.position.z = z0 + off;
  }

  function applyVisibility() {
    const on = state.scenario === 'remodel';
    root.visible = on;
    applyMounts();
  }

  function rebuild(what) {
    if (what.accent) buildAccent();
    if (what.accent || what.mirror) buildMirror();
    if (what.accent || what.light) buildLight();
    applyVisibility();
    ctx.invalidateShadows(4);
  }

  // ---- state -> rebuilds
  let pending = { accent: false, mirror: false, light: false };
  let timer = null;
  const flush = () => {
    timer = null;
    const p = pending;
    pending = { accent: false, mirror: false, light: false };
    if (p.accent || p.mirror || p.light) rebuild(p);
  };
  state.subscribe((s, changed) => {
    const want = { accent: false, mirror: false, light: false };
    for (const k of changed) {
      if (k === 'tile' || k === 'transition' || k === 'accentTopIn' || k === 'tileThicknessMmOverride') want.accent = true;
      if (k === 'mirrorBottomIn') want.mirror = true;
      if (k === 'light' || k === 'lightHangBottomIn' || k === 'sconceCentreIn') want.light = true;
    }
    if (changed.includes('lightsOn') && g.light) {
      g.light.userData.onOff(s.lightsOn !== false);
    }
    if (changed.includes('scenario')) applyVisibility();
    if (!(want.accent || want.mirror || want.light)) return;
    for (const k of Object.keys(want)) pending[k] = pending[k] || want[k];
    const sliderOnly = changed.every((k) => SLIDER_KEYS.includes(k));
    if (sliderOnly) {
      clearTimeout(timer);
      timer = setTimeout(flush, DEBOUNCE_MS);
    } else {
      clearTimeout(timer);
      flush();
    }
  });

  rebuild({ accent: true, mirror: true, light: true });

  // ---- junction inspector
  const inspector = createJunctionInspector(ctx, {});

  return {
    groups: g,
    inspector,
    frame(camera) {
      inspector.update(camera.position, state);
    },
    rebuild,
    getTile, getLight,
  };
}
