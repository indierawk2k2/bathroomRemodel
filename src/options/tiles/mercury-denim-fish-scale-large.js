// Mercury Mosaics Large Moroccan Fish Scales, 1013 Denim (LFS01013MM): semi-transparent
// Prussian blue, glossy CRACKLE, medium variation.  5-5/8" x 5", 1/4" thick.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'mercury-denim-fish-scale-large',
  name: 'Moroccan Fish Scale Large, Denim crackle (Mercury 1013)',
  order: 34,
  thicknessMm: 6.35,
  scaleWIn: 5.8,
  pitchIn: 2.56,
  cols: 3,
  rows: 6,
  ppi: 60,
  glaze: { base: '#263746', light: '#324558', dark: '#1b2836' },
  variation: { spread: 0.85, offset: 0.08, mottle: 0.6, hue: 0.06, value: 0.12 },
  grout: { color: '#cfcdc6', halfIn: 0.0625 },
  bevelIn: 0.2,
  rim: { amt: 0.14, to: '#6f8296', widthIn: 0.1 },
  relief: { base: 0.25, bevel: 0.55, n1: 0.14, n2: 0.03 },
  crackle: { cellIn: 0.45, depth: 0.03, albedo: 0.22, widthIn: 0.012 },
  description: 'Mercury Mosaics Large Moroccan Fish Scales, 1013 Denim (LFS01013MM), 5-5/8" x 5" pieces, 1/4" (6.35 mm), glossy crackle, medium variation, $55/sq ft, mercurymosaics.com/products/large-moroccan-fish-scales; deeper, bluer and more saturated than Hale Navy',
});
