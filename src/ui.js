// UI panel (markup in index.html): scenario toggle, Day / Night, light on/off,
// tile / light / transition / accent-extent selects, sliders, quality select, FPS counter,
// camera presets, Hide UI (H).  Everything goes through the observable
// state; the remodel components listen to the same state.
//
// Option lists come from state.options = {tiles, lights, transitions, extents}
// (each [{id, name, description?, mount?}]); call state.set({options}) any
// time and the selects repopulate.  Until then each select shows a
// placeholder "none" item.
//
// Custom colour (under the tile select; src/options/paints/custom.js): colour
// input + finish select live-preview on the accent wall as the unsaved option
// 'custom' (paint finishes recolour the material in place, a finish change or
// the subway finish rebuilds the wall); Save stores it in localStorage and
// adds it to the list; Delete removes the selected saved colour.  Picking any
// paint option pre-fills the chooser.  An unsaved colour is mirrored into the
// URL hash (tile=custom&paint=&finish=&pname=) so the link reproduces it.
//
// Keys: H panel, N day/night, L light on/off, 1-6 presets.
// Gamepad: A light, B tile, X transition, Y scenario, Back accent extent, Start UI,
//          D-pad left/right previous/next preset.

import { getTile, tiles } from './options/index.js';
import { FINISHES, normHex } from './options/paints/paint.js';
import { setUnsavedPaint, clearUnsavedPaint, savePaint, deletePaint, isSavedPaint, UNSAVED_ID } from './options/paints/custom.js';

const $ = (id) => document.getElementById(id);
const PAINT_DEBOUNCE_MS = 100;

