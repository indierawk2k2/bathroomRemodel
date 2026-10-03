// Remodel scenario wiring (br-uio): connects the option registry and the
// remodel components (accent wall, oval mirror, light fixtures, junction
// inspector) to the real app's state.
//
//   const remodel = setupRemodel(app);   // app = window.__app (before loop)
//   remodel.frame(camera)                // every frame (inspector, re-mounts)
//   remodel.setQuality({ reflectorSize, pointShadowSize })
//   remodel.groups -> { root, accent, mirror, light }
//   remodel.refreshOptions(patch?)       // re-read the registry into state.options
//                                        // (after saving / deleting a custom paint)
//   remodel.paintInPlace(hex) -> bool    // recolour the accent face without a rebuild
//                                        // (paint finishes only; false otherwise)
//
// State keys read: scenario, tile, light, transition, accentExtent, accentTopIn,
// mirrorBottomIn, lightHangBottomIn + lightFromWallIn (ceiling fixtures),
// sconceCentreIn (wall fixtures), tileThicknessMmOverride, lightsOn.
//
// Light placement defaults live on each light option (defaultHangBottomIn,
// defaultFromWallIn, defaultMountCentreIn).  When the light changes, its
// placement sliders jump to that option's defaults, except for any slider
// the user already moved for that option this session (remembered per
// option).  Values given in the URL hash count as the user's.  A default may
// be a function of the mirror ({ mirrorBottomIn, mirrorHeightIn } -> inches;
// the Harlan sconces sit on the mirror's widest point): it is re-applied
// when the mirror moves, unless the user set that slider for that light.
//
// Nothing here knows option ids except the two defaults: every list comes
// from the registry, so adding an option is still one file + one line in
// src/options/index.js.
import { tiles, lights, getTile, getLight } from '../options/index.js';
import { buildAccentWall, TRANSITIONS, EXTENTS } from './accentWall.js';
import { buildOvalMirror } from './ovalMirror.js';
import { createJunctionInspector } from './junction.js';
import { registerSavedPaints } from '../options/paints/custom.js';

export const DEFAULT_TILE = 'sage-fan';
export const DEFAULT_LIGHT = 'harlan-sconces';

const SLIDER_KEYS = ['accentTopIn', 'mirrorBottomIn', 'lightHangBottomIn', 'lightFromWallIn', 'sconceCentreIn', 'tileThicknessMmOverride'];
// Light placement keys -> the option field holding that option's default,
// and the fallback when an option has none.
const PLACEMENT = {
  lightHangBottomIn: { field: 'defaultHangBottomIn', fallback: 80 },
  lightFromWallIn: { field: 'defaultFromWallIn', fallback: 14 },
  sconceCentreIn: { field: 'defaultMountCentreIn', fallback: 64 },
};
// Slider ranges the defaults are clamped into (index.html / src/ui.js).
const PLACEMENT_RANGE = { lightHangBottomIn: [60, 110], lightFromWallIn: [6, 36], sconceCentreIn: [56, 84] };
const PLACEMENT_KEYS = Object.keys(PLACEMENT);

/** The option's own default for a placement key.  `env` = { mirrorBottomIn,
 *  mirrorHeightIn } for defaults given as a function of the mirror. */
export function placementDefault(opt, key, env = {}) {
  let v = opt && opt[PLACEMENT[key].field];
  if (typeof v === 'function') v = v(env);
  if (!Number.isFinite(v)) return PLACEMENT[key].fallback;
  const [lo, hi] = PLACEMENT_RANGE[key];
  return Math.min(hi, Math.max(lo, v));
}
/** Does this option's default for `key` depend on the mirror? */
const derived = (opt, key) => !!opt && typeof opt[PLACEMENT[key].field] === 'function';
const DEBOUNCE_MS = 80;

/** Option lists for the UI: [{id, name, description}].  A description may
 *  be a function of ctx (e.g. a pendant stating its real limits for the
 *  room's ceiling). */
