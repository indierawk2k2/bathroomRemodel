# Adding options (tiles, wallpapers, lights)

Every selectable finish or fixture is **one file** plus **one line** in
`src/options/index.js`. Nothing else in the app has to change: the UI selects,
the accent wall, the junction inspector and the gamepad cycling all read the
registry.

```
src/options/
  registry.js          registerTile / registerWallpaper / registerLight, tiles(), lights(), getTile(id), getLight(id)
  index.js             imports every option file (one line each) and registers them
  procedural.js        helpers for runtime fallback maps (noise, height -> normal, canvas textures)
  tiles/*.js           kind: 'tile'
  wallpapers/*.js      kind: 'wallpaper' (thicknessMm 0; they are tiles with no thinset)
  lights/*.js          light fixtures; lights/common.js has chains, rods, bulbs, PointLights
```

Wallpapers live in their own folder but go into the **same** registry as
tiles (`kind: 'wallpaper'`), so `tiles()` returns both and a single
"Tile / wallpaper" select covers them. `wallpapers()` filters them out if a
separate list is ever needed.

## The one line

In `src/options/index.js`, add an `export { default as <name> } from '<path>';`
line in the right block:

```js
export { default as terracottaHex } from './tiles/terracotta-hex.js';
```

`index.js` imports its own namespace and registers every export that looks
like an option (`build` = light; `makeMaterial` = tile or wallpaper). The UI
order comes from the option's `order` number (default 100), then its name.

## Option shapes

```js
// tile / wallpaper
export default {
  id: 'kebab-id',            // stable: used in URLs, state and saved settings
  name: 'Shown in the UI',
  kind: 'tile',              // or 'wallpaper' (thicknessMm forced to 0, no thinset)
  order: 40,                 // optional: UI order
  thicknessMm: 8,            // tile body; the accent wall adds 3 mm thinset
  textureName: 'tile_x',     // key in ctx.textures (may be missing at runtime)
  repeatM: [0.3048, 0.3048], // metres covered by one texture repeat (fallback size)
  groutColor: '#eeeeee',     // optional: caulk joint colour
  edgeColor: '#ccddcc',      // optional: colour of the layer in the junction inset
  makeMaterial(ctx) { return new ctx.THREE.MeshPhysicalMaterial({...}); },
  repeatFor(ctx) { return [w, h]; }   // optional: real repeat size used for UVs
};

// light
export default {
  id: 'kebab-id', name: 'Shown in the UI', order: 40,
  build(ctx, { hangBottomIn, centreXIn, centreZIn, ceilingIn, surfaceOffsetM, shadows }) {
    // -> THREE.Group in world coordinates, with
    //    group.userData.lights = [PointLight, ...]   (integration tunes intensities)
    //    group.userData.onOff(bool)                   (lights + emissive materials)
    //    group.userData.dispose()
  },
};
```

`ctx` is `{ THREE, textures, config, state, scene, renderer, camera }`.
**Never import `three` or app modules** in an option file: use `ctx.THREE`, and
read numbers with the helpers in `src/remodel/cfg.js` (`remodelDims(ctx)`,
`tex(ctx, name)`, `texCompanion(ctx, name, 'normal')`,
`physicalSize(ctx, name, fallback)`, `repeatClone(THREE, texture, isColour)`).
Every texture can be missing; always have a flat-colour or procedural fallback.

### How UVs and repeat work

The accent wall writes UVs in *repeats*: `u = (x - x0) / repeatW`,
`v = (y - y0) / repeatH`, measured from the accent's bottom-left corner, so
tiles start whole at the left edge and at the cap. Materials must therefore use
textures with `repeat = (1, 1)` and `RepeatWrapping`; `repeatClone()` does that
for a texture from the pack (it shares the image, cheap). The repeat size is
`ctx.textures.physicalSize[textureName]` when the texture pack provides it
(from `physicalSizeM` in `assets/textures/manifest.json`), else the option's
`repeatM`.

