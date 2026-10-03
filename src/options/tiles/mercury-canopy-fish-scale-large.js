// Mercury Mosaics Large Moroccan Fish Scales, 512 Canopy (LFS00512MM): jade green with
// dark speckles, glossy, medium variation.  5-5/8" x 5", 1/4" thick.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'mercury-canopy-fish-scale-large',
  name: 'Moroccan Fish Scale Large, Canopy (Mercury 512)',
  order: 43,
  thicknessMm: 6.35,
  scaleWIn: 5.8,
  pitchIn: 2.56,
  cols: 3,
  rows: 6,
  ppi: 60,
  glaze: { base: '#304c41', light: '#395649', dark: '#284138' },
  variation: { spread: 0.8, offset: 0.1, mottle: 0.4, hue: 0.05, value: 0.08, speckle: 0.015 },
  grout: { color: '#cfcdc6', halfIn: 0.0625 },
  bevelIn: 0.2,
  rim: { amt: 0.12, to: '#7f9488', widthIn: 0.1 },
  relief: { base: 0.25, bevel: 0.55, n1: 0.14, n2: 0.03 },
  description: 'Mercury Mosaics Large Moroccan Fish Scales, 512 Canopy (LFS00512MM), 5-5/8" x 5" pieces, 1/4" (6.35 mm), glossy, medium variation, speckled, $55/sq ft, mercurymosaics.com/products/large-moroccan-fish-scales; jade green, far deeper than the sage',
});
