// UI panel (markup in index.html): scenario toggle, tile / light /
// transition selects, sliders, FPS counter, camera presets, Hide UI (H).
// Everything goes through the observable state; the remodel components
// listen to the same state.
//
// Option lists come from state.options = {tiles, lights, transitions}
// (each [{id, name}]); call state.set({options}) any time and the selects
// repopulate.  Until then each select shows a placeholder "none" item.

const DEFAULT_TRANSITIONS = [
  { id: 'keep-cap', name: 'Keep cap' },
  { id: 'remove-cap', name: 'Remove cap + Schluter trim' },
  { id: 'flush-fill', name: 'Flush (build out drywall)' },
];

const $ = (id) => document.getElementById(id);

export function buildUI({ state, controls, presets, applyPreset }) {
  const panel = $('ui');
  const sel = { tile: $('sel-tile'), light: $('sel-light'), transition: $('sel-transition') };

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
      el.appendChild(o);
    }
    el.value = current ?? list[0].id;
  };
  const lists = () => ({
    tile: state.options?.tiles || [],
    light: state.options?.lights || [],
    transition: state.options?.transitions || DEFAULT_TRANSITIONS,
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

  // ---- scenario toggle
  const scn = { current: $('scn-current'), remodel: $('scn-remodel') };
  for (const [k, el] of Object.entries(scn)) el.addEventListener('click', () => state.set({ scenario: k }));

  // ---- sliders
  const sliders = [
    { id: 'rng-accentTop', key: 'accentTopIn', fmt: (v) => `${v}"` },
    { id: 'rng-mirrorBottom', key: 'mirrorBottomIn', fmt: (v) => `${v}"` },
    { id: 'rng-lightHang', key: 'lightHangBottomIn', fmt: (v) => `${v}"` },
    { id: 'rng-tileThk', key: 'tileThicknessMmOverride', fmt: (v) => (v == null ? 'auto' : `${v} mm`), nullAtZero: true },
  ];
  for (const s of sliders) {
    const el = $(s.id);
    s.el = el;
    s.out = $(s.id + '-val');
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      state.set({ [s.key]: s.nullAtZero && v === 0 ? null : v });
    });
  }

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

  // ---- hide UI
  $('btn-hide').addEventListener('click', () => state.set({ uiVisible: false }));
  addEventListener('keydown', (e) => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName || '') && e.target.type !== 'range') return;
    if (e.code === 'KeyH') state.set({ uiVisible: !state.uiVisible });
    const m = /^Digit([1-9])$/.exec(e.code);
    if (m && presets.some((p) => p.id === +m[1])) applyPreset(+m[1]);
  });

  // ---- reflect state into the DOM
  function render(_s, changed) {
    if (!changed || changed.includes('options')) refreshOptions();
    for (const k of Object.keys(sel)) if (state[k] != null && sel[k].value !== state[k]) sel[k].value = state[k];
    for (const [k, el] of Object.entries(scn)) el.classList.toggle('on', state.scenario === k);
    for (const s of sliders) {
      const v = state[s.key];
      s.el.value = v == null ? 0 : v;
      s.out.textContent = s.fmt(v);
    }
    panel.classList.toggle('hidden', !state.uiVisible);
    $('ui-show-hint').classList.toggle('hidden', state.uiVisible);
  }
  state.subscribe(render);
  render(state, null);

  // ---- gamepad: badge + default bindings (A light, B tile, Y scenario, Start UI)
  const badge = $('gamepad-badge');
  controls.onGamepadChange = (on, id) => {
    badge.classList.toggle('hidden', !on);
    badge.title = id || '';
  };
  const cycle = (key, list) => {
    if (!list.length) return;
    const i = list.findIndex((o) => o.id === state[key]);
    state.set({ [key]: list[(i + 1) % list.length].id });
  };
  controls.onButton('A', () => cycle('light', lists().light));
  controls.onButton('B', () => cycle('tile', lists().tile));
  controls.onButton('Y', () => state.set({ scenario: state.scenario === 'current' ? 'remodel' : 'current' }));
  controls.onButton('Start', () => state.set({ uiVisible: !state.uiVisible }));
  controls.onButton('X', () => cycle('transition', lists().transition));

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

  const ui = { refreshOptions, frame, fps: 0 };
  return ui;
}