Companion maps from the pack are looked up as `<name>_normal` /
`<name>_roughness` (also `<name>Normal`, or `texture.userData.normalMap`).

## Template: tile from an image (texture pack)

1. Add the image to the texture pack (`tools/make_textures.py` writes it to
   `assets/textures/` and adds a manifest entry with `name`, `map`,
   optional `normalMap` / `roughnessMap`, and `physicalSizeM`).
2. `src/options/tiles/terracotta-hex.js`:

```js
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'tile_terracotta_hex';
const REPEAT_M = [0.30, 0.26];            // used only if the manifest lacks physicalSizeM

export default {
  id: 'terracotta-hex',
  name: 'Terracotta hex 4"',
  kind: 'tile',
  order: 40,
  thicknessMm: 12,
  textureName: NAME,
  repeatM: REPEAT_M,
  edgeColor: '#b66a4a',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0xb66a4a, roughness: 0.7 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false);
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
```

3. One line in `index.js`:
   `export { default as terracottaHex } from './tiles/terracotta-hex.js';`

## Template: procedural tile (no image needed)

Fill albedo / height / roughness buffers once per page (`cached`) and let
`buildMaps` make the textures. `tileMaterial` uses the pack texture if it
appears later and falls back to the procedural set otherwise. See
`tiles/white-glass-subway-stacked.js` for a full example.

```js
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';
import { buildMaps, cached, fbm, smoothstep, tileMaterial } from '../procedural.js';

const IN = 0.0254, TW = 4, TH = 4, NX = 4, NY = 4;   // 4" squares, 16" repeat
const REPEAT_M = [NX * TW * IN, NY * TH * IN];

function make(THREE) {
  const PPI = 48, w = NX * TW * PPI, h = NY * TH * PPI, g = PPI / 32;
  const albedo = new Float32Array(w * h * 3), height = new Float32Array(w * h);
  const rough = new Float32Array(w * h), coat = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, lx = x % (TW * PPI), ly = y % (TH * PPI);
    const e = Math.min(lx, TW * PPI - lx, ly, TH * PPI - ly);   // px to grout centre
    const grout = e < g;
    const v = grout ? 0.8 : 0.35 + 0.1 * fbm(x, y, w, h, 16, 3, 1);
    albedo.set([v, v * 0.9, v * 0.8], i * 3);
    height[i] = grout ? 0 : Math.sqrt(smoothstep(0, PPI * 0.08, e - g));
    rough[i] = grout ? 0.9 : 0.3;  // G channel = roughness
    coat[i] = grout ? 0 : 1;       // R channel = clearcoat mask
  }
  return buildMaps(THREE, { w, h, albedo, height, rough, coat }, { normalStrength: 5 });
}

export default {
  id: 'clay-square', name: 'Clay square 4"', kind: 'tile', order: 45,
  thicknessMm: 9, textureName: 'tile_clay_square', repeatM: REPEAT_M, edgeColor: '#8a6a55',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    return tileMaterial(ctx, {
      textureName: 'tile_clay_square', repeatClone,
      texLookup: { map: tex(ctx, 'tile_clay_square'),
                   normal: texCompanion(ctx, 'tile_clay_square', 'normal'),
                   roughness: texCompanion(ctx, 'tile_clay_square', 'roughness') },
      procedural: () => cached(THREE, 'clay-square', () => make(THREE)),
      params: { color: 0xffffff, roughness: 1, clearcoat: 0.7, clearcoatRoughness: 0.08, normalScale: 1 },
    });
  },
  repeatFor(ctx) { return physicalSize(ctx, 'tile_clay_square', REPEAT_M); },
};
```

Notes: canvas `y` runs **down** and textures are flipped, so the top of your
canvas is the top of the wall. Keep the canvas periodic (pattern repeats exactly
at `w` and `h`; `fbm` cell counts must divide evenly) or seams will show.
Generation runs on the main thread at first use; keep it at about 1-1.3 MP.

## Template: wallpaper

