// Mercury Mosaics Medium Moroccan Fish Scales, 129 Slate (MFS00129MM).  Each piece
// ~3-3/4" x 3-3/16", 1/4" thick, glossy, medium variation; handmade, 1/8" grout.
// Pitch below the dome height, so the lower domes cut the sides: flat-topped
// fans with angled corners and short spikes, as on the maker's sheet photo.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'mercury-slate-fish-scale-medium',
  name: 'Moroccan Fish Scale Medium, Slate (Mercury 129)',
  order: 32,
  thicknessMm: 6.35,
  scaleWIn: 3.9,
  pitchIn: 1.66,
  cols: 4,
  rows: 10,
  ppi: 64,
  glaze: { base: '#3c414b', light: '#464c56', dark: '#31353e' },
  variation: { spread: 0.8, offset: 0.1, mottle: 0.45, hue: 0.05, value: 0.08 },
  grout: { color: '#cfcdc6', halfIn: 0.0625 },
  bevelIn: 0.16,
  rim: { amt: 0.12, to: '#7a808a', widthIn: 0.08 },
  relief: { base: 0.25, bevel: 0.55, n1: 0.14, n2: 0.03 },
  description: 'Mercury Mosaics Medium Moroccan Fish Scales, 129 Slate (MFS00129MM), 3-3/4" x 3-3/16" pieces, 1/4" (6.35 mm), glossy, medium variation, handmade, $85/sq ft, mercurymosaics.com/products/medium-moroccan-fish-scales; almost exactly Hale Navy, a hair greyer',
});
