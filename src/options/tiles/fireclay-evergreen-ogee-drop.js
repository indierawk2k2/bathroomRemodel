// Fireclay Tile Ogee Drop, Original Ceramic Evergreen Gloss (TT.OC.OOS.A59.G198.MA).
// 5-5/16" x 4-11/16", 5/16" thick, V3, medium crazing, red clay body.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'fireclay-evergreen-ogee-drop',
  name: 'Ogee Drop, Evergreen Gloss (Fireclay)',
  order: 44,
  thicknessMm: 8,
  shape: 'ogee',
  scaleWIn: 4.8125,
  pitchIn: 2.85,
  domeIn: 2.85,
  cols: 4,
  rows: 6,
  ppi: 56,
  glaze: { base: '#183124', light: '#203e30', dark: '#11261b' },
  variation: { spread: 0.85, offset: 0.08, mottle: 0.55, hue: 0.08, value: 0.14 },
  grout: { color: '#cfcdc6', halfIn: 0.0625 },
  bevelIn: 0.2,
  rim: { amt: 0.2, to: '#4f6b55', widthIn: 0.07 },
  crackle: { cellIn: 0.35, depth: 0.025, albedo: 0.1, widthIn: 0.01 },
  description: 'Fireclay Tile Ogee Drop, Evergreen Gloss (TT.OC.OOS.A59.G198.MA), 5-5/16" x 4-11/16", 5/16" (8 mm), gloss, V3, medium crazing, $48/sq ft, fireclaytile.com/products/original-ceramic-gloss-evergreen-tile-ogee-drop; very dark forest green, much darker than the sage',
});