Put the file in `src/options/wallpapers/`; `kind: 'wallpaper'` and
`thicknessMm: 0`. The accent wall then draws it 0.4 mm off the drywall with
polygon offset, no thinset; the `flush-fill` transition builds the drywall
out the full 13 mm.

```js
import { tex, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_grasscloth';
const REPEAT_M = [0.6858, 0.6858];         // 27" roll width, square repeat

export default {
  id: 'wallpaper-grasscloth', name: 'Wallpaper: grasscloth', kind: 'wallpaper', order: 60,
  thicknessMm: 0, textureName: NAME, repeatM: REPEAT_M, edgeColor: '#c9bf9f',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    return new THREE.MeshPhysicalMaterial({
      color: map ? 0xffffff : 0xc9bf9f, roughness: 0.9,
      map: map ? repeatClone(THREE, map, true) : null,
    });
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
```

Line in `index.js` (wallpapers block):
`export { default as wallpaperGrasscloth } from './wallpapers/wallpaper-grasscloth.js';`

## Template: light

```js
import { remodelDims } from '../../remodel/cfg.js';
import { bulbLight, glowMaterial, rod, finishFixture, inch } from './common.js';

export default {
  id: 'globe-pendant', name: 'Opal globe pendant', order: 40,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const D = remodelDims(ctx);
    const bottom = opts.hangBottomIn != null ? inch(opts.hangBottomIn) : inch(86);
    const group = new THREE.Group();
    group.name = 'light:globe-pendant';
    group.position.set(opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX, bottom,
                       opts.centreZIn != null ? inch(opts.centreZIn) : D.lightCentreZ);
    // Glowing shade: do not let it cast shadows or it hides its own light.
    const glow = glowMaterial(THREE, { intensity: 1.2, color: 0xf6f3ee });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(inch(5), 48, 32), glow);
    globe.position.y = inch(5);
    group.add(globe);
    const brass = new THREE.MeshPhysicalMaterial({ color: 0xc9a467, metalness: 1, roughness: 0.35 });
    group.add(rod(THREE, new THREE.Vector3(0, inch(10), 0), new THREE.Vector3(0, D.ceiling - bottom, 0), inch(0.2), brass));
    const l = bulbLight(THREE, { candela: 6, shadow: opts.shadows !== false, mapSize: 512 });
    l.position.y = inch(5);
    group.add(l);
    return finishFixture(group, [l], [glow]);   // installs userData.lights / onOff / dispose
  },
};
```

Line in `index.js` (lights block):
`export { default as globePendant } from './lights/globe-pendant.js';`

### Light conventions

- Coordinates: metres, X east, Y up, Z into the room; the north wall finish
  is at `z = surfaceOffsetM` (the accent's `group.userData.surfaceOffsetM`).
  Wall-mounted fixtures must add it.
- `hangBottomIn` is the lowest point of the fixture (sconces: bottom of the
  glass) in inches above the floor.
- Intensities are physical candela (Three r155+), tuned for
  `toneMappingExposure = 1` with a RoomEnvironment at about 0.35 intensity;
  the integration pass may rescale `userData.lights`. Each PointLight with
  shadows costs 6 shadow renders a frame, so use one or two per fixture
  (one light can stand in for a pair of bulbs).
- Emissive parts use `glowMaterial` (or set `material.userData.onIntensity`)
  so `onOff(false)` darkens them.

## Testing a new option

```
python3 -m http.server 8789
open http://localhost:8789/dev/components.html?tile=<id>&light=<id>
tools/headless_shot.sh "http://localhost:8789/dev/components.html?tile=<id>&light=<id>" shots/x.png 1600,1000 45
```

Query params: `tile`, `light` (`none` allowed), `transition`
(`keep-cap|remove-cap|flush-fill`), `view` (`front|junction|side|mirror|light`),
`thick` (mm override), `on=0`, `tex=0` (ignore the texture pack), `res`
(reflector size), `exposure`, `env`.
