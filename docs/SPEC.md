# Bathroom Remodel Visualizer — Shared Spec

This is the contract between the modules. Every agent builds against it; if a
measurement here turns out to contradict the photos, fix it **here** (and say so
in your report) rather than hard-coding a different number elsewhere.

## 1. Goal

A browser 3D viewer (Three.js, ES modules, no build step) of the bathroom as it
is today, plus a "remodel" scenario that:

- removes the current frameless mirror and 2-bulb light bar;
- hangs the owner's **oval wood-framed mirror (56" tall x 23" wide)** vertically
  over the vanity, flat on the wall like a framed picture;
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
- 08, 09, 10 the oval mirror (56" x 23", wood frame). The black steel arms in
  these photos are the TV-stand mount it sits on in a corner today, not part
  of the mirror; it will hang like a picture, so they are not modelled.
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

Accent region on the north wall, y 40–120 (from the top of the existing
wainscot to the ceiling; height configurable in the UI), across one of two
extents (`accentExtent` state field, panel select "Accent extent", hash
`extent=full|strip`, gamepad Back; br-dli):
- `full-wall` (default, "Full wall, around window"): **x 30–102**, from the
  column tile edge across the vanity strip, round the window and into the
  inside corner with the east wall (the east wall is not tiled; the slab has
  no end face there, it dies into the wall). The window is cut out to the
  outer edge of its trim, read from `config.WINDOW` (`trimX0/X1`, `head`,
  `sillTop`, `stoolThick`, `stoolHorn`, `apronH`; src/room.js builds the
  trim from the same numbers): casing + apron x 76–99, y 41.5–90, and the
  stool with its horns x 75.5–99.5, y 43.25–44. Tile stops 1.5 mm short of
  that outline and the gap is caulked (colour-matched, to 0.3 mm behind the
  shallower of tile face and casing face); wallpaper is trimmed tight. All
  cut edges are real faces of the slab, so a lowered accent top (below the
  90" head) simply runs its top edge into the casing sides.
- `vanity-strip` ("Vanity strip only"): **x 30–76** (column tile edge to
  window trim edge after the br-736 corrections), exactly the pre-br-dli
  geometry.
The pattern origin is the bottom-left of the vanity strip (x 30, the bottom
of the new material) in both, so the vanity strip is identical and the full
wall continues the same grid east (no mirroring, no re-centring). Config:
`REMODEL.vanityStripX0/X1` (30 / 76; `accentX0/X1` are aliases) and
`REMODEL.fullWallX1` (= room width). The sconce offsets, mirror, pendants and
junction-inspector anchor are derived from the vanity strip only and do not
move with the extent.

The tile / wallpaper sits on the drywall plane; its finished face is proud
of drywall by `thickness + 3 mm` thinset (wallpaper: 0.4 mm, no thinset).
The window casing and apron are 5/8" (15.2 mm) proud and the stool nose
1.5", so every option sits behind the casing face: Sage Fan 13 mm (2.2 mm
behind), glass subway 11 mm (4.2), ceramic subway 9 mm (6.2), wallpaper
0.4 mm, `flush-fill` 13 mm for all. Only a thickness override above 12.2 mm
puts the tile proud of the casing; it is then shown standing past it with
its cut edge exposed.

*Correction (br-uio): the existing wainscot has **no bullnose cap** (section
3): the top course is the field tile with a ~6 mm light-sand eased edge, face
13 mm proud. That edge belongs to the room and stays in every transition; the
accent wall only adds what goes on top of it. The old ids `keep-cap`,
`remove-cap` described a cap that does not exist and were replaced.*

