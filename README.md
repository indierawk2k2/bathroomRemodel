# Bathroom Remodel Visualizer

A first-person 3D walk-through of the bathroom as it is today, plus a
"remodel" scenario: the owners' oval wood mirror, a new vanity light, and a
tiled (or wallpapered) accent wall above the existing wainscot. It is built
with Three.js r170 straight from a CDN: no build step, nothing to install.

## Run

```sh
./run.sh            # serves this folder on port 8787 (or the next free one) and opens the browser
```

Ctrl-C stops it. Without the script:

```sh
python3 -m http.server 8787      # from the repo root
open http://localhost:8787/
```

The page title changes to `Bathroom Viewer — ready` once the first frame has
rendered. Any error shows up in a red overlay at the bottom of the page.
Chrome or Edge on a Mac with Apple silicon is the target (it measured 34–90 fps at High quality, 2632 x 1592 pixels,
on an M1 Max).

## Controls

Keyboard and mouse:

| input | action |
| --- | --- |
| W A S D | walk |
| arrow keys, or drag with the mouse | look around |
| Q / E (or C / Space) | down / up |
| Shift (hold) | move faster |
| 1–6 | camera presets: 1 Door, 2 Centre, 3 Vanity, 4 Mirror, 5 Junction close-up, 6 Tub |
| N | day / night (night turns the window daylight off, so the light fixtures can be judged on their own) |
| L | vanity light on / off |
| H | hide / show the panel |

Xbox controller (or any "standard" gamepad, through the browser's Gamepad API;
press a button once after plugging it in so the browser exposes it):

| input | action |
| --- | --- |
| left stick | walk |
| right stick | look |
| LT / RT (or LB / RB) | down / up |
| left stick click | move faster |
| A | next light option |
| B | next tile / wallpaper option |
| X | next transition at the wainscot |
| Y | switch between Current and Remodel |
| Back (View) | switch the accent extent (full wall / vanity strip) |
| D-pad left / right | previous / next camera preset |
| Start | hide / show the panel |

A "🎮 connected" badge and a one-line controller legend in the panel appear
when a pad is connected.

## The panel

- **Scenario**: *Current* (the bathroom as it is, with the frameless mirror
  and chrome light bar) or *Remodel*.