function optionLists(ctx) {
  const desc = (o) => (typeof o.description === 'function' ? o.description(ctx) : o.description) || '';
  const pick = (o) => ({ id: o.id, name: o.name, description: desc(o) });
  return {
    tiles: tiles().map(pick),
    lights: lights().map((o) => ({ ...pick(o), mount: o.mount || 'ceiling' })),
    transitions: TRANSITIONS.map(pick),
    extents: EXTENTS.map(pick),
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
  // Mirror (and ceiling) numbers the derived placement defaults read.
  const mirrorEnv = () => ({
    mirrorBottomIn: state.mirrorBottomIn ?? R.ovalMirror.bottomIn, mirrorHeightIn: R.ovalMirror.height / 0.0254,
    ceilingIn: config.ROOM.ceiling / 0.0254,
  });
  registerSavedPaints();             // the owners' saved custom paint colours
  const lists = optionLists(ctx);
  const has = (list, id) => list.some((o) => o.id === id);
  const patch = { options: lists };
  if (!has(lists.tiles, state.tile)) patch.tile = has(lists.tiles, DEFAULT_TILE) ? DEFAULT_TILE : lists.tiles[0]?.id ?? null;
  if (!has(lists.lights, state.light)) patch.light = has(lists.lights, DEFAULT_LIGHT) ? DEFAULT_LIGHT : lists.lights[0]?.id ?? null;
  if (!has(lists.transitions, state.transition)) patch.transition = lists.transitions[0].id;
  if (!has(lists.extents, state.accentExtent)) patch.accentExtent = lists.extents[0].id;
  state.set(patch);

  // ---- per-option light placement: { [lightId]: { key: value } } for the
  // sliders the user moved for that light this session.
  const userPlacement = new Map();
  const remember = (id, key, v) => {
    if (!id) return;
    if (!userPlacement.has(id)) userPlacement.set(id, {});
    userPlacement.get(id)[key] = v;
  };
  let applyingPlacement = false;
  /** Placement values for `id`: user's (this session) or the option's defaults. */
  function placementFor(id, keep = []) {
    const opt = getLight(id), mine = userPlacement.get(id) || {}, out = {};
    for (const k of PLACEMENT_KEYS) {
      if (keep.includes(k)) continue;
      out[k] = mine[k] ?? placementDefault(opt, k, mirrorEnv());
    }
    return out;
  }
  {
    // Hash / initial values (non-null) are the user's for the starting light.
    const given = PLACEMENT_KEYS.filter((k) => state[k] != null);
    for (const k of given) remember(state.light, k, state[k]);
    applyingPlacement = true;
    state.set(placementFor(state.light, given));
    applyingPlacement = false;
  }

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
      extent: state.accentExtent,
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
    const val = (k) => state[k] ?? placementDefault(opt, k, mirrorEnv());
    g.light = opt.build(ctx, {
      hangBottomIn: wall ? undefined : val('lightHangBottomIn'),
      mountCentreIn: wall ? val('sconceCentreIn') : undefined,
      offsetsIn: wall ? R.sconceOffsetsIn : undefined,     // pairs: [west, east] of centre
      centreXIn: R.lightCentreX / 0.0254,
      // "distance from wall" is measured from the finished (accent) face
      centreZIn: val('lightFromWallIn') + surface() / 0.0254,
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
  // Both sit in the vanity strip, so they move in either extent; nothing
  // else is mounted on the north wall east of it (the GFCI in photo 54 is
  // this same vanity outlet; the toilet tank tops out at 30", below the
  // accent's 40" start; the frame on the stool stands on the stool).
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
    if (!applyingPlacement) {
      // Slider moves (or hash values) are the user's choice for this light.
      for (const k of changed) if (PLACEMENT[k] && s[k] != null) remember(s.light, k, s[k]);
      if (changed.includes('light')) {
        // Switching light: jump to its defaults / this session's values.
        // (Re-entrant set: this listener sees those keys as slider moves.)
        applyingPlacement = true;
        state.set(placementFor(s.light, changed));
        applyingPlacement = false;
      } else if (changed.includes('mirrorBottomIn')) {
        // Mirror moved: defaults derived from it follow (sconces stay on the
        // mirror's widest point) unless the user set them for this light.
        const opt = getLight(s.light), mine = userPlacement.get(s.light) || {}, patch = {};
        for (const k of PLACEMENT_KEYS) {
          if (derived(opt, k) && mine[k] == null && !changed.includes(k)) patch[k] = placementDefault(opt, k, mirrorEnv());
        }
        applyingPlacement = true;
        state.set(patch);
        applyingPlacement = false;
      }
    }
    const want = { accent: false, mirror: false, light: false };
    for (const k of changed) {
      if (k === 'tile' || k === 'transition' || k === 'accentExtent' || k === 'accentTopIn' || k === 'tileThicknessMmOverride') want.accent = true;
      if (k === 'mirrorBottomIn') want.mirror = true;
      if (k === 'light' || PLACEMENT[k]) want.light = true;
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
    refreshOptions(extra = {}) {
      state.set({ options: optionLists(ctx), ...extra });
    },
    paintInPlace(hex) {
      const face = g.accent && g.accent.getObjectByName('accentFace');
      const m = face && [].concat(face.material)[0];
      const p = m && m.userData.paint;
      if (!p || p.finish === 'subway') return false;
      m.color.set(hex);
      p.hex = hex;
      return true;
    },
  };
}