Transition detail at y = 40 (`transition` option, default `butt-joint`),
along the whole length of the accent extent (in `full-wall` also under the
window and behind the toilet tank, whose top at 30" is well below it):
- `butt-joint` ("Butt joint + caulk"): new tile sits on the existing edge,
  colour-matched caulk joint (1.5 mm).
- `metal-edge` ("Metal edge strip"): 1/8" brushed-nickel Schluter strip on
  the existing edge between old and new; its front is flush with the prouder
  face, its anchoring leg is buried in the thinset behind the new tile.
- `flush-fill` ("Flush (build wall out)"): wall built out so faces are
  flush (build-out = 13 mm − thinset − tile), caulked.

Resulting steps (new face − wainscot face): Sage Fan 10 + 3 = 13 mm → flush;
glass subway 8 + 3 = 11 mm → 2 mm recessed; ceramic subway 6 + 3 = 9 mm →
4 mm recessed; wallpaper and paint 0.4 mm → 13 mm recessed; glazed-subway
paint finish as glass subway; `flush-fill` → 0 for all.

**Paint colours (br-9q0).** Option kind `paint`, made by
`makePaint({ id, name, hex, finish, brand, code, description, order, tag })`
in `src/options/paints/paint.js` → `{ id, name, kind: 'paint', thicknessMm,
order, hex, finish, paintName, edgeColor: hex, groutColor, repeatM,
description, makeMaterial(ctx), repeatFor(ctx) }`. Finishes: `eggshell`
(roughness 0.72), `matte` (0.9), `satin` (0.5): thicknessMm 0, treated
exactly like wallpaper at the junction (`computeJunction` sets `isWallpaper`
and `isPaint`: no thinset, no caulk line, trimmed tight to the window trim,
inset label "Paint"); a `MeshPhysicalMaterial` in the colour with a
colour-independent procedural roller-stipple normal / roughness map (built
once per finish, 25 cm repeat), so the colour can change in place. `subway`:
glazed 3" x 6" glass subway in the colour, stacked grid, thicknessMm 8 (a
tile at the junction: thinset, caulk), light grey `#cbccc9` grout, from the
white glass subway generator tinted (`makeGlassSubway`; the white option's
procedural output is bit-identical to before and it still prefers the
photo texture). Presets, in hue order (`order` 60–64), all eggshell, hexes
from the makers' pages (`assets/source/paints/SOURCES.md`):
`paint-vardo` Farrow & Ball Vardo No. 288 `#427f83`, `paint-hunt-club`
Sherwin-Williams Hunt Club SW 6468 `#2a4f43`, `paint-hale-navy` Benjamin
Moore Hale Navy HC-154 `#434b56`, `paint-brinjal` Farrow & Ball Brinjal
No. 222 `#5e4449`, `paint-cavern-clay` Sherwin-Williams Cavern Clay SW 7701
`#ac6b53`. Chosen against the mirror frame's mean sRGB `#784137`.
Saved custom colours (`src/options/paints/custom.js`) are registered at
startup after the presets (order 90+), the unsaved one as id `custom`
(section 5).

When the camera is within 30" of the accent/wainscot junction (anchor
x = 49.5", in the clear gap between the glass soap dispenser and the faucet;
preset 5 looks at it from 13"), show a **junction inspector**: a 2D
cross-section inset (canvas, bottom-left) with the wainscot thickness, eased
edge, new material thickness, and the step in mm and fractional inches, plus
thin dimension lines and labels drawn in 3D.

The towel ring and the vanity GFCI (both inside the vanity strip, so inside
either extent) move out to the new finished face in the remodel and back to
the drywall in current. The GFCI just left of the window in photo 54 is that
same vanity outlet (x 68.5); nothing else is mounted on the north wall east
of it (the little frame stands on the stool).

Oval mirror: 56" tall x 23" wide, 1.5" cherry/mahogany wood frame, 3/4" deep,
hung **flat like a framed picture** (hidden wire, felt bumpers: frame back
3/16" off the finished face, backing board closing the gap; no visible
hardware from the front or the side), with a thin soft contact shadow drawn on
the wall round the frame. Its centre is on the sink at **x = 54** (was 55) and
its bottom at 42" (configurable), so it spans 42"–98" (x 42.5"–65.5"). It is
mounted on the accent's finished face. The glass is a
real planar reflection (`three/addons/objects/Reflector.js`) clipped to the
oval; its render target is sized to the view aspect and rendered once per
frame (also with the post-processing passes).

Lights (each option replaces the current light bar; the recessed can stays).
Each light option carries its own placement defaults (`defaultHangBottomIn`,
`defaultFromWallIn`, `defaultMountCentreIn`); picking a light moves its
sliders to those defaults unless the user already moved that slider for that
light in this session.
Hanging fixtures: centre x = 54, hung **below the mirror top** so that from
the door they read as a layer in front of the mirror and show in its
reflection, with the bottom kept above ~74" so a person at the sink still
sees their face. Pendant pairs (`anders-pendants`, `claxy-rod-pendants`)
are the exception: they hang beside the mirror, not in front of it, so they
take the sconces' height rule instead (shade centre on the mirror's widest
point, derived from the mirror). "Light hang (bottom)" slider 60–110" and "Light distance from
wall" slider 6–36" (fixture centre off the finished face); each fixture clamps
itself so it never enters the ceiling. Wall fixtures (`mount: 'wall'`): the
height slider sets the glass centre (56–84"); the distance slider is hidden.
- `rattan-linear`: Adara-style 4-light oval rattan linear chandelier,
  ~32" x 12" x 10", black frame, natural rattan weave (texture pack + alpha
  map, so the weave throws dappled shadows), on chains. Default bottom
  **80"** (body 80–90"), **14"** off the wall.
