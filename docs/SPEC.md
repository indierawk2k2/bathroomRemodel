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
   x=0 ─────────────────────────────────────── x=102
   │ TUB ALCOVE │col│   VANITY    │ TOILET BAY  │
   │ 30" wide   │6" │   36"       │   30"       │
   │ tub z=10..70   │             │  window above│
   │ ledge z=0..10  │             │             │
   │                                            │
   z=70 ──────────────────────┐    ┌────────────┤  back wall, z = 70
          (tub end wall)      │    │ DOOR RECESS│  x = 66..102
                              │    │ 36"w, 40"d │  z = 70..110
                              │    │ ceiling 96"│
                              └────┴────────────┘  door at z = 110
```

Main room: 102" (x) by 70" (z), ceiling **120"**. Door recess: x 66–102,
z 70–110, ceiling **96"** (soffit face at z = 70 from 96" to 120"). Tub alcove
(x 0–36, z 0–70) has a dropped soffit at **97"**; the soffit's south face is
flush with the alcove's back wall line (z = 70) — see photo 38 top-left.

Walls: drywall, upper paint colour **gray-sage** (~ #B8BFBB; sample from
photos 37/20, not from shadowed areas). Door recess walls slightly lighter.
Ceiling flat white. Baseboard: none visible (tile wainscot runs to the floor).

Floor: 12" x 24" dark grey-brown wood-look porcelain plank, running bond with
1/3 offset, planks running N–S, grout ~1/8" dark grey.

Wainscot (every wall except inside the tub alcove): 12" x 24" grey
stone-look porcelain, running bond, **top of cap at 40" AFF**, tile face
**proud of the drywall by 1/2" (13 mm)**, finished with a ~1.25" chamfered
bullnose cap (photos 51–53). Grout light grey ~1/8".

Tub alcove (x 0–36, z 0–70): tub 60" x 30" x 16" rim, white enamel, apron
on the east side; the alcove walls are tiled floor to **85"** with the same
12 x 24 grey tile, running bond, plus a **dark charcoal 12"-tall accent band
with its bottom at 60"**. White drywall from 85" to the 97" soffit. Curved
chrome curtain rod at ~78" spanning from the column (z ≈ 10) to the back wall
(z = 70); dark grey waffle fabric curtain, hanging on the east side of the
tub, pushed toward the back wall. Chrome shower head, valve and spout are on
the alcove's **back** wall (z = 70): head at 78", valve at 42", spout at 22".

Column + ledge (between tub and vanity): a full-height tiled wall
**x 30–36, z 0–10**, tiled on its east and south faces like the alcove
(accent band included). Inside the alcove, a tiled ledge box **x 0–30,
z 0–10, top at 36"** (dark charcoal bullnose edge on its top front edge;
shampoo bottles sit on it).

Vanity: cabinet **x 36–72, z 0–21, 35" tall** incl. counter; grey horizontal
wood-grain laminate doors (two doors, one drawer top band), 1.25" white
speckled quartz top with a 1" overhang at front, undermount oval sink
centred at x = 54, chrome single-handle faucet. Towel ring (chrome) on the
column's east face at 50". Toilet-paper holder on the vanity's east side.

Current mirror: frameless **24" x 36"**, centred x = 54, bottom at **44"**.
Current light: chrome 2-bulb bar **16" wide**, centred x = 54, bottom at
**80"**, frosted cylindrical shades, warm white.

Window: on the north wall, trim outer edge **x 74–98**, sill top at **42"**,
head at **84"**; white 2.5" flat trim, 1.5" sill nose; single-hung frosted
(obscure) glass, white sash. A small black 5x7 frame leans on the sill.

Toilet: elongated, white, tank against the north wall, centred **x = 87**.

Door recess: walls wainscoted; gray flat-panel door **30" x 80"** with four
horizontal grooves, gray jamb, satin-nickel lever; door at z = 110, opening
into the bathroom (hinges on the east side) — model it closed. Framed flower
photo (black frame, ~16" x 16") on the recess's **west** wall at x = 66,
centred z = 90, 60" AFF. Thermostat / timer and a 2-gang switch on the main
room's **east** wall near the recess (x = 102, z ≈ 60), 48–60" AFF. One
recessed ceiling can (4") at (x = 72, z = 40); exhaust vent grille 8" x 8" at
(x = 50, z = 40).

Outlets: GFCI on the vanity wall at x = 72, 46" AFF (photo 52); another left
of the window at x = 76, 46" (photo 54).

## 4. Remodel scenario

Accent region on the north wall: **x 36–74, y 40–120** (from the top of the
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
