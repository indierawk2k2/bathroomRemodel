// Fireclay Tile Ogee Drop, Original Ceramic Navy Blue Gloss (TT.OC.OOS.A59.G197.MA).
// 5-5/16" x 4-11/16" (spec sheet size guide; long axis vertical), 5/16" thick,
// V2, medium crazing; translucent glaze over a red clay body (warm edges).
// Shape 'ogee': round end down, pointed drop up.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'fireclay-navy-ogee-drop',
  name: 'Ogee Drop, Navy Blue Gloss (Fireclay)',
  order: 35,
  thicknessMm: 8,
  shape: 'ogee',
  scaleWIn: 4.8125,
  pitchIn: 2.85,
  domeIn: 2.85,
  cols: 4,
  rows: 6,
  ppi: 56,
  glaze: { base: '#040a17', light: '#070f20', dark: '#020610' },
  variation: { spread: 0.8, offset: 0.1, mottle: 0.4, hue: 0.08, value: 0.1 },
  grout: { color: '#cfcdc6', halfIn: 0.0625 },
  bevelIn: 0.2,
  rim: { amt: 0.22, to: '#5a3a30', widthIn: 0.07 },
  crackle: { cellIn: 0.35, depth: 0.025, albedo: 0.0, widthIn: 0.01 },
  description: 'Fireclay Tile Ogee Drop, Navy Blue Gloss (TT.OC.OOS.A59.G197.MA), 5-5/16" x 4-11/16", 5/16" (8 mm), gloss, V2, medium crazing, $48/sq ft, fireclaytile.com/products/original-ceramic-gloss-navy-blue-tile-ogee-drop; far darker than Hale Navy, almost ink',
});
