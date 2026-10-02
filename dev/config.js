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
  wainscotTop: inch(40),          // top of the wainscot (eased edge), AFF
  wainscotCapHeight: mm(6),       // eased light-sand lip on the top course (no separate cap)
  wainscotProud: mm(13),          // tile face proud of drywall (1/2")
  wainscotThinset: mm(3),         // of those 13 mm: 3 mm thinset + 10 mm tile
  vanity: { x0: inch(36), x1: inch(72), depth: inch(21), height: inch(35) },
  window: { x0: inch(76), x1: inch(99), sill: inch(44), head: inch(90) },
};

export const REMODEL = {
  accentX0: inch(30),
  accentX1: inch(76),
  accentBottom: inch(40),
  accentTop: inch(120),
  thinset: mm(3),
  mirrorCentreX: inch(54),
  mirrorBottom: inch(42),
  lightCentreX: inch(54),
  lightCentreZ: inch(11),
  junction: { x: inch(49.5), y: inch(40), z: 0, radius: inch(30) },
};

export default { ROOM, REMODEL };
