# Adding options (tiles, wallpapers, lights)

Every selectable finish or fixture is **one file** plus **one line** in
`src/options/index.js` (plus a texture-pack entry if it is image-based).
Nothing else in the app changes: the UI selects, the URL hash, the accent
wall, the junction inspector and the gamepad buttons all read the registry.

```
src/options/
  registry.js          registerTile / registerWallpaper / registerLight, tiles(), lights(), getTile(id), getLight(id)
  index.js             imports every option file (one line each) and registers them
  procedural.js        helpers for runtime maps (noise, height -> normal, canvas textures, tileMaterial)
  tiles/*.js           kind: 'tile'
  wallpapers/*.js      kind: 'wallpaper' (thicknessMm 0, no thin-set)
  lights/*.js          light fixtures; lights/common.js has chains, rods, bulbs, PointLights
```

Wallpapers go into the **same** registry as tiles (`kind: 'wallpaper'`), so a
single "Tile / wallpaper" select covers both.

Every recipe below ends the same way:

1. one `export { default as <camelName> } from '<path>';` line in the right
   block of `src/options/index.js` (the UI order comes from the option's
   `order` number, then its name);
2. reload `http://localhost:8787/#scenario=remodel&tile=<id>` (or `light=<id>`)
   and check preset 3 (vanity) and preset 5 (junction close-up), whose inset
   prints the new face depth and the step against the wainscot.

Hard-reload (Cmd-Shift-R) after editing: `python3 -m http.server` lets the
browser cache the ES modules.

## Rules for option files

- **Never import `three` or app modules** in an option file: use `ctx.THREE`.
  Read numbers and textures with the helpers in `src/remodel/cfg.js`:
  `remodelDims(ctx)`, `tex(ctx, name)`, `texCompanion(ctx, name, 'normal' | 'roughness' | 'alpha')`,
  `physicalSize(ctx, name, fallback)`, `repeatClone(THREE, texture, isColour)`.
- Every texture can be missing at runtime: always keep a flat-colour or
  procedural fallback.
- The albedo maps already carry the colour: when a `map` is set, keep the
  material `color` white (`0xffffff`) or the colour is applied twice.
- Normal maps are OpenGL convention (+Y up); leave `normalScale` at 1.

### Tile / wallpaper shape

```js
export default {
  id: 'kebab-id',            // stable: used in URLs (#tile=...), state and saved settings
  name: 'Shown in the UI',
  kind: 'tile',              // or 'wallpaper' (thicknessMm forced to 0, no thin-set)
  order: 40,                 // optional UI order
  thicknessMm: 8,            // tile body; the accent wall adds 3 mm thin-set
  textureName: 'tile_x',     // key in ctx.textures (may be missing)
  repeatM: [0.3048, 0.3048], // metres covered by one texture repeat (fallback size)
  groutColor: '#eeeeee',     // caulk-joint colour at the wainscot
  edgeColor: '#ccddcc',      // colour of the layer in the junction inset
  description: 'one line shown under the select',
  makeMaterial(ctx) { return new ctx.THREE.MeshPhysicalMaterial({...}); },
  repeatFor(ctx) { return [w, h]; }   // real repeat size used for UVs
};
```

The accent wall writes UVs in *repeats*: `u = (x - x0) / repeatW`,
`v = (y - y0) / repeatH`, from the accent's bottom-left corner, so tiles start
whole at the tub-column edge and on the wainscot. Textures must therefore have
`repeat = (1, 1)` and `RepeatWrapping`, which is what `repeatClone()` gives
(it shares the image, so it is cheap). Canvas / image **top = top of the
wall**; the bottom row of the image sits on the wainscot, so make the repeat a
whole number of tiles.

## 1. A tile from a product photo

**a. Texture builder.** In `tools/make_textures.py` add a function next to
the other `tex_*` builders. Rectify a flat, evenly lit area that covers a
whole number of tiles (corners in full-size photo pixels, clockwise from top
left), flatten the lighting, set the mean colour, make it seamless, and derive
height and roughness:

