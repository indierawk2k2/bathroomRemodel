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
  paints/paint.js      makePaint() factory, kind: 'paint'; paints/*.js one preset each; paints/custom.js saved colours
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

Wallpaper is printed artwork. Repeat it **exactly**: crop the image to whole
pattern repeats. Do not cross-fade it with `make_tileable`, which ghosts the
motifs at the seams, and do not re-colour it with `prep_photo_patch(target=...)`.
The maker's file already has the right colours.

**Find the repeat.** A roll gives a *vertical* pattern repeat (for example
"10.6 cm") and a *match*:

- the horizontal period is the roll width divided by a whole number (the
  pattern lines up across the seam between drops);
- **straight match**: one texture = `roll width / n` x vertical repeat;
- **half-drop match**: the next drop is shifted down half a repeat, so the
  texture must hold two drop widths side by side, with the second strip rolled
  by half the repeat. That makes it `2 x drop width` x vertical repeat.

If the product image shows several repeats, measure them with an FFT
autocorrelation of the luminance. Digital artwork gives peaks of 0.99 or
more at whole-pixel offsets. Check that the pixel ratio matches the spec
ratio, then crop to one repeat. You can average all the repeats in the image
to remove JPEG noise:

```python
import numpy as np
a = lum(s2l(src)); a = a - a.mean()
F = np.fft.fft2(a); ac = np.real(np.fft.ifft2(F * np.conj(F))); ac /= ac[0, 0]
# strongest peaks away from (0, 0) give the lattice, e.g. (dy 240, dx 0) and (dy 120, dx 200)
```

**a. Texture.** Put the downloaded image in `assets/source/wallpapers/`
and record where it came from in `SOURCES.md` there. Then add a builder next
to `tex_wallpaper_cole_son_feather_fan_soft_olive` in
`tools/make_textures.py`:

```python
def tex_wallpaper_my_paper():
    """My Paper, colourway X: 0.53 m roll, 64 cm repeat, straight match.
    Source: maker's 1500 x 1800 flat = one roll width x one repeat."""
    src = wallpaper_src("my_paper_flat.jpg")                 # sRGB float, from assets/source/wallpapers/
    lin = s2l(src[0:1800, 0:1500])                          # exactly one repeat (whole repeats only)
    W, H = 1707, 2048                                       # up to 2048 px on the long side
    lin = resize_wrap(lin, W, H, 75)                        # wrap-padded resize keeps the edges seamless
    size = (0.53, 0.64)                                     # physicalSizeM = the repeat you cropped
    px_mm = size[1] * 1000 / H
    h = paper_height((H, W), 901)                           # faint paper grain, ~0.01 mm
    rough = np.full((H, W), 0.88)                           # matte; lower it on inks with a sheen
    return entry("wallpaper_my_paper", lin, size, normal_map(h, px_mm), rough,
                 source="assets/source/wallpapers/my_paper_flat.jpg", match="straight")
```

`wallpaper_src`, `resize_wrap` and `paper_height` sit in the "product
wallpapers" block of the script. Add the name to `ORDER` / `BUILDERS` and
run `python3 tools/make_textures.py --only wallpaper_my_paper`. Then check
the seams in `assets/textures/_preview.jpg`. The script must regenerate the
texture from `assets/source/` alone, so never write the texture from a
one-off shell session.

For a photo of a real sample (not a flat image), use recipe 1a's `warp` +
`prep_photo_patch` instead, and only then `make_tileable`.

**b. Option file** `src/options/wallpapers/wallpaper-my-paper.js`. Set
`kind: 'wallpaper'` and `thicknessMm: 0`. The accent wall draws it 0.4 mm
off the drywall with no thin-set, and `flush-fill` builds the wall out the
remaining 12.6 mm. Use the roughness map too, or the material ignores it:

```js
import { tex, texCompanion, physicalSize, repeatClone } from '../../remodel/cfg.js';

const NAME = 'wallpaper_my_paper';
const REPEAT_M = [0.53, 0.64];              // used only if the manifest lacks physicalSizeM

export default {
  id: 'wallpaper-my-brand-my-paper-colour', name: 'My Brand My Paper, Colour (wallpaper)',
  kind: 'wallpaper', order: 60,
  thicknessMm: 0, textureName: NAME, repeatM: REPEAT_M, edgeColor: '#c9bf9f',
  description: 'My Brand My Paper, colour X: 0.53 x 10 m roll, 64 cm repeat, straight match. maker.com/my-paper',
  makeMaterial(ctx) {
    const { THREE } = ctx;
    const map = tex(ctx, NAME);
    const m = new THREE.MeshPhysicalMaterial({ color: map ? 0xffffff : 0xc9bf9f, roughness: 1 });
    if (map) m.map = repeatClone(THREE, map, true);
    const n = texCompanion(ctx, NAME, 'normal');
    if (n) m.normalMap = repeatClone(THREE, n, false);
    const r = texCompanion(ctx, NAME, 'roughness');
    if (r) m.roughnessMap = repeatClone(THREE, r, false); else m.roughness = 0.88;
    return m;
  },
  repeatFor(ctx) { return physicalSize(ctx, NAME, REPEAT_M); },
};
```

**c. Line** in the wallpapers block:
`export { default as wallpaperMyPaper } from './wallpapers/wallpaper-my-paper.js';`

### A wallpaper from a product web page

This is how `wallpaper-cole-son-feather-fan-soft-olive` and
`wallpaper-rebel-walls-ripple-blue` were added (br-ukz),
`wallpaper-debona-crystal-trellis-blue-silver` (br-oc9) and
`wallpaper-wow-metro-prism-emerald-gold` (br-9a0), and from a marketplace
listing with no flat image, `wallpaper-heroad-gold-chevron-dark-green`
(br-34z, step 11):

1. **Open the page in a real browser** (Claude in Chrome). Retail sites
   often block `curl` for the HTML. Read the product name, collection,
   colourway, roll width and length, **pattern repeat** and **match**.
   Spec tables are often in collapsed tabs that are still in the DOM, so
   search `document.body.textContent`.
2. **Retailer SKUs are not the maker's reference.** Perigold QWH8178
   "Old Olive" is Cole & Son 112/10037 "Soft Olive". Match the artwork and
   colour against the maker's own site. Cole & Son runs on Shopify, so
   `https://cole-and-son.com/products/<handle>.js` lists every variant with
   its code and flat image. Take specs from the maker when the two
   disagree: Perigold says "match: random", Cole & Son says "straight".
3. **Get the largest flat image** (the swatch or design image, not a room
   scene) from the gallery's `<img>` URLs. Download it with
   `curl -L -A '<browser UA>' -e '<page URL>'`. CDNs often take a size in the
   URL. Wayfair/Perigold `resize-h1200-w1200` is the largest size; bigger
   sizes return a placeholder. Rebel Walls' Cloudinary
   `.../image/upload/v1/articles/<SKU>_product`, with no transformation,
   is the original.
4. **Murals vs repeats.** Many "murals" printed to wall size are really
   repeating designs. Rebel Walls' spec table says "Horizontal Repeat: Yes /
   Vertical Repeat: Yes", and the page data has
   `customWallMural_pattern_width` / `_height` in mm (Ripple: 1000 x 1200).
   Treat those as ordinary repeating wallpaper with `physicalSizeM` = that
   pattern tile. Only a one-off scene (no repeat) needs to be fitted once
   across the wall. The accent wall has no mode for that yet: it needs a UV
   change in `src/remodel/accentWall.js`.
5. Check the scale in the shots. At preset 3 the 23"-wide mirror and the
   12x24 wainscot tiles are the rulers.
6. **Shop around for the largest flat.** The linked retailer's image is
   not always the best one. World of Wallpaper (Magento) serves its
   originals without the `/cache/<hash>/` part of the URL, but only at
   1200 px. B&Q (`media.diy.com`, Adobe Scene7) gives the native size with
   `?req=imageprops` and the original with `?scl=1&qlt=100`. Plain
   `wid=`/`hei=` pads it with white. Align the images with a mask
   correlation to prove they are the same artwork, and record each one's
   colour grade. (Debona 8894: World of Wallpaper's 1200 px flat is B&Q's
   1502 x 1814 at 0.8x, and lighter. B&Q's silver matches the room scene.)
7. **A flat often is one roll width.** If its aspect ratio equals
   `roll width : n x repeat`, the whole image is a whole number of repeats.
   Use it unchanged. Check the wrap with the seam step: the step between the
   last and first row (and column) should sit inside the spread of interior
   steps.
8. **"Offset" / "half-drop" on the label vs the artwork.** Work out from
   the measured lattice whether the strips really need a drop. If the roll
   width is a lattice vector, the pattern runs on across the seam when the
   installer matches it, and the texture is simply that lattice. Debona's
   trellis has 4 lanterns per 53 cm with alternate columns dropped, and
   retailers call it "offset". Only bake two strips (the second rolled by
   half the repeat) when the roll width is *not* a lattice vector but
   `(roll width, repeat / 2)` is. Metro Prism is the same case: its
   "offset" match is a `(repeat / 2, roll width / 4)` lattice vector inside
   the artwork, so the texture is the plain rectangular repeat
   (roll width / 2 x repeat).
9. **Use a zero-padded, overlap-normalised autocorrelation** when the
   circular one (the snippet above) gives weak or contradictory peaks.
   Circular correlation wraps the image onto itself, which only works if
   it is an exact whole number of periods with no lighting across it. Pad
   the mask into a 2H x 2W array, divide by the overlap count and
   variance at each shift, and ignore shifts with under ~20% overlap.
   (Metro Prism: 0.73 circular vs 0.96 padded, at the same offsets.)
10. **Baked "metallic" lighting.** Some retailer flats paint a light sweep
   across a metallic ink (Metro Prism's gold runs R 100–150 across the
   image, differently in every copy of the repeat). That is lighting, not
   print, and averaging repeats leaves a blotch. Take the ink coverage from
   a channel the sweep does not change (R − B for gold on green), average
   that, and draw the ink in its median colour on the median ground: the
   maker's colours, with the sheen left to the material's metalness. A
   uniformly printed matte flat is still used as is.
11. **Marketplace listings (eBay, Amazon) with no flat image.** eBay
   listings expire: record item number, title, seller, condition, price,
   quantity, every Item-specifics field and the image URLs (request
   `i.ebayimg.com/images/g/<id>/s-l1600.jpg`) in `SOURCES.md` the same
   day. Search the listing title on Amazon: resellers copy the maker's
   photos, and Amazon serves them unbadged and larger (drop the
   `._AC_SL1500_` suffix for the original). If no photo is a flat, look
   for a room scene whose wall is a front-on composite (high, even
   autocorrelation over the whole wall), measure its period to 0.01 px
   with a parabolic fit at several multiples, resample the crop to a
   whole-pixel period and average the copies. Without a published repeat,
   estimate the scale from anything with a known size in the photos (a
   printed cutting grid on the backing is the best ruler; furniture is a
   cross-check), prefer a whole number of repeats per roll width, and say
   in the option's `description` that the repeat is an estimate.

### Metallic and glitter papers

The texture loader (`src/textures.js`) reads `map`, `normalMap`,
`roughnessMap` and `alphaMap` from the manifest; it ignores
`metalnessMap`. Three.js reads roughness from the **G** channel and
metalness from the **B** channel, so pack both into one RGB "rough" PNG.
Pass `rough=None` to `entry()` and save the PNG yourself (see
`tex_wallpaper_debona_crystal_trellis_blue_silver`). In `makeMaterial`, use
the same texture for both maps:

```js
const r = texCompanion(ctx, NAME, 'roughness');
if (r) {
  m.roughnessMap = repeatClone(THREE, r, false);   // G = roughness
  m.metalnessMap = m.roughnessMap;                 // B = metalness
  m.metalness = 1;                                 // the map scales it
  m.userData.noProbe = true;                       // see below
}
```

- **Set `userData.noProbe`.** `src/envProbe.js` gives every material with
  `metalness >= 0.5` the captured room cube map. On a wall that is mostly
  dielectric paper, that cube also becomes the ground's diffuse ambient,
  and a dark navy ground turned brown. With `noProbe`, the wall keeps the
  generic environment, as the other wall finishes do.
- **Keep metal inks partial.** With metalness 1, a dark-grey printed
  "silver" (sRGB ~116) loses its diffuse and reads gold or bronze under the
  2700 K lights. Metalness about 0.45 with roughness about 0.38 reads as
  satin silver by day and at night.
- **Glitter:** sparse, 1-texel flecks (well under 1% of texels) with lower
  roughness and some metalness. Put them in the roughness / metal map, not
  the normal map, so mip-mapping averages them into a faint sheen at
  distance and nothing shimmers when the camera moves.

## Paint colours

A paint colour is one line through the factory in
`src/options/paints/paint.js` (kind `'paint'`):

```js
// src/options/paints/hale-navy.js
import { makePaint } from './paint.js';
export default makePaint({ id: 'paint-hale-navy', name: 'Hale Navy', hex: '#434b56', finish: 'eggshell',
  brand: 'Benjamin Moore', code: 'HC-154', order: 62, description: '...' });
```

plus `export { default as paintHaleNavy } from './paints/hale-navy.js';` in
the paint block of `src/options/index.js`. Record the hex and the page you
read it from in `assets/source/paints/SOURCES.md` (makers' pages carry it:
Benjamin Moore in the page JSON `"hex"`, Sherwin-Williams as the RGB
property, Farrow & Ball as the swatch background colour).

- `finish`: `eggshell` (default, roughness 0.72), `matte` (0.9), `satin`
  (0.5) are paint: 0 mm, wallpaper-like at the junction, a colour-independent
  roller-stipple normal map. `subway` is glazed 3" x 6" glass subway tile in
  the colour, stacked, 8 mm + thinset, light grey grout (the white glass
  subway generator, tinted).
- `order`: presets use 60–64 in hue order; saved colours come after (90+).
- The display name is built for you: `"Hale Navy, Benjamin Moore HC-154 (paint)"`.

Saved colours: the panel's **Custom colour** chooser stores them in the
browser, `localStorage['bathroomRemodel.customPaints']`, a JSON array of
`{ id, name, hex, finish }`, and `src/options/paints/custom.js` registers
them at startup. To promote one to a preset, read it back in the browser
console (`JSON.parse(localStorage['bathroomRemodel.customPaints'])`), copy
its `hex`, `finish` and `name` into a new preset file as above (give it a
`paint-<slug>` id and an `order`), add the export line, then delete the saved
copy in the panel so it does not show twice.

## 4. A light fixture

```js
import { remodelDims } from '../../remodel/cfg.js';
import { bulbLight, glowMaterial, rod, finishFixture, inch } from './common.js';

export default {
  id: 'globe-pendant', name: 'Opal globe pendant', order: 40,
  description: '10" opal globe on a brass rod',
  // mount: 'wall',   // for sconces: the height slider then sets mountCentreIn
  // Placement defaults: the sliders jump to these when this light is picked
  // (sconces: defaultMountCentreIn instead).  Keep the bottom above ~74" so
  // a person at the sink can see their face.
  defaultHangBottomIn: 80,
  defaultFromWallIn: 14,
  build(ctx, opts = {}) {
    const { THREE } = ctx;
    const D = remodelDims(ctx);
    const ceiling = opts.ceilingIn != null ? inch(opts.ceilingIn) : D.ceiling;
    // hangBottomIn = lowest point of the fixture; clamp so it never enters the ceiling
    const bottom = Math.min(opts.hangBottomIn != null ? inch(opts.hangBottomIn) : inch(80), ceiling - inch(13));
    const group = new THREE.Group();
    group.name = 'light:globe-pendant';
    group.position.set(opts.centreXIn != null ? inch(opts.centreXIn) : D.lightCentreX, bottom,
                       opts.centreZIn != null ? inch(opts.centreZIn) : inch(14));
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
the "Light hang" slider, 60–110", default the option's `defaultHangBottomIn`),
`centreZIn` (world z of the fixture centre: the "Light distance from wall"
slider, 6–36", default `defaultFromWallIn`, plus the accent face offset),
`mountCentreIn` (fixtures with `mount: 'wall'`, the "Sconce height" slider,
default `defaultMountCentreIn`), `offsetsIn` (wall pairs: `[west, east]` x
offsets from the centre, -17.75" / +16.75", each sconce centred between the
mirror frame and the accent edge), `centreXIn` (54", the sink centre),
`ceilingIn` (120"), `surfaceOffsetM` (the accent wall's finished face, so
wall-mounted parts sit on the tile) and `shadows`. Options without the
`default*` fields fall back to 80" / 14" / 64". Any `default*` may instead be
a function `({ mirrorBottomIn, mirrorHeightIn }) => inches` (the Harlan
sconces use `mirrorBottomIn + mirrorHeightIn / 2`, the mirror's widest
point): it is evaluated with the current mirror, clamped to the slider's
range, and re-applied whenever the "Mirror bottom" slider moves, unless the
user has moved that slider for this light (or set it in the URL hash).

**A ceiling-hung pair beside the mirror** (`anders-pendants`,
`claxy-rod-pendants`): the app passes `offsetsIn` to wall mounts only, so a
ceiling pair picks its own x offsets (`ctx.config.REMODEL.sconceOffsetsIn`
for the sconce positions, or `offsetsClearOfMirror(ctx, shadeRadiusIn, 2)`
when the shade is too wide for them). `flankingPendantPair(ctx, opts, spec)`
in `lights/common.js` does the rest: it clamps the hang to the product's
shortest real drop (`minDropIn`), places the two pendants and calls
`finishFixture`; `makePendant(dropM)` builds one pendant with its origin at
the shade's bottom centre, reaching the ceiling at `y = dropM`. Use
`defaultHangBottomIn: hangAtMirrorCentre(shadeHeightIn, REAL)` for the sconces'
height rule on the "Light hang (bottom)" slider.
Give a stem or rod pendant its real reach as data on the option and spec:
`realDropRangeIn: [min, max]` (ceiling to shade bottom) and, for fixed rod
sections, `realDropStepsIn: [...]` (every rod combination); pass the same
object as `REAL`. The default then snaps to a height the real fixture can
hang at (never below the mirror centre unless it must), the build clamps
to the shortest drop, and the slider stays continuous, so say the lowest
real shade bottom (`lowestRealBottomIn`) in a `description(ctx)` function.

### Light conventions

- Coordinates: metres, X east, Y up, Z into the room; the north wall's
  finished face is at `z = surfaceOffsetM`. Wall-mounted fixtures must add it.
- The oval mirror spans 42"–98" at x 42.5"–65.5" and hangs flat like a
  picture (no brackets; frame front ~1" off the wall). Hanging fixtures may
  come down in front of it (keep their back edge a few inches off the wall
  and their bottom above ~74"); keep wall fixtures at least 2.5" clear of the
  frame and inside the accent span (x 30"–76").
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
