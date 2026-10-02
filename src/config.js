// Room dimensions (docs/SPEC.md section 3), written in inches via inch() so
// they read like the tape measure.  Everything exported here is in METRES.
//
// Coordinates: X east (right when facing the vanity), Y up, Z south (toward
// the doors).  Origin = floor at the corner where the vanity wall (north,
// z = 0) meets the tub-side wall (west, x = 0).
import { inch, mm } from './units.js';

const P = (x, z) => [inch(x), inch(z)];

export const ROOM = {
  width: inch(102), // x, west wall -> east wall
  depth: inch(70), // z, vanity wall -> tub end wall / south wall
  ceiling: inch(120),
  // Floor plan polygon (x, z) in metres, counter-clockwise seen from above.
  // Photos 39, 48, 49: the door recess opens off the south wall between
  // x = 36 and x = 72 (its west jamb is ~3" past the tub tile panel and the
  // reflected doorway in photo 37 is centred on the vanity).
  polygon: [P(0, 0), P(102, 0), P(102, 70), P(72, 70), P(72, 110), P(36, 110), P(36, 70), P(0, 70)],
  // Walkable area for the first-person eye: the polygon shrunk by a 10"
  // margin, expressed as a union of axis-aligned rectangles [x0, z0, x1, z1].
  walkMargin: inch(10),
  walkRects: [
    [inch(10), inch(10), inch(92), inch(60)], // main room
    [inch(46), inch(10), inch(62), inch(100)], // recess + its opening
  ],
};

export const RECESS = {
  x0: inch(36),
  x1: inch(72),
  z0: inch(70),
  z1: inch(110),
  ceiling: inch(96), // photo 49: lowered ceiling inside the recess
};

export const WALL = {
  paint: 0xb8bfbb, // gray-sage, sampled from photo 37 (lit wall left of window)
  recessPaint: 0xc4cac6, // recess walls read slightly lighter (photo 48)
  ceiling: 0xf2f2ee,
};

// Wainscot: 12 x 24 grey stone-look porcelain, running bond.
export const WAINSCOT = {
  top: inch(40),
  proud: mm(13), // tile face proud of drywall (thinset + tile)
  tileW: inch(24),
  tileH: inch(12),
  // Photo 53 / photo 13: courses are laid DOWN from the top, so grout lines
  // sit at 40, 28, 16 and 4" (bottom course is a 4" cut).
  courseOriginY: inch(4),
  // Photos 51-53: there is no separate cap piece.  The top course has a
  // factory-eased edge, showing a thin light-sand strip along the top.
  // Modelled as a 6 mm-high lip with a 4 mm 45-degree chamfer.
  capHeight: mm(6),
  capChamfer: mm(4),
  capColor: 0xc4b9a8,
  grout: 0xa9a7a3,
};

// Tub alcove (x 0..36, z 0..70).
export const ALCOVE = {
  x0: 0,
  x1: inch(36),
  tileTop: inch(85),
  // Photo 13: the wainscot-top grout line (40") runs through the alcove tile,
  // so courses share the wainscot grid; the band sits one course above (52")
  // and measures ~9" tall (220 px vs a 325 px 12" course next to it).
  bandBottom: inch(52),
  bandTop: inch(61),
  endPanelX1: inch(33), // tile panel on the z=70 end wall runs 3" past the tub
};

// Tiled column/chase at the north end of the alcove (photos 12, 26, 37, 40):
// a full-height box x 0..30, z 0..10 with a ledge, two open niches, the band
// box and a top box; drywall above the tile up to the ceiling.
export const COLUMN = {
  x0: 0,
  x1: inch(30),
  z0: 0,
  z1: inch(10),
  ledgeTop: inch(36),
  niche1: [inch(36), inch(52)], // shampoo niche on the ledge
  bandBox: [inch(52), inch(61)],
  niche2: [inch(61), inch(73)], // tissue-box niche
  topBox: [inch(73), inch(85)],
  nicheBackZ: inch(4), // niches are 6" deep
  sideWall: inch(2), // east side cheek of the niches
};

export const TUB = {
  x0: 0,
  x1: inch(30),
  z0: inch(10),
  z1: inch(70),
  rim: inch(16),
};

export const PLUMBING = {
  // on the alcove end wall z = 70, centred on the tub (photo 13)
  x: inch(15),
  head: inch(78),
  valve: inch(30), // photo 13: valve sits just below the 40" grout line
  spout: inch(21),
};

export const CURTAIN = {
  rodY: inch(81), // photo 13/26: flange on the top box, just under the 85" tile top
  rodStart: [inch(28), inch(10)], // on the column top box
  rodEnd: [inch(32), inch(70)], // on the end-wall tile panel
  rodBow: inch(7), // how far the curved rod bows out to the east
  // Photo 37 (the main reference) shows the curtain bunched at the column end.
  bunchFrom: 0.0, // fraction along the rod
  bunchTo: 0.42,
  bottom: inch(15),
  color: 0x5d5e66,
};

