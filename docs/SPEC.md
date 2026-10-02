# Bathroom Remodel Visualizer — Shared Spec

This is the contract between the modules. Every agent builds against it; if a
measurement here turns out to contradict the photos, fix it **here** (and say so
in your report) rather than hard-coding a different number elsewhere.

## 1. Goal

A browser 3D viewer (Three.js, ES modules, no build step) of the bathroom as it
is today, plus a "remodel" scenario that:

- removes the current frameless mirror and 2-bulb light bar;
- hangs the owner's **oval wood-framed mirror (56" tall x 23" wide)** vertically
  over the vanity;
- tiles / wallpapers the vanity wall **only** between the tub-column tile edge
  (left) and the window trim edge (right), from the top of the existing
  wainscot to the ceiling;
- swaps between tile / wallpaper options and light options;
- illustrates, at close range, the thickness step where the new wall tile
  meets the existing stone wainscot cap (the owner's wife's main concern).

Target: 30 fps at 1440p-ish on a MacBook Pro M1 Max (64 GB) in Chrome/Edge.
Push realism (PBR, shadows, env lighting, real planar mirror) up to that budget.

## 2. Tech constraints

- Three.js **r170** from CDN via an import map in `index.html`:
  `https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js` and
  `https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/` as `three/addons/`.
  No npm, no bundler, no other runtime dependencies. Python 3 + Pillow
  (already installed) for texture generation.
- Serve with `python3 -m http.server 8787` from the repo root; open
  `http://localhost:8787/`.
- Units: **metres** in Three.js. `src/units.js` exports `IN = 0.0254` and
  `inch(n)`, `ft(n)` helpers. All dimensions in `src/config.js` are written in
  inches with `inch()` so they stay readable.
- Coordinate system: **X east (to the right when facing the vanity), Y up,
  Z south (toward the door)**. Origin = floor level at the inside corner
  where the vanity wall (north, z = 0) meets the tub-side wall (west, x = 0).
  Facing the vanity = looking toward **−Z**.
- The app must show a visible red error overlay (`#error-overlay`) on
  `window.onerror` / `unhandledrejection`, and set `document.title` to
  `"Bathroom Viewer — ready"` after the first rendered frame, so headless
  screenshots can prove it loaded.

## 3. Room (as measured/estimated from the photos; inches)

Photos live in `photos/jpg/` (4032x3024 JPEG, EXIF orientation is set — use
`PIL.ImageOps.exif_transpose`) and `photos/thumb/`. Index numbers below refer to
the sorted order of `photos/thumb/*.jpg` (00–54).

Key reference photos:
- 37 (`233548537`) straight-on view of the vanity wall; 38 same with ceiling.
- 20, 21, 22, 23, 35, 36 vanity / window / toilet from the tub side.
- 14, 30, 39, 48, 49, 50 the door recess, its lowered ceiling, picture frame.
- 12, 13, 26–29, 31–33 tub alcove tile, accent band, ledge, curtain rod.
- 25, 34 the tiled column between tub and vanity, ledge top = counter height.
- 41, 42, 53, 54 the window, sill, outlet, trim.
- 51, 52, 53 **close-ups of the wainscot cap / drywall / mirror junction**.
- 43, 44, 47 switches, thermostat, door.
- 08, 09, 10 the oval mirror (56" x 23", wood frame, black pivot brackets).
- 00 rattan linear chandelier; 05, 06, 07 Monteaux faceted glass pendant;
  02, 03, 04 brass ribbed-glass sconces (Harlan) + exposed-bulb (Rexburg);
  01 tile display — the owner's pictured tile option is the **Daltile
  Handcrafted Sage Fan** (green scallop) in the centre of that photo.

Anchors used for scale: tub 60" x 30" (rim 16" AFF), toilet (seat 16", tank
top 30", 28" long), vanity counter 35" AFF, ceiling 120".