```python
def tex_tile_my_tile():
    """My tile, 4" squares, from a product photo.  Repeat = 4 x 4 tiles = 16"."""
    src = ImageOps.exif_transpose(Image.open(os.path.join(ROOT, "photos", "jpg", "my_tile.jpg"))).convert("RGB")
    # or, for one of the project photos by index: src = photo(1)
    a, mask = warp(src, [(504, 983), (2369, 983), (2369, 2797), (504, 2797)], 1024, 1024)
    lin = prep_photo_patch(a, flat_sigma=150, target="#7E8676")   # mean colour of the glaze
    lin = make_tileable(lin, band=0.12)
    px_mm = 16 * 25.4 / 1024                                       # mm per pixel
    h = hp_height(lin, 3, 0.05)                                    # micro relief, mm
    rough = contrast_rough(lin, 0.2, 0.05)                         # ~0.2 = glossy glaze
    return entry("tile_my_tile", lin, (16 * IN, 16 * IN), normal_map(h, px_mm), rough, tileSizeIn=[4, 4])
```

For crisp, even grout use `compose_tiles(...)` instead of a straight photo
crop (see `tex_wainscot`, which lays photo faces into a running bond, and
`docs/textures.md`). Register the builder by name in both `ORDER` and
`BUILDERS`:

```python
ORDER = [..., "door_slab", "tile_my_tile"]
BUILDERS = {..., "tile_my_tile": tex_tile_my_tile}
```

**b. Run it.**

```sh
python3 tools/make_textures.py --only tile_my_tile
```

This writes `assets/textures/tile_my_tile_albedo.jpg`, `_normal.png`,
`_rough.png`, merges this entry into `assets/textures/manifest.json` and
redraws `assets/textures/_preview.jpg` (every map tiled 2x2: check the seams):

```json
{"name": "tile_my_tile", "map": "tile_my_tile_albedo.jpg", "normalMap": "tile_my_tile_normal.png",
 "roughnessMap": "tile_my_tile_rough.png", "physicalSizeM": [0.4064, 0.4064],
 "repeat": [2.4606, 2.4606], "tileSizeIn": [4, 4]}
```

`physicalSizeM` is the real size of one repeat; the app reads it, so the tile
appears at its true size. (The recipe above was dry-run against photo 01 to
check every call.)

**c. Option file** `src/options/tiles/my-tile.js`:

```js
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'tile_my_tile';
const REPEAT_M = [0.4064, 0.4064];         // used only if the manifest lacks physicalSizeM

export default {
  id: 'my-tile',
  name: 'My tile 4"',
  kind: 'tile',
  order: 40,
  thicknessMm: 9,
  textureName: NAME,
  repeatM: REPEAT_M,
  groutColor: '#d8d6cf',
  edgeColor: '#8a9a84',
  description: '4" glazed square, 9 mm',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({
      color: map ? 0xffffff : 0x8a9a84, roughness: 1, clearcoat: 0.7, clearcoatRoughness: 0.08,
    });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.25;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
```

**d. One line** in the tiles block of `src/options/index.js`:

```js
export { default as myTile } from './tiles/my-tile.js';
```

## 2. A procedural tile (no image)

Fill albedo / height / roughness / clear-coat buffers once per page (`cached`)
and let `buildMaps` turn them into textures; `tileMaterial` uses a texture-pack
map of the same name if one ever appears and the procedural set otherwise.
This is exactly how `tiles/white-ceramic-subway-offset.js` was added (3x6
running bond, 6 mm): copy that file, change the constants and the drawing.

