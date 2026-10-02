// Dev-only stand-in for src/config.js.  Only the numbers the remodel
// components read (SPEC sections 3 and 4), converted to metres.  The real
// config may use other key names; every component reads these keys through
// src/remodel/cfg.js with the same numbers as fallbacks, so integration only
// has to pass the real config (or map these keys onto it).
import { inch, mm } from './units.js';

export const ROOM = {
  width: inch(102),
  depth: inch(70),
  ceiling: inch(120),
  wainscotTop: inch(40),          // top of the bullnose cap, AFF
  wainscotCapHeight: inch(1.25),  // cap face height (cap bottom = 38.75")
  wainscotProud: mm(13),          // tile face proud of drywall (1/2")
  wainscotThinset: mm(3),         // of those 13 mm: 3 mm thinset + 10 mm tile
  vanity: { x0: inch(36), x1: inch(72), depth: inch(21), height: inch(35) },
  window: { x0: inch(74), x1: inch(98), sill: inch(42), head: inch(84) },
};

export const REMODEL = {
  accentX0: inch(36),
  accentX1: inch(74),
  accentBottom: inch(40),
  accentTop: inch(120),
  thinset: mm(3),
  mirrorCentreX: inch(55),
  mirrorBottom: inch(42),
  lightCentreX: inch(55),
  lightCentreZ: inch(11),
  junction: { x: inch(55), y: inch(40), z: 0, radius: inch(30) },
};

export default { ROOM, REMODEL };