export const VANITY = {
  x0: inch(36),
  x1: inch(72),
  z0: 0,
  z1: inch(21),
  height: inch(35), // including the top
  topThickness: inch(1.25),
  overhangFront: inch(1),
  overhangSide: inch(0.5),
  sinkX: inch(54),
  sinkZ: inch(11.5),
  sinkW: inch(17),
  sinkD: inch(12.5),
  toeKick: inch(1.5),
};

export const CURRENT_MIRROR = {
  width: inch(24),
  height: inch(36),
  centerX: inch(54),
  bottom: inch(43), // photo 37: 2.7" above the wainscot top
};

export const CURRENT_LIGHT = {
  width: inch(24), // photo 37: bar spans the full mirror width
  centerX: inch(54),
  bottom: inch(80.5), // photo 37: ~1.5" above the mirror top
};

export const WINDOW = {
  trimX0: inch(76),
  trimX1: inch(99),
  sillTop: inch(44), // stool top (photo 53: ~3.5" above the wainscot top)
  head: inch(90), // top of head trim (photo 37: trim is ~2:1 tall)
  trimW: inch(2.5),
  sillNose: inch(1.5),
  jambDepth: inch(4.5),
  // Trim profile (src/room.js buildWindow); the full-wall accent cuts round
  // the outline these make (src/remodel/accentWall.js windowCutouts).
  casingProud: inch(0.6), // flat casing + apron, ~5/8" proud of the drywall
  stoolThick: inch(0.75), // stool (sill) board thickness, top at sillTop
  stoolHorn: inch(0.5), // stool runs this far past each casing edge
  apronH: inch(1.75), // apron height under the stool
};

export const TOILET = { centerX: inch(87.5) };

export const DOORS = {
  // Recess door, closed, hinges on the east side (photo 49: lever on the west).
  recess: { x0: inch(40), x1: inch(70), z: inch(110), height: inch(80), trim: inch(2) },
  // Second door on the east wall beside the toilet (photos 19, 20, 43):
  // hinges at the north edge, lever at the south.
  east: { z0: inch(37), z1: inch(67), x: inch(102), height: inch(80), trim: inch(2) },
  slabColor: 0x5e605d,
  trimColor: 0x8b8d8a,
};

export const MISC = {
  // photo 37: chrome ring on the drywall just east of the column
  towelRing: { x: inch(38.5), y: inch(53) },
  outlet: { x: inch(68.5), y: inch(43.5) }, // photos 37, 52, 53
  thermostat: { x: inch(77), y: inch(58) }, // photos 44, 49: z = 70 wall, east of the recess opening
  switch2: { x: inch(80), y: inch(47) },
  switch1: { z: inch(73.5), y: inch(47) }, // photo 47: recess west wall, by the jamb
  frame: { z: inch(90), y: inch(60), size: inch(16) }, // recess west wall (photos 45, 46)
  vent: { x: inch(54), z: inch(34), size: inch(10) }, // photo 38
  can: { x: inch(18), z: inch(40), dia: inch(5) }, // photos 38-40: over the tub
};

// Flat aliases read by src/remodel/cfg.js (remodelDims).
Object.assign(ROOM, {
  wainscotTop: WAINSCOT.top,
  wainscotCapHeight: WAINSCOT.capHeight,
  wainscotProud: WAINSCOT.proud,
});

