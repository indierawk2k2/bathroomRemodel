// Custom paint colours from the panel's colour chooser.
//
// Saved colours: localStorage['bathroomRemodel.customPaints'] = JSON array of
//   { id: 'custom-<slug>-<rand>', name, hex: '#rrggbb', finish }
// registered at startup (registerSavedPaints) after the presets, built by
// makePaint, so they are full registry options (select, gamepad B, hash
// tile=<id>, description).  The unsaved colour being edited is the option
// id 'custom' (hash: tile=custom&paint=<hex>&finish=<finish>&pname=<name>).
//
// To promote a saved colour to a preset, copy its hex / finish / name into a
// new file in this folder (see docs/ADDING_OPTIONS.md, "Paint colours").
import { registerTile, unregisterTile, tiles } from '../registry.js';
import { makePaint, normHex, isFinish } from './paint.js';

export const STORAGE_KEY = 'bathroomRemodel.customPaints';
export const UNSAVED_ID = 'custom';
const SAVED_ORDER = 90;          // after every preset (paints are 60-64)

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((c) => c && typeof c.id === 'string' && normHex(c.hex)) : [];
  } catch (e) {
    return [];
  }
}
function writeStore(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.warn('custom paints: could not save', e);
    return false;
  }
}

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'colour';
const finishOf = (f) => (isFinish(f) ? f : 'eggshell');

function optionFor(c, i, unsaved = false) {
  const hex = normHex(c.hex);
  const name = (c.name || '').trim() || hex;
  return makePaint({
    id: c.id, name, tag: unsaved ? 'unsaved' : 'saved', hex, finish: finishOf(c.finish),
    order: unsaved ? SAVED_ORDER + 999 : SAVED_ORDER + i,
    description: `${unsaved ? 'Unsaved custom colour' : 'Saved custom colour'} "${name}", ${hex}, `
      + `${finishOf(c.finish) === 'subway' ? 'glazed 3x6 subway tile (stacked, 8 mm)' : finishOf(c.finish) + ' paint'}`,
  });
}

/** Saved colours as stored ({id, name, hex, finish}). */
export const savedPaints = () => readStore();
export const isSavedPaint = (id) => typeof id === 'string' && id.startsWith('custom-') && readStore().some((c) => c.id === id);

/** (Re)register every saved colour; drops registrations of deleted ones. */
export function registerSavedPaints() {
  const list = readStore();
  for (const t of tiles()) if (t.id.startsWith('custom-') && !list.some((c) => c.id === t.id)) unregisterTile(t.id);
  list.forEach((c, i) => registerTile(optionFor(c, i)));
  return list;
}

/** Register / replace the unsaved colour (option id 'custom'). */
export function setUnsavedPaint({ hex, finish, name }) {
  const h = normHex(hex);
  if (!h) return null;
  return registerTile(optionFor({ id: UNSAVED_ID, name, hex: h, finish }, 0, true));
}
export const clearUnsavedPaint = () => unregisterTile(UNSAVED_ID);

/**
 * Save { name, hex, finish }.  A saved colour with the same name (case-
 * insensitive) is overwritten in place (keeps its id).  Returns the id, or
 * null when storage is unavailable.
 */
export function savePaint({ name, hex, finish }) {
  const h = normHex(hex);
  if (!h) return null;
  const nm = (name || '').trim() || h;
  const list = readStore();
  const i = list.findIndex((c) => (c.name || '').trim().toLowerCase() === nm.toLowerCase());
  const id = i >= 0 ? list[i].id : `custom-${slug(nm)}-${Math.random().toString(36).slice(2, 6)}`;
  const entry = { id, name: nm, hex: h, finish: finishOf(finish) };
  if (i >= 0) list[i] = entry; else list.push(entry);
  if (!writeStore(list)) return null;
  registerSavedPaints();
  return id;
}

/** Delete a saved colour; true when it existed. */
export function deletePaint(id) {
  const list = readStore();
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  writeStore(next);
  unregisterTile(id);
  registerSavedPaints();
  return true;
}