- `monteaux-pendant`: Monteaux 3-light faceted frosted-glass polyhedron
  pendant, ~16" dia x 18" tall, antique brass frame; the frosted panels glow
  brightest at bulb height and fall off towards the caps. Default bottom
  **76"** (lantern 76–94", below the mirror top), **16"** off the wall.
- `harlan-sconces`: pair of brass 2-light sconces with ribbed clear-glass
  cylinders, 4.25" x 14", each centred in its strip of accent wall between
  the mirror frame and the vanity-strip edge: **x = 36.25" and 70.75"** (54 − 17.75
  / 54 + 16.75; glass 4.1" / 3.1" clear of the frame and inside x 30–76).
  Default glass centre on the **mirror's widest point**, its vertical centre
  = mirror bottom + 28" (**70"** at the default 42" mirror, glass 63–77"),
  derived from the mirror (`defaultMountCentreIn` is a function of
  `{ mirrorBottomIn, mirrorHeightIn }`) so it follows the "Mirror bottom"
  slider (36–56" -> 64–84", all inside the 56–84" range, clamped to it)
  until the user moves the sconce slider for this light or gives `#sconce=`
  (br-dli). Horizontal positions unchanged; at the mirror's widest point the
  glass is 4.1" (west) / 3.1" (east) clear of the frame edge (x 42.5" /
  65.5"), the 2.6" backplate 4.9" / 3.9".
- `anders-pendants` (br-166): pair of West Elm Anders Porcelain Pendants,
  5" size (assets/source/lights/anders-pendant/SOURCES.md): 5" x 4.5" ivory
  porcelain cylinder, open at the bottom, a 1.4" x 3" Champagne Bronze socket
  cup, a 5/16" rigid stem and a 5" x 0.5" canopy; real drop 12.6–54.6" (the
  hang is clamped to the 12.6" minimum, so it never reaches the ceiling).
  Ceiling-hung, a pendant either side of the mirror at the sconce positions,
  **x = 36.25" and 70.75"**: the shade is 3.75" (west) / 2.75" (east) clear of
  the frame at its widest point, 3.75" from the tub-column tile (x 30") and
  2.75" from the window casing (x 76"). Default **7"** off the finished wall
  (shade back 4.5" clear; the canopy sits wholly on the ceiling). Default
  shade centre on the **mirror's widest point** (`defaultHangBottomIn` =
  mirror bottom + 28" − 2.25" = **67.75"** at the default mirror, drop 52.25"),
  a function of the mirror like the sconces', so it follows "Mirror bottom"
  until the user moves "Light hang" for this light or gives `#hang=`; the
  default is clamped to the real 12.6–54.6" drop (`realDropRangeIn`), so a
  mirror below 38.6" leaves it at the 54.6" maximum (bottom 65.4").
  Centre heights of mirror centre −6 / −3 / 0 / +3 / +6" were compared from
  presets 1 and 3, day and night (`shots/anders-height-candidates.jpg`): the
  pendants flank the glass at every height, so a standing face (eyes 60–68")
  is never blocked, and none was clearly more dramatic; −3" and −6" also need
  55.25" / 58.25" drops, past the real 54.6" maximum. Mirror centre kept.
  Lights: per pendant one shadow-casting PointLight low in the shade (the
  porcelain casts, so it throws a pool down through the open bottom and a
  scallop on the tile) and one weak unshadowed PointLight for the light the
  porcelain lets through. Damp rating: not stated by West Elm.
- `claxy-rod-pendants` (br-wbi): pair of Claxy "Modern Brass Pendant Light
  with Frosted Glass Shade Hanging Rod" (CL-B5333DU-J-M;
  assets/source/lights/claxy-brass-rod-pendant/SOURCES.md): open frosted
  glass cylinder 5.8" x 6.3" ringed by a floating brushed-brass band 7" x
  2.7", rigid 0.36" brass rod, swivel adaptor, 4.9" canopy. The rods come as
  3 x 12" + 1 x 6", so the real drop (canopy top to shade bottom) is only
  8.4" + {0, 6, …, 42}" = **8.4–50.4"**; the hang slider stays continuous
  (clamped to the 8.4" minimum), joints are drawn where real sections meet.
  Positions **x = 37" and 71"** (54 ∓ 17, `offsetsClearOfMirror`): the 7"
  band is the minimum 2.0" clear of the frame at its widest point each side,
  3.5" from the tub-column tile and 1.5" from the window casing edge (x 76";
  the band's back is 3.5" off the wall, the casing only 0.6" proud, so they
  never touch). The sconce positions (x 36.25 / 70.75) would leave the east
  band only 1.75" from the frame. Default **7"** off the wall (band back 3.5"
  clear, canopy wholly on the ceiling). Default height: the shade centre on
  the **mirror's widest point**, snapped to the **longest real rod drop that
  keeps it at or above that point** (`realDropRangeIn: [8.4, 50.4]`,
  `realDropStepsIn` = every rod combination; ceiling from the room config).
  The mirror-centre height at the default mirror would need a 53.15" drop,
  2.75" more than the rods give, so the default is all four rods: drop
  50.4", **shade bottom 69.6" / centre 72.75"** (the same at `#mirror=38`;
  at `#mirror=50` three 12" rods, 44.4", bottom 75.6" / centre 78.75").
  It follows "Mirror bottom" until the user moves "Light hang". The slider
  stays continuous; lower values render but need more rod than exists,
  and the option's description gives the lowest real shade bottom for the
  ceiling (69.6" at 120"). Heights of mirror centre
  −6…+6" were compared from presets 1 and 3, day and night
  (`shots/claxy-height-candidates.jpg`, shot before the snap): the pair
  flanks the glass at every height (a standing face is never blocked) and
  none was clearly more dramatic; +3" is the candidate the real default
  (+2.75") matches. Lights, per pendant, both
  at the bulb: a shadow-casting PointLight (the glass does not cast, the
  brass band does: a shadow ring on the tile between lit bands above and
  below) and a weaker unshadowed one for the glow off the glass, which keeps
  that ring soft as in the maker's bathroom photo. Damp rating: not stated;
  Claxy lists bathrooms but advises a dry location.
- `stella-pendants` (br-kv5): pair of Mitzi by Hudson Valley "Stella"
  pendants, Aged Brass (H105701-AGB;
  assets/source/lights/stella-pendant/SOURCES.md): 7" glossy opal glass
  globe, **closed at the bottom** (bulb fully enclosed), under a shallow
  3.8" brass cap and cord collar, black fabric cord, 4.5" round canopy;
  7" x 7.75" overall; hangs 11.25–114.25" (HVL minimum / maximum height,
  `realDropRangeIn`). Positions **x = 37" and 71"** (54 ∓ 17,
  `offsetsClearOfMirror`: globe 2" clear of the frame at its widest
  point, 3.5" from the tub-column tile, 1.5" from the casing edge).
  Default **7"** off the wall; default globe centre on the **mirror's
  widest point** (bottom **66.5"** at the default mirror), following
  "Mirror bottom". Lights, per pendant, both at the bulb: a
  shadow-casting PointLight (the opal does not cast; the brass cap and
  cord do) and a weaker unshadowed one for the glow. E26 A19 60 W; cUL
  damp.

Tile / wallpaper options (registry):
- `sage-fan`: Daltile Handcrafted Sage Fan, ~4" scallop (fish-scale) mosaic,
  muted sage green glossy glaze with handmade variation, 3/8" (10 mm) thick,
  light grey grout.
- `white-glass-subway-stacked`: 3" x 6" white glass subway, **stacked grid
  (no stagger), long edge horizontal**, 5/16" (8 mm) thick, bright white
  grout 1/16".
- `white-ceramic-subway-offset`: 3" x 6" glossy white ceramic subway,
  running bond (half offset), long edge horizontal, 1/4" (6 mm) thick, light
  grey grout (procedural; br-uio, added by following docs/ADDING_OPTIONS.md).
- Fan / fish-scale tiles (br-s42). Each one is a one-line call to the
  `makeFanTile()` factory in `src/options/tiles/fanTile.js`, which is the Sage
  Fan generator parametrised: fan period, row pitch, dome shape, glaze, and
  variation / crackle / undulation / feather ribs. The Sage Fan itself now goes
  through the factory, and its procedural output is bit-identical to before.
  All ten are procedural. Their colours are photo medians from
  `assets/source/tiles/SOURCES.md`.
  - The step is measured at the wainscot with a butt joint: new face
    (thickness + 3 mm thinset) minus the 13 mm wainscot face.
  - The casing figure is the new face minus the 15.2 mm window-casing face.

  Navy group, `order` 31–36:

  | id | product | thickness | step at wainscot | at casing |
  |---|---|---|---|---|
  | `revalia-radiant-blue-fan` | Daltile Revalia Remix 3" Fan, Radiant Blue RV33. Measured 1.64" fans, 0.80" rows. | 8 mm | −2.0 mm (recessed) | 4.2 mm behind |
  | `mercury-slate-fish-scale-medium` | Mercury Medium Moroccan Fish Scale, 129 Slate, 3-3/4" x 3-3/16" | 6.35 mm | −3.65 mm | 5.9 mm behind |
  | `mercury-slate-fish-scale-large` | Mercury Large Moroccan Fish Scale, 129 Slate, 5-5/8" x 5" | 6.35 mm | −3.65 mm | 5.9 mm behind |
  | `mercury-denim-fish-scale-large` | Mercury Large, 1013 Denim, glossy crackle | 6.35 mm | −3.65 mm | 5.9 mm behind |
  | `fireclay-navy-ogee-drop` | Fireclay Ogee Drop, Navy Blue Gloss, 5-5/16" x 4-11/16", `shape: 'ogee'`, crazing | 8 mm | −2.0 mm | 4.2 mm behind |
  | `nabi-midnight-blue-fishscale` | TileBar Nabi Fish Scale 3x4 glass, Midnight Blue Green, `shape: 'pointed'`, feather ribs | 11.5 mm | **+1.5 mm proud** | 0.7 mm behind |

  Teal / green group, `order` 41–44:

  | id | product | thickness | step at wainscot | at casing |
  |---|---|---|---|---|
  | `miramo-reef-fan` | Daltile Miramo 3" Fan Undulated, Reef MR49, V3 | 6.35 mm | −3.65 mm | 5.9 mm behind |
  | `miramo-horizon-fan` | Daltile Miramo, Horizon MR48 | 6.35 mm | −3.65 mm | 5.9 mm behind |
  | `mercury-canopy-fish-scale-large` | Mercury Large, 512 Canopy, speckled | 6.35 mm | −3.65 mm | 5.9 mm behind |
  | `fireclay-evergreen-ogee-drop` | Fireclay Ogee Drop, Evergreen Gloss, V3 | 8 mm | −2.0 mm | 4.2 mm behind |

  With `flush-fill`, every one of them steps 0 mm.
- `wallpaper-sample`: one placeholder wallpaper (muted botanical print),
  0 mm thick — exists so the wallpaper path is proven and extensible.
- `wallpaper-cole-son-feather-fan-soft-olive`: Cole & Son Icons Feather Fan
  112/10037 Soft Olive (Perigold QWH8178 "Old Olive"), paper, roll
  0.53 x 10.05 m, 10.6 cm repeat, straight match; texture = one repeat
  (17.67 x 10.6 cm), white dots satin over a matte ground (br-ukz).
- `wallpaper-rebel-walls-ripple-blue`: Rebel Walls Ripple Blue R19317,
  printed to wall size, but a repeating design with a 1.00 x 1.20 m pattern
  tile, matte non-woven (br-ukz).
- `wallpaper-debona-crystal-trellis-blue-silver`: Debona Crystal Trellis
  8894 Blue / Silver (World of Wallpaper DEB052), roll 0.53 x 10.05 m, 16 cm
  repeat, "offset" match (four lanterns per roll width, so the trellis runs
  on across the strips); texture = one roll width x 4 repeats (0.53 x
  0.64 m); satin metallic trellis (metalness in the roughness map's B
  channel) on a matte textured ground with glitter flecks (br-oc9).
- `wallpaper-wow-metro-prism-emerald-gold`: World of Wallpaper Metro Prism
  WOW037 Emerald Green / Gold (B&Q 3294270361047), roll 0.53 x 10.05 m,
  17.6 cm repeat, offset match (a half drop inside the artwork; the roll
  width is a whole number of motifs); texture = half a roll width x one
  repeat (0.265 x 0.1767 m) from the retailer's 1200 px flat; partly
  metallic satin gold lines on a matte ground, metalness in the roughness
  map's B channel (br-9a0).
- `wallpaper-heroad-gold-chevron-dark-green`: Heroad peel-and-stick gold
  chevron on dark green (eBay 168714908980, Amazon B0CF5HCQ69), PVC,
  17.3" x 78.7" self-adhesive roll; no published repeat or flat image:
  texture = the repeat measured in a front-on room scene (40 copies
  averaged), at an estimated 0.22 x 0.142 m (two repeats per 44 cm roll
  width); partly metallic gold lines, embossed PVC grain (br-34z).
- `wallpaper-chesapeake-quelala-ring-ogee-navy`: Chesapeake (York)
  Quelala Ring Ogee 3122-11002 Navy, prepasted acrylic-coated paper,
  20.5" roll, 10.5" repeat, straight match; texture = a quarter roll
  width x one repeat (0.131 x 0.2667 m), satin, no metal (br-cru).
- `wallpaper-schumacher-imperial-trellis-ii-ivory-navy`: Schumacher
  Imperial Trellis II 5005801 Ivory / Navy, paper, 27" roll, 12.625"
  repeat, straight; the artwork's cell is 6.15" across (listed 6.75");
  texture = one cell (0.1562 x 0.3207 m), matte (br-cru).
- `wallpaper-spoonflower-geometric-trellis-white-navy`: Spoonflower
  15299902 white on navy, printed to order, 24" panels, 6" repeat;
  rebuilt 4x from the 400 px swatch (0.1524 m square), vinyl finish
  (br-cru).
- `wallpaper-arthouse-orson-navy-trellis`: Arthouse Orson AH909702,
  paper, 20.9" roll and repeat, straight; texture = the artwork's
  3.48" x 6.97" cell (0.0885 x 0.177 m); lightly metallic lines
  (metalness in the roughness map's B channel) (br-cru).
- `wallpaper-york-graceful-geo-navy-silver`: York Graceful Geo MD7174
  Navy / Silver, non-woven, 27" roll, 25.2" repeat, straight; texture =
  the maker's flat, one roll width x one repeat (0.6858 x 0.6401 m);
  partly metallic weathered silver (br-cru).
- `wallpaper-a-street-livia-dark-blue-trellis`: A-Street Prints Livia
  4014-26411 Dark Blue, non-woven, 20.5" roll, 10.4" repeat, straight;
  texture = half the roll width x one repeat (0.2603 x 0.2642 m); metal
  only on the silver accent lines (br-cru).
- `wallpaper-chesapeake-tap-root-dark-blue`: Chesapeake (Brewster) Tap
  Root 4169-27600 Dark Blue floral damask, unpasted non-woven, 20.5" roll,
  10.25" repeat (Total Wallcovering lists 20.86"; the artwork agrees with
  10.25"), straight; texture = half the roll width x one repeat
  (0.2603 m square), matte, no metal (br-pov).

## 5. Viewer

- First-person: **W/A/S/D** move, **arrow keys** yaw/pitch, Q/E (or
  Space/C) up/down, Shift = faster. Mouse drag also looks. Eye height 66",
  clamped inside the room polygon (L-shape) with a 10" margin.
- **N** toggles Day / Night: Night drops the window daylight (sun, window
  area light, glass glow) to near zero and the ambient environment to 0.05,
  so the fixtures can be judged on their own. **L** switches the vanity
  fixture (current bar or the remodel light) on / off. Both are also in the
  panel.
- **Gamepad (Xbox controller) via the Gamepad API**: left stick move,
  right stick look, LT/RT (or bumpers) down/up, A = next light option,
  B = next tile option, X = next transition, Y = toggle current/remodel,
  Back = toggle the accent extent,
  D-pad left/right = previous/next preset, Start = toggle UI. Dead-zone 0.15,
  poll in the render loop (a pad that is already awake is adopted on the
  first poll), show a small "🎮 connected" badge and a one-line controller
  legend in the panel.
- Camera presets (buttons + number keys): 1 Door, 2 Centre, 3 Vanity,
  4 Mirror close-up, 5 **Junction close-up** (13" from the wainscot top under
  the accent wall, x = 49.5"), 6 Tub.
- UI panel (top-right, plain HTML/CSS, no framework): Scenario
  (Current / Remodel), Day / Night, Light on / off, Tile/Wallpaper select,
  Light select, Accent extent select, Transition select (with a one-line
  description), sliders:
  accent top height, mirror bottom height, light height (hang bottom for
  ceiling fixtures, centre for sconces), light distance from wall (ceiling
  fixtures only), tile thickness override; Quality
  select; FPS counter with the quality level; "Hide UI" (H).
- **Custom colour** group under the Tile/Wallpaper select (br-9q0): colour
  input, finish select (Eggshell / Matte / Satin paint, Glazed subway tile),
  name field, Apply / Save / Delete. Colour and finish changes preview live
  (100 ms debounce) as the unsaved option `custom`: a colour change on a
  paint finish sets `material.color` in place, a finish change or the subway
  finish rebuilds the accent wall. Selecting any paint option pre-fills the
  chooser. Save stores `{ id: 'custom-<slug>-<4 random>', name, hex, finish }`
  in `localStorage['bathroomRemodel.customPaints']` (JSON array; same name,
  case-insensitive, overwrites) and selects it; Delete (enabled only for a
  saved colour) removes it and selects the first paint preset. All storage
  access is try/catch. While `custom` is selected the hash carries
  `tile=custom&paint=<hex>&finish=<finish>&pname=<name>`.
- URL hash: `preset`, `scenario`, `tile`, `light`, `transition`, `extent`, `night`,
  `lights`, `top`, `mirror`, `hang`, `fromwall`, `sconce`, `thick`, `q`, `auto`, `ui`,
  `cam`, `off`, and with `tile=custom`: `paint` (hex without `#`), `finish`,
  `pname` (README).
- Renderer: `WebGLRenderer({antialias:true})`, `outputColorSpace = SRGB`,
  `ACESFilmicToneMapping`, exposure 1, `PCFSoftShadowMap` (on-demand shadow
  updates), PMREM environment from `RoomEnvironment` (intensity 0.28 by day)
  plus a **cube-map probe of the real room** (re-captured when the scene
  changes) as the envMap of every metal. Max anisotropic filtering on all
  pack textures. Lighting: window daylight (DirectionalLight through the
  window + soft RectAreaLight + emissive frosted glass that blooms slightly),
  each fixture contributes real `PointLight`s with shadows + emissive glass,
  recessed can SpotLight. Fixture colour is 2700 K as the eye reads it after
  adapting (sRGB 1, .78, .55).
- **Quality** (`src/quality.js`), saved in localStorage:
  High = pixel ratio 2, HalfFloat composer with 4x MSAA, GTAO (half
  resolution), UnrealBloom (strength 0.14, threshold 1.1), OutputPass,
  reflector 1200 px tall, sun shadow 2048, point / spot 1024;
  Medium = pixel ratio 1.5, no AO, bloom, reflector 900, point 512;
  Low = pixel ratio 1, direct render, reflector 600, point 256.
  Automatic step-down: rolling fps < 30 for 3 s drops one level (shown as
  "(auto)"), never while the tab is hidden or within 3 s of a change.
  `window.__app.measure(n)` renders n frames synchronously (GPU-synced) and
  returns ms/frame. Measured on the M1 Max at High, 2632 x 1592: 11–15 ms
  (65–90 fps) with the browser otherwise idle, 14–29 ms (34–69 fps) while it
  was busy with other work (br-uio).

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
src/remodel/index.js       setupRemodel(app): options -> state, rebuilds, re-mounts, inspector
src/quality.js             composer, GTAO, bloom, quality levels, auto step-down, measure()
src/envProbe.js            cube-map reflection probe of the room for metals
run.sh                     local server + browser launcher
src/options/registry.js    registerTile/registerLight/registerWallpaper, lists
src/options/tiles/*.js     one file per tile; each `export default {id, name,
                           kind:'tile'|'wallpaper', thicknessMm, makeMaterial(ctx)}`
src/options/paints/paint.js   makePaint() factory + FINISHES (kind 'paint')
src/options/paints/custom.js  saved / unsaved custom colours (localStorage)
src/options/paints/*.js    one preset per file: `export default makePaint({...})`
src/options/lights/*.js    one file per light; each `export default {id, name,
                           build(ctx, {hangBottomIn, centreZIn, ...}) -> Group,
                           defaultHangBottomIn?, defaultFromWallIn?,
                           defaultMountCentreIn?}`
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
`door_slab`; product wallpapers add `wallpaper_cole_son_feather_fan_soft_olive`,
`wallpaper_rebel_walls_ripple_blue`,
`wallpaper_debona_crystal_trellis_blue_silver`,
`wallpaper_wow_metro_prism_emerald_gold`,
`wallpaper_heroad_gold_chevron_dark_green`,
`wallpaper_chesapeake_quelala_ring_ogee_navy`,
`wallpaper_schumacher_imperial_trellis_ii_ivory_navy`,
`wallpaper_spoonflower_geometric_trellis_white_navy`,
`wallpaper_arthouse_orson_navy_trellis`,
`wallpaper_york_graceful_geo_navy_silver`,
`wallpaper_a_street_livia_dark_blue_trellis` and
`wallpaper_chesapeake_tap_root_dark_blue` (from `assets/source/wallpapers/`).

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