// Remodel scenario defaults (section 4).  Owned by the remodel components;
// kept here so all dimensions live in one file.
export const REMODEL = {
  // Accent extent (state.accentExtent): 'vanity-strip' covers x 30..76
  // (tub-column tile edge -> window trim outer edge); 'full-wall' runs on
  // round the window to the inside corner with the east wall (x 102).
  // The vanity strip stays the reference for everything centred on the
  // vanity (sconces, mirror, pattern origin) whatever the extent.
  vanityStripX0: inch(30), // tub-column tile edge
  vanityStripX1: inch(76), // window trim outer edge
  fullWallX1: ROOM.width, // inside corner with the east wall
  accentX0: inch(30), // = vanityStripX0 (older alias; room.js splits the wainscot here)
  accentX1: inch(76), // = vanityStripX1
  accentBottom: inch(40),
  accentTopIn: 120,
  // Oval mirror centred on the sink (x = 54"), bottom 42" -> top 98".
  ovalMirror: { width: inch(23), height: inch(56), centerX: inch(54), bottomIn: 42 },
  // Ceiling fixtures (pendant / chandelier): each light option carries its
  // own default hang (fixture bottom AFF, `defaultHangBottomIn`) and distance
  // of the fixture centre off the finished wall face (`defaultFromWallIn`);
  // the "Light hang" slider jumps to them when that light is picked.  The
  // defaults hang the fixture BELOW the mirror top (98") so it reads as a
  // layer in front of the mirror from the door and shows in its reflection,
  // while its bottom stays above ~74" so a person at the sink still sees
  // their face.  Each fixture clamps itself so it never reaches the ceiling.
  lightHangRangeIn: [60, 110],
  lightFromWallRangeIn: [6, 36],
  lightCentreX: inch(54),
  // Wall sconces: the slider sets the glass centre height (default on the
  // option, `defaultMountCentreIn`).  The mirror hangs flat (no brackets), so
  // each sconce is centred in its strip of accent wall between the frame's
  // outer edge (x 42.5" / 65.5") and the accent edge (x 30" / 76"):
  // x = 36.25" and 70.75", i.e. 54 - 17.75 and 54 + 16.75.  The 4.25" glass
  // is then 4.1" / 3.1" clear of the frame and 4.1" / 3.1" inside the accent.
  sconceRangeIn: [56, 80],
  thinsetMm: 3,
  // Junction inspector anchor: the clear gap between the glass soap
  // dispenser (x 45.5") and the faucet (x 54"), on the wainscot top.
  junction: { x: inch(49.5), y: inch(40), z: 0, radius: inch(30) },
};
REMODEL.mirrorBottom = inch(REMODEL.ovalMirror.bottomIn);
REMODEL.mirrorCentreX = REMODEL.ovalMirror.centerX;
{
  // Sconce offsets from the sink centre (see the comment above), in inches.
  const toIn = (m) => m / inch(1);
  const half = toIn(REMODEL.ovalMirror.width) / 2, cx = toIn(REMODEL.lightCentreX);
  // Always the vanity strip, never the full-wall extent.
  const west = (toIn(REMODEL.vanityStripX0) + toIn(REMODEL.mirrorCentreX) - half) / 2;
  const east = (toIn(REMODEL.vanityStripX1) + toIn(REMODEL.mirrorCentreX) + half) / 2;
  REMODEL.sconceOffsetsIn = [west - cx, east - cx];
}

// Flat colours used when a texture is missing from the manifest.
export const FALLBACK_COLORS = {
  floor_plank: 0x3a3734,
  wainscot: 0x8d8884,
  accent_band: 0x4a4745,
  vanity_wood: 0x6e6660,
  quartz: 0xece9e2,
  wall_paint: WALL.paint,
  rattan: 0xb08d5e,
  wood_frame: 0x5a2e1c,
  frosted_glass: 0xdfe6ea,
  curtain: 0x5d5e66,
  tile_sage_fan: 0x8fa38a,
  tile_white_subway_stacked: 0xf4f4f2,
  wallpaper_sample: 0xc9c7b5,
  door_slab: DOORS.slabColor,
};

// Default real-world size of one texture repeat (used by the procedural
// fallbacks and when a manifest entry lacks physicalSizeM).
export const DEFAULT_TEXTURE_SIZE = {
  floor_plank: [inch(36), inch(24)], // 3 planks wide (x), one plank long (z)
  wainscot: [inch(48), inch(24)], // 2 tiles x 2 courses, half-offset bond
  accent_band: [inch(48), inch(9)],
  vanity_wood: [inch(24), inch(24)],
  quartz: [inch(24), inch(24)],
  wall_paint: [inch(48), inch(48)],
  curtain: [inch(12), inch(12)],
  door_slab: [inch(30), inch(80)],
  frosted_glass: [inch(18), inch(18)],
};

// Camera presets: eye position and look-at target (inches -> metres).
const V = (x, y, z) => [inch(x), inch(y), inch(z)];
export const PRESETS = [
  { id: 1, name: 'Door', pos: V(55, 64, 104), target: V(55, 52, 0), fov: 62 },
  { id: 2, name: 'Centre', pos: V(78, 66, 56), target: V(30, 52, 8), fov: 62 },
  { id: 3, name: 'Vanity', pos: V(56, 64, 72), target: V(56, 56, 0), fov: 62 },
  { id: 4, name: 'Mirror', pos: V(56, 62, 34), target: V(55, 60, 0), fov: 55 },
  // 13" from the wainscot top under the accent wall, in the clear gap
  // between the glass soap dispenser (x 45.5") and the faucet (x 54")
  { id: 5, name: 'Junction', pos: V(49.5, 45.5, 12.5), target: V(49.5, 40.3, 0), fov: 50 },
  { id: 6, name: 'Tub', pos: V(64, 62, 52), target: V(8, 38, 48), fov: 62 },
];

export const EYE_HEIGHT = inch(66);

export const config = {
  ROOM, RECESS, WALL, WAINSCOT, ALCOVE, COLUMN, TUB, PLUMBING, CURTAIN, VANITY,
  CURRENT_MIRROR, CURRENT_LIGHT, WINDOW, TOILET, DOORS, MISC, REMODEL,
  FALLBACK_COLORS, DEFAULT_TEXTURE_SIZE, PRESETS, EYE_HEIGHT,
};
export default config;