```js
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, hash2, smoothstep, tileMaterial } from '../procedural.js';

const IN = 0.0254;
const NAME = 'tile_clay_square';
const TW = 4, TH = 4, NX = 4, NY = 4;            // 4" squares, 16" repeat
const REPEAT_M = [NX * TW * IN, NY * TH * IN];

function make(THREE) {
  const PPI = 48, w = NX * TW * PPI, h = NY * TH * PPI, g = PPI / 32;   // half grout 1/32"
  const albedo = new Float32Array(w * h * 3), height = new Float32Array(w * h);
  const rough = new Float32Array(w * h), coat = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, lx = x % (TW * PPI), ly = y % (TH * PPI);
    const e = Math.min(lx, TW * PPI - lx, ly, TH * PPI - ly);         // px to the grout centre
    const grout = e < g;
    const t = hash2(Math.floor(x / (TW * PPI)), Math.floor(y / (TH * PPI)), 5);  // per-tile tone
    const v = grout ? 0.8 : 0.33 + 0.06 * t + 0.08 * fbm(x, y, w, h, 16, 3, 1);
    albedo.set([v, v * 0.82, v * 0.7], i * 3);
    height[i] = grout ? 0 : Math.sqrt(smoothstep(0, PPI * 0.08, e - g));
    rough[i] = grout ? 0.9 : 0.3;   // G channel = roughness
    coat[i] = grout ? 0 : 1;        // R channel = clear-coat mask
  }
  return buildMaps(THREE, { w, h, albedo, height, rough, coat }, { normalStrength: 5 });
}

export default {
  id: 'clay-square', name: 'Clay square 4"', kind: 'tile', order: 45,
  thicknessMm: 9, textureName: NAME, repeatM: REPEAT_M,
  groutColor: '#cfcac0', edgeColor: '#8a6a55', description: '4" terracotta-glaze square, 9 mm',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    return tileMaterial(ctx, {
      textureName: NAME, repeatClone,
      texLookup: { map: tex(ctx, NAME), normal: texCompanion(ctx, NAME, 'normal'), roughness: texCompanion(ctx, NAME, 'roughness') },
      procedural: () => cached(THREE, 'clay-square', () => make(THREE)),
      params: { color: 0xffffff, roughness: 1, clearcoat: 0.7, clearcoatRoughness: 0.08, normalScale: 1 },
    });
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
```

Line: `export { default as claySquare } from './tiles/clay-square.js';`

Notes: canvas `y` runs **down** and textures are flipped, so the top of your
buffer is the top of the wall. Keep the pattern periodic: it must repeat
exactly at `w` and `h` (a half-offset bond needs an even number of rows; `fbm`
cell counts must divide evenly) or seams show. Generation runs on the main
thread at first use; keep it around 1 MP.

## 3. A wallpaper from an image

