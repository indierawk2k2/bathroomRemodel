// Tiny observable store.  Fields are readable directly (state.scenario);
// change them with state.set({...}); listen with state.subscribe(fn).
//
// subscribe(fn) calls fn(state, changedKeys) after every set() that changed
// something, and returns an unsubscribe function.

export const DEFAULT_STATE = {
  scenario: 'current', // 'current' | 'remodel'
  tile: null, // option id from state.options.tiles
  light: null, // option id from state.options.lights
  transition: 'keep-cap', // 'keep-cap' | 'remove-cap' | 'flush-fill'
  accentTopIn: 120,
  mirrorBottomIn: 42,
  lightHangBottomIn: 90,
  tileThicknessMmOverride: null, // null = use the option's own thickness
  uiVisible: true,
  // Filled by the option registry (integration pass):
  // { tiles:[{id,name}], lights:[{id,name}], transitions:[{id,name}] }
  options: null,
};

export function createState(initial = {}) {
  const listeners = new Set();
  const store = {
    set(patch) {
      const changed = [];
      for (const [k, v] of Object.entries(patch)) {
        if (typeof store[k] === 'function') continue;
        if (store[k] !== v) {
          store[k] = v;
          changed.push(k);
        }
      }
      if (changed.length) for (const fn of [...listeners]) fn(store, changed);
      return changed;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    snapshot() {
      const out = {};
      for (const [k, v] of Object.entries(store)) if (typeof v !== 'function') out[k] = v;
      return out;
    },
  };
  Object.assign(store, DEFAULT_STATE, initial);
  return store;
}
