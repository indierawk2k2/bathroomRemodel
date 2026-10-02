// Defensive config + texture readers shared by the remodel components and
// the option files.  Everything arrives through `ctx`; nothing here imports
// from the viewer's modules (src/config.js, src/units.js) so the components
// work standalone in dev/components.html and in the real app alike.

export const IN = 0.0254;
export const inch = (n) => n * IN;
export const mm = (n) => n / 1000;

/** Read a number from ctx.config trying several dotted paths; else default. */
export function cfg(ctx, paths, fallback) {
  const root = ctx && ctx.config;
  if (root) {
    for (const p of [].concat(paths)) {
      let v = root;
      for (const k of p.split('.')) { v = v == null ? undefined : v[k]; }
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
  }
  return fallback;
}

/**
 * SPEC numbers (metres) with every key the components look for.  The first
 * path in each list is the canonical one (as in dev/config.js); the others
 * are tolerated aliases.
 */
export function remodelDims(ctx) {
  return {
    ceiling: cfg(ctx, ['ROOM.ceiling', 'ROOM.ceilingHeight', 'ROOM.height'], inch(120)),
    wainscotTop: cfg(ctx, ['ROOM.wainscotTop', 'ROOM.wainscot.top', 'ROOM.wainscotHeight'], inch(40)),
    capHeight: cfg(ctx, ['ROOM.wainscotCapHeight', 'ROOM.wainscot.capHeight', 'ROOM.capHeight'], mm(6)),
    wainscotProud: cfg(ctx, ['ROOM.wainscotProud', 'ROOM.wainscot.proud', 'ROOM.wainscotThickness'], mm(13)),
    wainscotThinset: cfg(ctx, ['ROOM.wainscotThinset', 'ROOM.wainscot.thinset'], mm(3)),
    // vanity strip (x 30..76): the 'vanity-strip' extent, and the pattern
    // origin / sconce reference in every extent
    accentX0: cfg(ctx, ['REMODEL.vanityStripX0', 'REMODEL.accentX0', 'REMODEL.accent.x0'], inch(30)),
    accentX1: cfg(ctx, ['REMODEL.vanityStripX1', 'REMODEL.accentX1', 'REMODEL.accent.x1'], inch(76)),
    // 'full-wall' extent: on round the window to the east inside corner
    fullWallX1: cfg(ctx, ['REMODEL.fullWallX1', 'ROOM.width'], inch(102)),
    roomWidth: cfg(ctx, ['ROOM.width'], inch(102)),
    // window trim outline (src/room.js buildWindow), cut out of the full wall
    window: {
      trimX0: cfg(ctx, ['WINDOW.trimX0'], inch(76)),
      trimX1: cfg(ctx, ['WINDOW.trimX1'], inch(99)),
      sillTop: cfg(ctx, ['WINDOW.sillTop'], inch(44)),
      head: cfg(ctx, ['WINDOW.head'], inch(90)),
      casingProud: cfg(ctx, ['WINDOW.casingProud'], inch(0.6)),
      stoolThick: cfg(ctx, ['WINDOW.stoolThick'], inch(0.75)),
      stoolHorn: cfg(ctx, ['WINDOW.stoolHorn'], inch(0.5)),
      stoolNose: cfg(ctx, ['WINDOW.sillNose'], inch(1.5)),
      apronH: cfg(ctx, ['WINDOW.apronH'], inch(1.75)),
    },
    accentBottom: cfg(ctx, ['REMODEL.accentBottom', 'REMODEL.accent.y0'], inch(40)),
    accentTop: cfg(ctx, ['REMODEL.accentTop', 'REMODEL.accent.y1'], inch(120)),
    thinset: cfg(ctx, ['REMODEL.thinset', 'REMODEL.thinsetM'], mm(3)),
    mirrorCentreX: cfg(ctx, ['REMODEL.mirrorCentreX', 'REMODEL.mirror.centreX', 'REMODEL.mirror.x'], inch(54)),
    mirrorBottom: cfg(ctx, ['REMODEL.mirrorBottom', 'REMODEL.mirror.bottom'], inch(42)),
    lightCentreX: cfg(ctx, ['REMODEL.lightCentreX', 'REMODEL.light.x'], inch(54)),
    lightCentreZ: cfg(ctx, ['REMODEL.lightCentreZ', 'REMODEL.light.z'], inch(11)),
    junctionX: cfg(ctx, ['REMODEL.junction.x'], inch(49.5)),
    junctionY: cfg(ctx, ['REMODEL.junction.y'], inch(40)),
    junctionZ: cfg(ctx, ['REMODEL.junction.z'], 0),
    junctionRadius: cfg(ctx, ['REMODEL.junction.radius'], inch(30)),
  };
}

/** Texture lookup that tolerates a missing map / missing entry. */
export function tex(ctx, name) {
  const t = ctx && ctx.textures && ctx.textures[name];
  return t && t.isTexture ? t : null;
}

/** Companion maps: `<name>_normal`, `<name>Normal`, or texture.userData.normalMap. */
export function texCompanion(ctx, name, kind) {
  const base = tex(ctx, name);
  const cands = [`${name}_${kind}`, `${name}${kind[0].toUpperCase()}${kind.slice(1)}`,
    `${name}_${kind}Map`, `${name}${kind[0].toUpperCase()}${kind.slice(1)}Map`];
  for (const c of cands) { const t = tex(ctx, c); if (t) return t; }
  const ud = base && base.userData && base.userData[`${kind}Map`];
  return ud && ud.isTexture ? ud : null;
}

/** Real-world size [w, h] in metres of one repeat of a named texture. */
export function physicalSize(ctx, name, fallback) {
  const ps = ctx && ctx.textures && ctx.textures.physicalSize;
  const v = ps && ps[name];
  if (Array.isArray(v) && v.length >= 2 && v[0] > 0 && v[1] > 0) return [v[0], v[1]];
  const t = tex(ctx, name);
  const u = t && t.userData && t.userData.physicalSizeM;
  if (Array.isArray(u) && u[0] > 0 && u[1] > 0) return [u[0], u[1]];
  return fallback;
}

/**
 * Clone a texture for use on a surface whose UVs are already expressed in
 * "repeats" (u = metres / physicalSize).  Repeat is reset to 1 so the UVs
 * alone control scale; the image source is shared (cheap).
 */
export function repeatClone(THREE, t, colour) {
  if (!t) return null;
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(1, 1);
  c.offset.set(0, 0);
  if (colour) c.colorSpace = THREE.SRGBColorSpace;
  c.needsUpdate = true;
  return c;
}

/** Read a field from a plain or observable state object. */
export function readState(state, key, fallback) {
  if (!state) return fallback;
  let v;
  if (typeof state.get === 'function') { try { v = state.get(key); } catch (e) { v = undefined; } }
  if (v === undefined) v = state[key];
  if (v === undefined && state.values) v = state.values[key];
  return v === undefined ? fallback : v;
}

/** 2700 K-ish warm white (linear working colour). */
export function warmWhite(THREE) {
  // 2700 K as the eye reads it after adapting (a camera white-balanced to
  // daylight records ~(1, .66, .34); fully that orange looks like sodium light).
  return new THREE.Color().setRGB(1.0, 0.78, 0.55, THREE.SRGBColorSpace);
}
