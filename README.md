# Bathroom Remodel Visualizer

A first-person 3D walk-through of the bathroom as it is today, plus a
"remodel" scenario (oval mirror, new light, accent wall), built with Three.js
r170 straight from the CDN. There's no build step and nothing to install.

## Run

```sh
python3 -m http.server 8787      # from the repo root
open http://localhost:8787/
```

The title changes to `Bathroom Viewer — ready` once the first frame has
rendered. Any error shows up in a red overlay at the bottom of the page.

### URL hash options

| hash | effect |
| --- | --- |
| `#preset=N` | start at camera preset N (1–6) |
| `#scenario=remodel` | start in the remodel scenario |
| `#ui=0` | start with the panel hidden |
| `#cam=x,y,z,tx,ty,tz[,fov]` | debug pose in inches (eye, look-at) |
| `#off=name,name` | debug: disable lights by name (`window_sun`, `window_area`, `currentLight_bulb`, `recessedCan_light`) |

Options combine with `&`, e.g. `#preset=5&ui=0`.

Headless screenshot:

```sh
tools/headless_shot.sh "http://localhost:8787/#preset=3" shots/vanity.png 1600,1000 45
```

## Controls

| input | action |
| --- | --- |
| W A S D | move |
| arrow keys / mouse drag | look |
| Q / E (or C / Space) | down / up |
| Shift | faster |
| 1–6 | camera presets: Door, Centre, Vanity, Mirror, Junction, Tub |
| H | hide / show the panel |

Xbox controller (Gamepad API, dead-zone 0.15):

| input | action |
| --- | --- |
| left stick | move |
| right stick | look |
| LT / RT (or LB / RB) | down / up |
| A | next light option |
| B | next tile option |
| X | next transition |
| Y | toggle current / remodel |
| Start | toggle UI |

A "🎮 connected" badge appears when a controller connects.

## Layout

```
index.html            import map, canvas, UI panel, error overlay
src/main.js           boot, renderer, loop, window.__app
src/units.js          IN, inch(), ft(), mm()
src/config.js         every room measurement (inches -> metres), presets
src/textures.js       manifest loader with procedural / flat fallbacks
src/state.js          observable state
src/room.js           shell: floor, ceilings, drywall, wainscot + cap,
                      alcove tile, column, window, doors, daylight
src/fixtures/*.js     tub, vanity, toilet, curtain, current mirror,
                      current light bar, misc (outlets, switches, frame,
                      vent, recessed can, towel ring)
src/controls.js       first-person keyboard / mouse / gamepad controls
src/ui.js             panel bindings, FPS counter, presets
src/remodel/, src/options/   remodel components and option registry
assets/textures/      generated maps + manifest.json (tools/make_textures.py)
docs/SPEC.md          the shared spec, including the measurements as corrected from the photos
```

Coordinates: X east, Y up, Z south (toward the doors), metres. The origin is
the floor at the vanity-wall / tub-wall corner. Facing the vanity means
looking toward −Z.

## Options

Tiles, wallpapers and lights are one file each under `src/options/`. See
`docs/ADDING_OPTIONS.md`.

## Notes

- If `assets/textures/manifest.json` is missing, the textures fall back to
  procedural canvases (grout grid, speckle, grain) or flat colours, so the app
  still runs.
- Shadow maps are only re-rendered when something changes, because the scene
  is static. Code that adds or moves shadow casters should call
  `__app.ctx.invalidateShadows()`.