- **Daylight**: Day / Night. **Vanity light**: On / Off.
- **Tile / wallpaper** for the accent wall (from the top of the wainscot up
  to the "Accent top" height; how far it runs across the wall is the
  "Accent extent" below):
  - *Sage Fan (Daltile Handcrafted)*: the 4" green fan / fish-scale mosaic
    from the store display (photo 01), glossy glaze, 3/8" (10 mm) thick.
  - *White glass subway 3x6, stacked*: 3" x 6" white glass, long side
    horizontal, laid in a straight grid (no stagger), 5/16" (8 mm) thick.
  - *White ceramic subway 3x6, offset*: classic glossy white ceramic subway in
    running bond, 1/4" (6 mm) thick.
  - *Wallpaper: muted botanical (sample)*: a placeholder print, to show what
    wallpaper does at the junction (it is paper-thin).
  - *Cole & Son Feather Fan, Soft Olive (wallpaper)*: Cole & Son Icons
    112/10037, sold by Perigold as QWH8178 "Old Olive". White dotted fans
    on a sage-olive paper, 7" fans, 10.6 cm (4.2") repeat, straight match,
    21" x 33' roll.
  - *Rebel Walls Ripple, Blue (wallpaper)*: R19317, hand-painted blue wave
    arches (about 5" wide) on a worn off-white ground. It is printed to the
    wall's size, but the design repeats every 1.00 x 1.20 m. Matte non-woven.
  - *Debona Crystal Trellis, Blue / Silver (wallpaper)*: 8894, a metallic
    silver ogee trellis (lanterns 5.2" wide, 16 cm / 6.3" repeat) on a
    crinkled midnight-blue ground with glitter, 21" x 33' roll. Washable,
    but B&Q lists it as not for bathrooms or kitchens.
  All three are built from the makers' own artwork
  (`assets/source/wallpapers/SOURCES.md`) at true scale.
- **Light**:
  - *Rattan oval linear, 4-light (Adara)*: 32" x 12" x 10" woven rattan
    chandelier over the sink, hung from the ceiling on chains.
  - *Monteaux faceted glass pendant, 3-light*: 16" x 18" frosted-glass
    lantern in antique brass.
  - *Harlan brass sconces, ribbed glass (pair)*: one either side of the
    mirror, each centred in the strip of tile between the mirror frame and
    the edge of the accent wall (x 36.25" and 70.75").
- **Accent extent**: *Full wall, around window* (the default) runs the tile
  or wallpaper across the whole vanity wall: from the tub column, behind the
  vanity, round the window (above its head trim, below the sill and apron
  down to the wainscot, and the narrow strip between the trim and the
  corner) and into the corner with the toilet-side wall, which itself stays
  painted. Tile stops at the outer edge of the window trim with a caulk
  joint, the way a tile setter would butt it; wallpaper is trimmed tight to
  it. *Vanity strip only* keeps it to the strip behind the vanity (x 30"–76",
  tub column to window trim). The pattern is laid from the same starting
  point in both, so the vanity strip looks identical and the full wall just
  carries on; the mirror and the lights stay where they are.
- **Transition at wainscot**: how the new tile meets the top of the existing
  tile (see below); it runs the whole length of the new tile, under the
  window and behind the toilet too.
- **Sliders**: accent top height; mirror bottom height (default 42", so the
  56"-tall mirror spans 42"–98"; the mirror hangs flat like a picture, with
  no brackets); light height, which is the *bottom* of a hanging fixture
  (60"–110"; defaults: rattan 80", Monteaux 76", both below the mirror top so
  the fixture hangs in front of the mirror as you walk in; each fixture stops
  itself before it reaches the ceiling) or the *centre* of the sconces
  (56"–84"; by default on the mirror's widest point, i.e. its vertical
  centre: 70" with the mirror at 42", and they follow the "Mirror bottom"
  slider until you move the sconce height yourself); light distance from wall, the hanging fixture's
  centre off the wall (6"–36"; defaults: rattan 14", Monteaux 16"; hidden for
  sconces); tile thickness override (0 = use the product's thickness). Each
  light has its own defaults: picking a light moves these sliders to them,
  unless you already moved that slider for that light.
- **Quality**: High / Medium / Low (see "Quality" below).
- **Camera presets** 1–6.

When the camera is within 30" of the junction in the Remodel scenario (preset
5 goes straight there), an inset in the bottom-left corner draws the cross
section through the wall, and 3D dimension labels appear on the wall itself.

## The transition where the new tile meets the old wainscot

The existing wainscot is 12" x 24" grey porcelain, 40" high. Its top is not a
separate trim piece: the top row is the same tile with a factory-rounded top
edge (the thin light-sand line in photos 51–53). The tile face stands
1/2" (13 mm) out from the painted wall. A new tile on the wall above sits on
3 mm of thin-set mortar, so whether the new face lines up with the old one
depends on the tile:

| tile | new face (tile + 3 mm thin-set) | compared with the wainscot face (13 mm) |
| --- | --- | --- |
| Sage Fan, 10 mm | 13 mm | flush |
| White glass subway, 8 mm | 11 mm | 2 mm (about 1/16") set back |
| White ceramic subway, 6 mm | 9 mm | 4 mm (about 3/16") set back |
| Wallpaper | 0.4 mm | 13 mm (1/2") set back: the wainscot top forms a small ledge |

The three options:

- **Butt joint + caulk** (`butt-joint`): the new tile simply starts on top
  of the old tile's rounded edge, and the small gap is filled with caulk in a
  matching colour. It is the cheapest and quickest. It looks best when the two
  faces are nearly flush (Sage Fan); with a thinner tile you see the old
  tile's top edge as a small step.
- **Metal edge strip** (`metal-edge`): a 1/8" brushed-nickel profile (a
  Schluter strip) sits on the old tile's edge, and the new tile starts on top
  of it. It draws a clean, deliberate line between old and new, and hides a
  small difference in thickness. It adds one more material to the room
  (nickel, which suits the existing chrome and nickel fixtures).
- **Flush (build wall out)** (`flush-fill`): the wall above the wainscot is
  first built out with backer board so the new face comes out exactly flush
  with the old one, then caulked. It gives the smoothest result for any
  thickness, but means extra work, and the build-out also shows at the window
  trim and the tub column edges.

## Quality

- **High**: full pixel ratio (up to 2), 4x MSAA, ambient occlusion (GTAO at
  half resolution), a soft bloom on the light fixtures, a 1200-pixel-tall
  mirror reflection, 2048 / 1024 shadow maps.
- **Medium**: pixel ratio 1.5, no ambient occlusion, 900-pixel reflection,
  smaller shadows.
- **Low**: pixel ratio 1, no post-processing, 600-pixel reflection.

The level is saved in the browser. If the frame rate stays under 30 fps for
3 seconds, the viewer drops one level by itself and shows "(auto)" next to
the fps counter; choosing a level in the panel overrides that. In the browser
console, `__app.measure(60)` renders 60 frames back to back at the current
view and returns the time per frame.

## URL hash options

| hash | effect |
| --- | --- |
| `#preset=N` | start at camera preset N (1–6) |
| `#scenario=remodel` | start in the remodel scenario |
| `#tile=ID` `#light=ID` `#transition=ID` | pick options (ids as listed above, e.g. `tile=white-glass-subway-stacked`, `light=rattan-linear`, `transition=metal-edge`) |
| `#extent=full` (`strip`) | accent extent: full wall round the window (default) or the vanity strip only |
| `#night=1`, `#lights=0` | night; vanity light off |
| `#top=` `#mirror=` `#hang=` `#fromwall=` `#sconce=` `#thick=` | slider values (inches; `thick` in mm); `fromwall` = hanging light's distance from the wall |
| `#q=high` (`medium`, `low`) | force a quality level, no automatic step-down |
| `#auto=0` | keep the saved level, no automatic step-down |
| `#ui=0` | start with the panel hidden |
| `#cam=x,y,z,tx,ty,tz[,fov]` | debug pose in inches (eye, look-at) |
| `#off=name,name` | debug: disable lights by name (`window_sun`, `window_area`, `currentLight_bulb`, `recessedCan_light`) |

Options combine with `&`, e.g. `#preset=5&scenario=remodel&tile=wallpaper-sample&transition=flush-fill&ui=0`.

Headless screenshot (software rendering, so its fps counter means nothing):

```sh
tools/headless_shot.sh "http://localhost:8787/#preset=3&scenario=remodel&ui=0&q=high" shots/vanity.png 1600,1000 60
```

## Assumptions: please tape-measure these

Everything was estimated from the photos against a few standard sizes (tub
60" x 30", toilet, 35" vanity height, 120" ceiling). The numbers live in
`src/config.js`; change one there and reload. The ones that matter most for
the decision:

| what | assumed | where it matters |
| --- | --- | --- |
| room width (tub wall to east wall) | 102" | overall layout |
| room depth (vanity wall to door wall) | 70" | layout, camera |
| ceiling height | 120" (10'), flat over the tub too; door recess 96" | how far the pendants hang, accent top |
| vanity | 36" wide (x 36"–72"), 21" deep, 35" to the counter top, sink centred at 54" | mirror and light centring |
| wainscot top | 40" above the floor | where the new tile starts |
| wainscot proudness | 1/2" (13 mm) from the painted wall to the tile face | the step at the junction (the whole point of preset 5) |
| wainscot top edge | factory-rounded edge about 1/4" (6 mm) tall, no separate cap | the transition options |
| tile-column edge (left end of the accent wall) | 30" from the tub wall | accent width |
| window trim | outer edges at 76" and 99", sill 44", head trim top 90"; casing and apron 5/8" proud, stool 3/4" thick with 1/2" horns, apron 1 3/4" | right end of the vanity strip; the cut-out in the full wall |
| new tile thicknesses | Sage Fan 10 mm, glass subway 8 mm, ceramic subway 6 mm, thin-set 3 mm | the step |
| oval mirror | 56" x 23", bottom at 42", centred on the sink | spacing to the lights |
| outlet | centre 68.5" from the tub wall, 43.5" high | sits in the new tile |
| towel ring | 38.5" from the tub wall, post at 53" | sits in the new tile |
| tub and column | tub 60" x 30"; tiled column 30" wide, 10" deep, 85" tall tile | left edge of the view |

## Layout

```
index.html            import map, canvas, UI panel, error overlay
run.sh                start a local server and open the browser
src/main.js           boot, renderer, lights, day / night, loop, window.__app
src/quality.js        render pipeline: composer, GTAO, bloom, levels, auto step-down, measure()
src/envProbe.js       cube-map reflection probe of the real room for the metals
src/units.js          IN, inch(), ft(), mm()
src/config.js         every room measurement (inches -> metres), remodel defaults, presets
src/textures.js       manifest loader with procedural / flat fallbacks
src/state.js          observable state
src/room.js           shell: floor, ceilings, drywall, wainscot + eased edge, alcove tile, column, window, doors, daylight
src/fixtures/*.js     tub, vanity (faucet, bottles), toilet, curtain, current mirror + light bar, misc
src/controls.js       first-person keyboard / mouse / gamepad controls
src/ui.js             panel bindings, FPS counter, presets, gamepad buttons
src/remodel/index.js  wires the options and remodel parts to the state
src/remodel/*.js      accent wall + transitions, junction inspector, oval mirror
src/options/          tile / wallpaper / light options, one file each (docs/ADDING_OPTIONS.md)
assets/textures/      generated maps + manifest.json
tools/                make_textures.py, headless_shot.sh
dev/components.html   stand-alone test bench for the remodel parts
docs/SPEC.md          the shared spec, with the measurements as corrected from the photos
```

Coordinates: X east, Y up, Z south (toward the doors), metres. The origin is
the floor at the vanity-wall / tub-wall corner. Facing the vanity means
looking toward −Z.

## Textures

All maps in `assets/textures/` come from `tools/make_textures.py` (Python 3,
Pillow, numpy), cut from the photos or drawn procedurally:

```sh
python3 tools/make_textures.py                # everything, ~45 s
python3 tools/make_textures.py --only quartz  # one texture
```

See `docs/textures.md` for the sources and the manifest format. If the
manifest is missing, the app falls back to procedural canvases or flat
colours and still runs.

## Adding a tile, wallpaper or light

One file under `src/options/` plus one line in `src/options/index.js`; see
`docs/ADDING_OPTIONS.md`.

## Notes

- Shadow maps are only re-rendered when something changes, because the scene
  is static. Code that adds or moves shadow casters should call
  `__app.ctx.invalidateShadows()`.
- The mirrors are real planar reflections (`Reflector`), rendered once per
  frame even with the post-processing passes.
