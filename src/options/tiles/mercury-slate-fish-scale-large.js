// Mercury Mosaics Large Moroccan Fish Scales, 129 Slate (LFS00129MM).  Each piece
// ~5-5/8" x 5", 1/4" thick, glossy, medium variation; 0.93 sq ft sheets, 1/8" grout.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'mercury-slate-fish-scale-large',
  name: 'Moroccan Fish Scale Large, Slate (Mercury 129)',
  order: 33,
  thicknessMm: 6.35,
  scaleWIn: 5.8,
  pitchIn: 2.56,
  cols: 3,
  rows: 6,
  ppi: 60,
  glaze: { base: '#434654', light: '#4e515f', dark: '#383a47' },
  variation: { spread: 0.8, offset: 0.1, mottle: 0.45, hue: 0.05, value: 0.08 },
  grout: { color: '#cfcdc6', halfIn: 0.0625 },
  bevelIn: 0.2,
  rim: { amt: 0.12, to: '#7a808a', widthIn: 0.1 },
  relief: { base: 0.25, bevel: 0.55, n1: 0.14, n2: 0.03 },
  description: 'Mercury Mosaics Large Moroccan Fish Scales, 129 Slate (LFS00129MM), 5-5/8" x 5" pieces, 1/4" (6.35 mm), glossy, medium variation, handmade, $55/sq ft, mercurymosaics.com/products/large-moroccan-fish-scales; reads as Hale Navy at the larger scale',
});