**a. Texture.** Same as recipe 1a, but name it `wallpaper_<x>`, rectify
exactly one pattern repeat (the roll's "pattern repeat", e.g. 21" x 21"), and
keep it matte:

```python
def tex_wallpaper_grasscloth():
    """Grasscloth wallpaper from the maker's swatch photo; 27" x 27" repeat."""
    src = ImageOps.exif_transpose(Image.open(os.path.join(ROOT, "photos", "jpg", "grasscloth.jpg"))).convert("RGB")
    a, mask = warp(src, [(120, 140), (2900, 150), (2890, 2930), (110, 2920)], 1024, 1024)
    lin = prep_photo_patch(a, flat_sigma=200, target="#C9BF9F")
    lin = make_tileable(lin, band=0.15)
    px_mm = 27 * 25.4 / 1024
    return entry("wallpaper_grasscloth", lin, (27 * IN, 27 * IN),
                 normal_map(hp_height(lin, 2, 0.08), px_mm), contrast_rough(lin, 0.85, 0.03))
```

Add it to `ORDER` / `BUILDERS` and run
`python3 tools/make_textures.py --only wallpaper_grasscloth`.

**b. Option file** `src/options/wallpapers/wallpaper-grasscloth.js`
(`kind: 'wallpaper'`, `thicknessMm: 0`; the accent wall draws it 0.4 mm off
the drywall, no thin-set, and `flush-fill` builds the wall out the full 13 mm):

```js
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_grasscloth';
const REPEAT_M = [0.6858, 0.6858];

export default {
  id: 'wallpaper-grasscloth', name: 'Wallpaper: grasscloth', kind: 'wallpaper', order: 60,
  thicknessMm: 0, textureName: NAME, repeatM: REPEAT_M, edgeColor: '#c9bf9f',
  description: 'Natural grasscloth, 27" repeat',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0xc9bf9f, roughness: 0.9 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
```

**c. Line** in the wallpapers block:
`export { default as wallpaperGrasscloth } from './wallpapers/wallpaper-grasscloth.js';`

## 4. A light fixture

```js
import { remodelDims } from '../../remodel/cfg.js';
import { bulbLight, glowMaterial, rod, finishFixture, inch } from './common.js';

export default {
  id: 'globe-pendant', name: 'Opal globe pendant', order: 40,
  description: '10" opal globe on a brass rod',
  // mount: 'wall',   // for sconces: the height slider then sets mountCentreIn
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const D = remodelDims(ctx);
    const ceiling = opts.ceilingIn != null ? inch(opts.ceilingIn) : D.ceiling;
    // hangBottomIn = lowest point of the fixture; clamp so it never enters the ceiling
    const bottom = Math.min(opts.hangBottomIn != null ? inch(opts.hangBottomIn) : inch(100), ceiling - inch(13));
    const group = new THREE.Group();
    group.name = 'light:globe-pendant';
    group.position.set(opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX, bottom,
                       opts.centreZIn != null ? inch(opts.centreZIn) : D.lightCentreZ);
    // Glowing shade: it must not cast shadows or it hides its own light.
    const glow = glowMaterial(THREE, { intensity: 1.2, color: 0xf6f3ee });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(inch(5), 48, 32), glow);
    globe.position.y = inch(5);
    group.add(globe);
    const brass = new THREE.MeshPhysicalMaterial({ color: 0xc9a467, metalness: 1, roughness: 0.35 });
    group.add(rod(THREE, new THREE.Vector3(0, inch(10), 0), new THREE.Vector3(0, ceiling - bottom, 0), inch(0.2), brass));
    const l = bulbLight(THREE, { candela: 4, shadow: opts.shadows !== false, mapSize: 512 });
    l.position.y = inch(5);
    group.add(l);
    return finishFixture(group, [l], [glow]);   // installs userData.lights / onOff / dispose
  },
};
```

Line in the lights block:
`export { default as globePendant } from './lights/globe-pendant.js';`

What the app passes to `build(ctx, opts)`: `hangBottomIn` (ceiling fixtures,
the "Light hang" slider, default 100"), `mountCentreIn` (fixtures with
`mount: 'wall'`, the "Sconce height" slider, default 66"), `spacingIn` (wall
pairs: 18" each side), `centreXIn` (54", the sink centre), `centreZIn` (11"
off the wall), `ceilingIn` (120"), `surfaceOffsetM` (the accent wall's
finished face, so wall-mounted parts sit on the tile) and `shadows`.

### Light conventions

- Coordinates: metres, X east, Y up, Z into the room; the north wall's
  finished face is at `z = surfaceOffsetM`. Wall-mounted fixtures must add it.
- The oval mirror spans 42"–98" at x 42.5"–65.5", with pivot brackets out to
  41.5" / 66.5" at 67.5"–72.5" high. Keep hanging fixtures above 98" and wall
  fixtures at least 2" clear of the brackets.
- Intensities are physical candela (Three r155+) at `toneMappingExposure = 1`;
  the shipped fixtures use 2–5 cd per bulb group, tuned to read as 2700 K
  next to the window daylight. Check Day and Night (key N).
- Each shadow-casting PointLight costs 6 shadow renders whenever shadows are
  refreshed (they are only refreshed when something changes), and every light
  adds shading cost each frame: use one or two per fixture.
- Emissive parts use `glowMaterial` (or set `material.userData.onIntensity`)
  so `onOff(false)` (key L) darkens them. Keep emissive intensity around
  1–8: the bloom pass picks up values above ~1 and very high ones flare.

## Testing a new option

```
./run.sh                                     # or python3 -m http.server 8787
open "http://localhost:8787/#scenario=remodel&tile=<id>"
open "http://localhost:8787/#scenario=remodel&preset=5&tile=<id>&transition=metal-edge"
tools/headless_shot.sh "http://localhost:8787/#preset=3&scenario=remodel&tile=<id>&ui=0&q=high" shots/x.png 1600,1000 60
```

The component bench `dev/components.html?tile=<id>&light=<id>` shows the
remodel parts alone (query params: `tile`, `light` (`none` allowed),
`transition` (`butt-joint|metal-edge|flush-fill`), `view`
(`front|junction|side|mirror|light`), `thick` (mm override), `on=0`, `tex=0`
(ignore the texture pack), `res` (reflector size), `exposure`, `env`).