```
                 N (vanity wall, z = 0)
   x=0 ─────────────────────────────────────────── x=102
   │COLUMN x0-30│6"│   VANITY x36-72   │ TOILET BAY  │
   │ TUB 30" wide  │                   │ window above│
   │ tub z=10..70  │                   │             E door
   │               │                   │             │ z=37..67
   z=70 ───────────┐                   ┌─────────────┤  south wall, z = 70
     (tub end wall)│    DOOR RECESS    │ thermostat  │
                   │  x = 36..72       │             │
                   │  z = 70..110      │
                   │  ceiling 96"      │
                   └───────────────────┘  recess door at z = 110
```

Main room: 102" (x) by 70" (z), ceiling **120"** everywhere in the main room
(including over the tub). Door recess: **x 36–72**, z 70–110, ceiling **96"**
(soffit face at z = 70 from 96" to 120").

*Corrections from the photos (br-736):*
- *There is **no 97" soffit** over the tub alcove: photos 39 and 40 show one flat
  ceiling over tub and room. What photo 38 shows top-left is the drywall chase
  above the tiled column, running to the ceiling.*
- *The recess is at **x 36–72**, not 66–102: photo 49 shows a narrow (~3–5")
  strip of wall between the tub tile panel and the recess's west jamb, photo 39
  shows the z = 70 wall continuing east of the opening, and the doorway
  reflected in the mirror in photo 37 is centred on the vanity.*
- *There is a **second door on the east wall** (x = 102, z ≈ 37–67, hinges at
  the north jamb) beside the toilet: photos 19, 20, 43.*

Walls: drywall, upper paint colour **gray-sage** (~ #B8BFBB; sample from
photos 37/20, not from shadowed areas). Door recess walls slightly lighter.
Ceiling flat white. Baseboard: none visible (tile wainscot runs to the floor).

Floor: 12" x 24" dark grey-brown wood-look porcelain plank, running bond with
1/3 offset, planks running N–S, grout ~1/8" dark grey.

Wainscot (every wall except inside the tub alcove): 12" x 24" grey
stone-look porcelain, running bond, **top at 40" AFF**, tile face
**proud of the drywall by 1/2" (13 mm)**. Grout light grey ~1/8".
Courses are laid **down from the top**: grout lines at 40, 28, 16, 4" (photo
53: the line just above the toilet tank lid is 28").
*Correction (br-736): there is **no separate 1.25" bullnose cap**. Photos 51–53
show the top course finished with a factory-eased edge, a thin light-sand strip
(~1/4") along the top of the tile. It is modelled as a 6 mm-high lip with a
4 mm 45° chamfer (`WAINSCOT.capHeight` / `capChamfer` in config.js).*

Tub alcove (x 0–36, z 0–70): tub 60" x 30" x 16" rim, white enamel, apron
on the east side; the alcove walls are tiled floor to **85"** with the same
12 x 24 grey tile, running bond, plus a **dark charcoal accent band from 52"
to 61" (9" tall)**. Alcove courses share the wainscot grid (the 40" line runs
through, photo 13). White drywall from 85" to the 120" ceiling. On the end
wall the tile panel runs from x = 0 to **x = 33** and ends with a light eased
edge. Curved satin-nickel curtain rod at **~81"** (flange on the column's top
box, just below the 85" tile top; photos 13, 26) spanning from the column
(z ≈ 10) to the end wall (z = 70); dark grey waffle fabric curtain hanging on
the east side of the tub, bunched toward the column as in photo 37. Chrome
shower head, valve and spout are on the alcove's end wall (z = 70): head at
78", **valve at ~30"**, spout at ~21" (photo 13).
*Corrections (br-736): band 60–72" → 52–61" (photo 13: the band is ~220 px
against a 325 px 12" course, and it sits one course above the 40" line); rod
78" → 81"; valve 42" → 30"; no soffit above the tile.*

Column + ledge (north end of the alcove, photos 12, 26, 37, 40): one
full-height built-out box **x 0–30, z 0–10**, tiled to 85" on its south and
east faces and drywall above to the ceiling. From the floor: solid ledge to
**36"**; open niche 36–52" (shampoo bottles, back 6" deep); **band box
52–61"** wrapped in the dark accent tile; open niche 61–73" (blue tissue box);
top box 73–85" carrying the curtain-rod flange. Between the column's east face
(x = 30) and the vanity (x = 36) is a 6" strip of wainscoted vanity wall
(photo 34).
*Correction (br-736): the spec's separate column x 30–36 does not exist; the
ledge's top edge is the same grey tile, not charcoal.*

Vanity: cabinet **x 36–72, z 0–21, 35" tall** incl. counter; grey horizontal
wood-grain laminate fronts: top band split ~8.5" / 18.5" / 9" (two small
drawers either side of a false front), two doors below (photo 37); 1.25" white
speckled quartz top with a 1" overhang at front, undermount oval sink
centred at x = 54, chrome single-handle loop faucet (photo 52). Chrome towel
bar on the vanity's west side (photo 34). Towel ring (chrome) on the **north
drywall at x ≈ 38.5, post at ~53"** just east of the column (photos 34, 37).
Toilet-paper holder on the vanity's east side.

Current mirror: frameless **24" x 36"**, centred x = 54, bottom at **43"**.
Current light: chrome 2-bulb bar **24" wide** (as wide as the mirror), centred
x = 54, bottom at **80.5"**, two squared frosted shades either side of a small
chrome backplate, warm white.
*Corrections (br-736), photo 37 measured against the 24" mirror width: mirror
bottom 44" → 43" (2.7" above the wainscot top); bar width 16" → 24"; shades
are rectangular, not cylindrical.*

Window: on the north wall, trim outer edge **x 76–99** (23"), stool/sill top
at **44"**, head trim top at **90"**; white 2.5" flat trim, 1.5" sill nose,
apron below the stool; single-hung frosted (obscure) glass, white sash. A small
black 5x7 frame leans on the sill.
*Correction (br-736): photo 37 shows the trim ~2:1 tall (23" x 46"), its right
edge ~3" from the east wall corner and its stool ~4" above the wainscot top
(photo 53); was x 74–98, sill 42", head 84".*

Toilet: elongated, white, tank against the north wall, centred **x = 87.5**
(under the window centre, photo 37).

Door recess: walls wainscoted; gray flat-panel door **30" x 80"** with four
horizontal grooves, gray jamb, satin-nickel lever; door at z = 110, slab
x 40–70 (its east casing touches the recess's east wall, photo 48), opening
into the bathroom (hinges on the east side) — model it closed. Framed flower
photo (black frame, ~16" x 16") on the recess's **west** wall at **x = 36**,
centred z = 90, 60" AFF; a single switch on the same wall by the jamb
(z ≈ 73.5, 47", photo 47). Thermostat (centre ~58") and a 2-gang switch
(~47") on the **z = 70 wall just east of the recess opening** (x ≈ 77–80,
facing north; photos 44, 49). East-wall door: same slab style, z 37–67,
hinges at the north jamb. One recessed ceiling can (~5") over the tub at
(x = 18, z = 40); exhaust vent grille ~10" x 10" at (x = 54, z = 34)
(photos 38–40).

Outlets: one GFCI on the vanity wall at **x ≈ 68.5, centre 43.5"** AFF, between
the mirror and the window (photos 37, 52, 53 all show the same outlet).
*Corrections (br-736): thermostat/switch wall, can position (was x 72), vent
position, outlet height 46" → 43.5"; the second outlet of photo 54 could not
be placed from the photos and is not modelled.*

## 4. Remodel scenario

Accent region on the north wall: **x 30–76, y 40–120** (column tile edge to
window trim edge after the br-736 corrections) (from the top of the
wainscot cap to the ceiling; height configurable in the UI). The tile /
wallpaper sits on the drywall plane; its finished face is proud of drywall
by `thickness + 3 mm` thinset (wallpaper: 0).

Transition detail at y = 40 (`transition` option, default `keep-cap`):
- `keep-cap`: new material starts at the top of the existing bullnose cap.
- `remove-cap`: cap removed; new tile runs down to meet the top of the
  existing 12 x 24 tile, finished with a 1/8" brushed-nickel Schluter
  edge trim strip.
- `flush-fill`: like `keep-cap` but the drywall is built out so the new
  tile's face is flush with the wainscot face.

When the camera is within 30" of the accent/wainscot junction, show a
**junction inspector**: a 2D cross-section inset (canvas, bottom-left) with
the wainscot thickness, cap profile, new material thickness, and the step
in mm and fractional inches, plus thin dimension lines drawn in 3D.

Oval mirror: 56" tall x 23" wide, 1.5" cherry/mahogany wood frame, 3/4" deep,
black steel pivot brackets on each side (photos 9, 10), hung with its centre
at x = 55 and its bottom at 42" (configurable). The glass is a real planar
reflection (`three/addons/objects/Reflector.js`) clipped to the oval.

Lights (each option replaces the current light bar; the recessed can stays):
- `rattan-linear`: Adara-style 4-light oval rattan linear chandelier,
  ~32" x 12" x 10", black frame, natural rattan weave, hung from the ceiling
  above the vanity (centre x = 55, z = 11), bottom at 90" (configurable).
- `monteaux-pendant`: Monteaux 3-light faceted frosted-glass polyhedron
  pendant, ~16" dia x 18" tall, antique brass frame, same hang point,
  bottom at 88".
- `harlan-sconces`: pair of brass 2-light sconces with ribbed clear-glass
  cylinders, 5" x 14", mounted at x = 55 ± 16, centre 66".

Tile / wallpaper options (registry):
- `sage-fan`: Daltile Handcrafted Sage Fan, ~4" scallop (fish-scale) mosaic,
  muted sage green glossy glaze with handmade variation, 3/8" (10 mm) thick,
  light grey grout.
- `white-glass-subway-stacked`: 3" x 6" white glass subway, **stacked grid
  (no stagger), long edge horizontal**, 5/16" (8 mm) thick, bright white
  grout 1/16".
- `wallpaper-sample`: one placeholder wallpaper (muted botanical print),
  0 mm thick — exists so the wallpaper path is proven and extensible.

## 5. Viewer

- First-person: **W/A/S/D** move, **arrow keys** yaw/pitch, Q/E (or
  Space/C) up/down, Shift = faster. Mouse drag also looks. Eye height 66",
  clamped inside the room polygon (L-shape) with a 10" margin.
- **Gamepad (Xbox controller) via the Gamepad API**: left stick move,
  right stick look, LT/RT (or bumpers) down/up, A = next light option,
  B = next tile option, Y = toggle current/remodel, Start = toggle UI.
  Dead-zone 0.15, poll in the render loop, show a small "🎮 connected"
  badge when `gamepadconnected` fires.
- Camera presets (buttons + number keys): 1 Door, 2 Centre, 3 Vanity,
  4 Mirror close-up, 5 **Junction close-up** (looking at the wainscot cap
  under the accent wall from 18" away), 6 Tub.
- UI panel (top-right, plain HTML/CSS, no framework): Scenario
  (Current / Remodel), Tile/Wallpaper select, Light select, Transition
  select, sliders: accent top height, mirror bottom height, light hang
  height, tile thickness override; FPS counter; "Hide UI" (H).
- Renderer: `WebGLRenderer({antialias:true})`, `outputColorSpace = SRGB`,
  `ACESFilmicToneMapping`, `PCFSoftShadowMap`, pixel ratio capped at 2,
  PMREM environment from `RoomEnvironment`. Lighting: window daylight
  (DirectionalLight through the window + soft RectAreaLight), each fixture
  contributes real `PointLight`s with shadows + emissive glass, recessed
  can SpotLight.

## 6. File layout and interfaces

```
index.html                 import map, canvas, UI panel markup, error overlay
src/main.js                boot: renderer, scene, loop, wiring
src/units.js               IN, inch(), ft(), mm()
src/config.js              ROOM dims (section 3) as exported constants, REMODEL defaults
src/textures.js            loadTextures(): returns {name: THREE.Texture} with
                           repeat/colorSpace set, from assets/textures/manifest.json
src/room.js                buildRoom(ctx) -> Group: walls, floor, ceiling, soffits,
                           wainscot (with cap), window, door recess, trim
src/fixtures/*.js          buildTub, buildVanity, buildToilet, buildCurtain,
                           buildCurrentMirror, buildCurrentLight, buildMisc (frames,
                           switches, outlets, towel ring, vent, can light)
src/controls.js            FirstPersonControls (keys + mouse + gamepad)
src/ui.js                  panel, bindings to state, FPS, presets
src/state.js               observable {scenario, tile, light, transition, ...}
src/remodel/accentWall.js  buildAccentWall(ctx, tileOption, transition) -> Group
src/remodel/ovalMirror.js  buildOvalMirror(ctx) -> Group (Reflector)
src/remodel/junction.js    inspector inset + 3D dimension lines
src/options/registry.js    registerTile/registerLight/registerWallpaper, lists
src/options/tiles/*.js     one file per tile; each `export default {id, name,
                           kind:'tile'|'wallpaper', thicknessMm, makeMaterial(ctx)}`
src/options/lights/*.js    one file per light; each `export default {id, name,
                           build(ctx, {hangBottom}) -> Group (meshes + lights)}`
src/options/index.js       imports every option file (adding an option = add
                           a file + one import line here)
assets/textures/           PNG/JPG maps + manifest.json
tools/make_textures.py     regenerates assets/textures from photos/ (idempotent)
tools/headless_shot.sh     headless Edge screenshot helper (exists)
docs/SPEC.md               this file;  docs/ADDING_OPTIONS.md how-to
README.md                  run instructions, controls, option list
```

`ctx` passed to builders: `{ THREE, textures, config, state, scene, renderer }`.

Texture manifest (`assets/textures/manifest.json`) entries:
`{"name": "wainscot", "map": "wainscot_albedo.jpg", "normalMap": "...png",
"roughnessMap": "...png", "repeat": [tilesPerMetreU, tilesPerMetreV],
"physicalSizeM": [w, h]}` — `physicalSizeM` is the real-world size of one
texture repeat so `textures.js` can compute `repeat` for any surface size.

Required texture names (section 7): `floor_plank`, `wainscot`, `accent_band`,
`vanity_wood`, `quartz`, `wall_paint`, `rattan`, `wood_frame`, `frosted_glass`,
`curtain`, `tile_sage_fan`, `tile_white_subway_stacked`, `wallpaper_sample`,
`door_slab`.

## 7. Textures

Generated by `tools/make_textures.py` from the photos (crop a flat, evenly
lit region, perspective-correct with a 4-point warp where needed, make
tileable with mirrored/blended edges, derive normal + roughness maps) and
procedurally for the new tile options (draw the grid / scallops at 2048 px,
with per-tile glaze variation and a bevelled normal map). Output 2048 px
where the surface is large (floor, wainscot, accent tiles) and 1024 px
otherwise; JPEG q90 for albedo, PNG for normal/roughness.

## 8. Verification (every agent)

1. `python3 -m http.server 8787` from the repo root (or the worktree root),
   then `tools/headless_shot.sh http://localhost:8787/ out.png 1600,1000 45`
   and look at the PNG (Read tool). Scene must render, no red overlay.
2. For visual tuning you may also use the Claude-in-Chrome tools
   (`mcp__claude-in-chrome__*`, load with one ToolSearch call) in a **new tab**.
3. Report fps from the UI counter at preset 3 (Vanity) and 5 (Junction).