export function buildUI({ state, controls, presets, applyPreset, quality, remodel }) {
  const panel = $('ui');
  const sel = { tile: $('sel-tile'), light: $('sel-light'), transition: $('sel-transition'), accentExtent: $('sel-extent') };

  // ---- selects
  const fill = (el, list, current) => {
    el.innerHTML = '';
    if (!list || !list.length) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = 'none';
      el.appendChild(o);
      el.disabled = true;
      return;
    }
    el.disabled = false;
    for (const it of list) {
      const o = document.createElement('option');
      o.value = it.id;
      o.textContent = it.name || it.id;
      if (it.description) o.title = it.description;
      el.appendChild(o);
    }
    el.value = current ?? list[0].id;
  };
  const lists = () => ({
    tile: state.options?.tiles || [],
    light: state.options?.lights || [],
    transition: state.options?.transitions || [],
    accentExtent: state.options?.extents || [],
  });
  function refreshOptions() {
    const L = lists();
    for (const k of Object.keys(sel)) fill(sel[k], L[k], state[k]);
    // adopt the first option if the state has none yet
    const patch = {};
    for (const k of Object.keys(sel)) if (!state[k] && L[k].length) patch[k] = L[k][0].id;
    if (Object.keys(patch).length) state.set(patch);
  }
  for (const [k, el] of Object.entries(sel)) {
    el.addEventListener('change', () => state.set({ [k]: el.value || null }));
  }
  const describe = (k) => lists()[k].find((o) => o.id === state[k])?.description || '';

  // ---- custom paint colour chooser
  const pc = {
    colour: $('paint-colour'), finish: $('paint-finish'), name: $('paint-name'),
    apply: $('paint-apply'), save: $('paint-save'), del: $('paint-delete'), msg: $('paint-msg'),
  };
  pc.finish.innerHTML = FINISHES.map((f) => `<option value="${f.id}">${f.name}</option>`).join('');
  pc.finish.value = 'eggshell';
  const say = (t) => { pc.msg.textContent = t || ''; };
  const chooserValues = () => ({
    hex: normHex(pc.colour.value) || '#808080',
    finish: pc.finish.value,
    name: pc.name.value.trim(),
  });
  /** Mirror the unsaved colour into the hash (or drop it when another
   *  option is picked), keeping every other key.  No hashchange fires. */
  function writeHash() {
    const parts = location.hash.replace(/^#/, '').split('&').filter(Boolean);
    const kv = parts.map((p) => { const i = p.indexOf('='); return i < 0 ? [p, null] : [p.slice(0, i), p.slice(i + 1)]; });
    const hadTile = kv.some(([k]) => k === 'tile');
    const keep = kv.filter(([k]) => !['tile', 'paint', 'finish', 'pname'].includes(k));
    if (state.tile === UNSAVED_ID) {
      const o = getTile(UNSAVED_ID);
      if (!o) return;
      keep.push(['tile', 'custom'], ['paint', o.hex.slice(1)], ['finish', o.finish]);
      if (o.paintName && o.paintName !== o.hex) keep.push(['pname', encodeURIComponent(o.paintName)]);
    } else if (hadTile && state.tile) {
      keep.push(['tile', encodeURIComponent(state.tile)]);
    } else if (!hadTile) {
      return;
    }
    const h = keep.map(([k, v]) => (v == null ? k : `${k}=${v}`)).join('&');
    try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { /* file:// etc. */ }
  }
  /** Show the chooser's colour on the wall as the unsaved option. */
  function applyChooser() {
    const v = chooserValues();
    const prev = getTile(state.tile);
    const inPlace = state.tile === UNSAVED_ID && prev && prev.kind === 'paint' && prev.finish === v.finish && v.finish !== 'subway';
    setUnsavedPaint(v);
    if (inPlace && remodel && remodel.paintInPlace(v.hex)) {
      remodel.refreshOptions();                 // new name / description in the list
      window.__app?.probe?.request(12);          // brass / chrome see the new wall colour
    } else if (state.tile === UNSAVED_ID) {
      remodel?.refreshOptions();
      remodel?.rebuild({ accent: true });
      window.__app?.probe?.request(12);
    } else {
      remodel?.refreshOptions({ tile: UNSAVED_ID });
      if (!remodel) state.set({ tile: UNSAVED_ID });
    }
    writeHash();
    say(`Showing ${v.hex} (${FINISHES.find((f) => f.id === v.finish).name.toLowerCase()}), not saved`);
  }
  let paintTimer = null;
  const applySoon = () => { clearTimeout(paintTimer); paintTimer = setTimeout(applyChooser, PAINT_DEBOUNCE_MS); };
  pc.colour.addEventListener('input', applySoon);
  pc.finish.addEventListener('change', applySoon);
  pc.apply.addEventListener('click', () => { clearTimeout(paintTimer); applyChooser(); });
  pc.save.addEventListener('click', () => {
    clearTimeout(paintTimer);
    const v = chooserValues();
    if (!v.name) { pc.name.value = v.name = v.hex; }
    const was = state.tile;
    const id = savePaint(v);
    if (!id) { say('Could not save: browser storage is unavailable'); return; }
    if (was === UNSAVED_ID) clearUnsavedPaint();
    remodel?.refreshOptions({ tile: id });
    if (was === id) remodel?.rebuild({ accent: true });   // overwrote the selected colour
    writeHash();
    say(`Saved "${v.name}"`);
  });
  pc.del.addEventListener('click', () => {
    const id = state.tile;
    if (!isSavedPaint(id)) return;
    const name = getTile(id)?.paintName || id;
    deletePaint(id);
    const first = tiles().find((t) => t.kind === 'paint' && !t.id.startsWith('custom')) || tiles()[0];
    remodel?.refreshOptions({ tile: first ? first.id : null });
    writeHash();
    say(`Deleted "${name}"`);
  });
  /** Selecting a paint option pre-fills the chooser so it can be tweaked. */
  let prefilledFor = null;
  function syncChooser() {
    const o = getTile(state.tile);
    pc.del.disabled = !isSavedPaint(state.tile);
    if (!o || o.kind !== 'paint') { prefilledFor = null; return; }
    const sig = `${o.id}|${o.hex}|${o.finish}|${o.paintName}`;
    if (sig === prefilledFor) return;
    prefilledFor = sig;
    // (only touch fields that differ: the native picker may be open)
    if (normHex(pc.colour.value) !== o.hex) pc.colour.value = o.hex;
    if (pc.finish.value !== o.finish) pc.finish.value = o.finish;
    const nm = o.paintName && o.paintName !== o.hex ? o.paintName : '';
    if (o.id !== UNSAVED_ID || !pc.name.value) pc.name.value = nm;
  }

  // ---- toggles
  const scn = { current: $('scn-current'), remodel: $('scn-remodel') };
  for (const [k, el] of Object.entries(scn)) el.addEventListener('click', () => state.set({ scenario: k }));
  const tod = { day: $('tod-day'), night: $('tod-night') };
  tod.day.addEventListener('click', () => state.set({ night: false }));
  tod.night.addEventListener('click', () => state.set({ night: true }));
  const lon = { on: $('light-on'), off: $('light-off') };
  lon.on.addEventListener('click', () => state.set({ lightsOn: true }));
  lon.off.addEventListener('click', () => state.set({ lightsOn: false }));

  // ---- quality
  const selQ = $('sel-quality');
  if (quality) {
    selQ.innerHTML = quality.ORDER.map((id) => `<option value="${id}">${quality.LEVELS[id].name}</option>`).join('');
    selQ.addEventListener('change', () => state.set({ quality: selQ.value }));
  }
  const qLabel = $('quality-label');
  const setQualityLabel = (txt) => { qLabel.textContent = txt; };

  // ---- sliders.  The light-height slider follows the selected light: a
  // ceiling fixture sets its hang (bottom) height, a wall fixture its centre.
  // The distance-from-wall slider only applies to ceiling fixtures.  Each
  // light's defaults come from its option (src/remodel/index.js applies them
  // when the light changes).
  const lightMount = () => lists().light.find((o) => o.id === state.light)?.mount || 'ceiling';
  const HANG = { key: 'lightHangBottomIn', label: 'Light hang (bottom)', min: 60, max: 110, step: 0.5 };
  const WALL = { key: 'sconceCentreIn', label: 'Sconce height (centre)', min: 56, max: 84, step: 0.5 };
  const sliders = [
    { id: 'rng-accentTop', key: 'accentTopIn', fmt: (v) => `${v}"` },
    { id: 'rng-mirrorBottom', key: 'mirrorBottomIn', fmt: (v) => `${v}"` },
    { id: 'rng-lightHang', key: () => (lightMount() === 'wall' ? WALL : HANG).key, fmt: (v) => `${v}"`, light: true },
    { id: 'rng-lightFromWall', key: 'lightFromWallIn', fmt: (v) => `${v}"` },
    { id: 'rng-tileThk', key: 'tileThicknessMmOverride', fmt: (v) => (v == null ? 'auto' : `${v} mm`), nullAtZero: true },
  ];
  const keyOf = (s) => (typeof s.key === 'function' ? s.key() : s.key);
  for (const s of sliders) {
    const el = $(s.id);
    s.el = el;
    s.out = $(s.id + '-val');
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      state.set({ [keyOf(s)]: s.nullAtZero && v === 0 ? null : v });
    });
  }
  const lightLabel = $('rng-lightHang-label');

  // ---- presets
  const pbox = $('presets');
  pbox.innerHTML = '';
  for (const p of presets) {
    const b = document.createElement('button');
    b.textContent = `${p.id} ${p.name}`;
    b.title = `Preset ${p.id} (key ${p.id})`;
    b.addEventListener('click', () => applyPreset(p.id));
    pbox.appendChild(b);
  }
  let presetIdx = Math.max(0, presets.findIndex((p) => p.id === (window.__app?.presetId ?? 3)));
  const stepPreset = (d) => {
    const cur = presets.findIndex((p) => p.id === window.__app?.presetId);
    presetIdx = ((cur >= 0 ? cur : presetIdx) + d + presets.length) % presets.length;
    applyPreset(presets[presetIdx].id);
  };

  // ---- keys
  $('btn-hide').addEventListener('click', () => state.set({ uiVisible: false }));
  addEventListener('keydown', (e) => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName || '') && e.target.type !== 'range') return;
    if (e.repeat) return;
    if (e.code === 'KeyH') state.set({ uiVisible: !state.uiVisible });
    if (e.code === 'KeyN') state.set({ night: !state.night });
    if (e.code === 'KeyL') state.set({ lightsOn: !state.lightsOn });
    const m = /^Digit([1-9])$/.exec(e.code);
    if (m && presets.some((p) => p.id === +m[1])) applyPreset(+m[1]);
  });

  // ---- reflect state into the DOM
  function render(_s, changed) {
    if (!changed || changed.includes('options')) refreshOptions();
    for (const k of Object.keys(sel)) if (state[k] != null && sel[k].value !== state[k]) sel[k].value = state[k];
    for (const [k, el] of Object.entries(scn)) el.classList.toggle('on', state.scenario === k);
    tod.day.classList.toggle('on', !state.night);
    tod.night.classList.toggle('on', !!state.night);
    lon.on.classList.toggle('on', state.lightsOn !== false);
    lon.off.classList.toggle('on', state.lightsOn === false);
    if (quality && selQ.value !== state.quality) selQ.value = state.quality;
    const L = lightMount() === 'wall' ? WALL : HANG;
    lightLabel.firstChild.textContent = L.label + ' ';
    $('row-lightFromWall').classList.toggle('hidden', lightMount() === 'wall');
    Object.assign(sliders[2].el, { min: L.min, max: L.max, step: L.step });
    for (const s of sliders) {
      const v = state[keyOf(s)];
      s.el.value = v == null ? 0 : v;
      s.out.textContent = s.fmt(v);
    }
    $('desc-transition').textContent = describe('transition');
    $('desc-tile').textContent = describe('tile');
    if (!changed || changed.includes('tile') || changed.includes('options')) syncChooser();
    if (changed && changed.includes('tile') && state.tile !== UNSAVED_ID) writeHash();
    panel.classList.toggle('hidden', !state.uiVisible);
    $('ui-show-hint').classList.toggle('hidden', state.uiVisible);
  }
  state.subscribe(render);
  render(state, null);

  // ---- gamepad: badge, legend + bindings
  const badge = $('gamepad-badge');
  const legend = $('pad-legend');
  controls.onGamepadChange = (on, id) => {
    badge.classList.toggle('hidden', !on);
    legend.classList.toggle('hidden', !on);
    badge.title = id || '';
  };
  const cycle = (key, list) => {
    if (!list.length) return;
    const i = list.findIndex((o) => o.id === state[key]);
    state.set({ [key]: list[(i + 1) % list.length].id });
  };
  for (const b of ['A', 'B', 'X', 'Y', 'Back', 'Start', 'Left', 'Right']) controls.clearButton(b);
  controls.onButton('A', () => cycle('light', lists().light));
  controls.onButton('B', () => cycle('tile', lists().tile));
  controls.onButton('X', () => cycle('transition', lists().transition));
  controls.onButton('Back', () => cycle('accentExtent', lists().accentExtent));
  controls.onButton('Y', () => state.set({ scenario: state.scenario === 'current' ? 'remodel' : 'current' }));
  controls.onButton('Start', () => state.set({ uiVisible: !state.uiVisible }));
  controls.onButton('Left', () => stepPreset(-1));
  controls.onButton('Right', () => stepPreset(1));

  // ---- FPS: rolling 1 s average
  const fpsEl = $('fps');
  const stamps = [];
  let lastShown = 0;
  function frame(now) {
    stamps.push(now);
    while (stamps.length && now - stamps[0] > 1000) stamps.shift();
    if (now - lastShown > 250 && stamps.length > 1) {
      const fps = ((stamps.length - 1) * 1000) / (stamps[stamps.length - 1] - stamps[0]);
      fpsEl.textContent = fps.toFixed(0);
      ui.fps = fps;
      lastShown = now;
    }
  }

  const ui = { refreshOptions, frame, fps: 0, setQualityLabel, stepPreset };
  return ui;
}
