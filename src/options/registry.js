// Option registry: tiles, wallpapers and lights.
//
// Tile / wallpaper option (SPEC section 6):
//   { id, name, kind: 'tile' | 'wallpaper', thicknessMm, makeMaterial(ctx),
//     // optional extras used by the remodel components:
//     repeatM: [w, h],        // metres covered by one texture repeat
//     textureName: 'tile_x',  // key in ctx.textures, if a map exists
//     groutColor, edgeColor,  // CSS colours for edges / the junction inset
//     description }
// Wallpapers are tiles with kind 'wallpaper' and thicknessMm 0 (they sit on
// the drywall with no thinset).
//
// Light option:
//   { id, name, description?, build(ctx, { hangBottomIn, ... }) -> THREE.Group }
//   The group carries userData.lights (array of THREE.Light) and
//   userData.onOff(bool).

const _tiles = new Map();
const _lights = new Map();

function check(opt, fields, what) {
  for (const f of fields) {
    if (opt == null || opt[f] === undefined) throw new Error(`${what} option missing "${f}": ${opt && opt.id}`);
  }
}

export function registerTile(opt) {
  check(opt, ['id', 'name', 'makeMaterial'], 'Tile');
  const o = { kind: 'tile', thicknessMm: 0, ...opt };
  if (o.kind === 'wallpaper') o.thicknessMm = 0;
  _tiles.set(o.id, o);
  return o;
}

/** Same as registerTile with kind forced to 'wallpaper' and thickness 0. */
export function registerWallpaper(opt) {
  return registerTile({ ...opt, kind: 'wallpaper', thicknessMm: 0 });
}

export function registerLight(opt) {
  check(opt, ['id', 'name', 'build'], 'Light');
  _lights.set(opt.id, opt);
  return opt;
}

const byOrder = (a, b) => (a.order ?? 100) - (b.order ?? 100) || String(a.name).localeCompare(b.name);

/** All tile + wallpaper options, sorted by `order` (default 100) then name. */
export const tiles = () => [..._tiles.values()].sort(byOrder);
export const wallpapers = () => tiles().filter((t) => t.kind === 'wallpaper');
export const lights = () => [..._lights.values()].sort(byOrder);
export const getTile = (id) => _tiles.get(id) || null;
export const getLight = (id) => _lights.get(id) || null;
