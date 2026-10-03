// TileBar Nabi Fish Scale Midnight Blue Green 3x4 crackled glossy glass mosaic
// (FXBRQFNMB).  3" x 4" pointed scales with feather ribs pressed into the face,
// 9.05" x 12.79" sheet, 11.5 mm thick.  Shape 'pointed': gothic-arch dome.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'nabi-midnight-blue-fishscale',
  name: 'Nabi Fish Scale 3x4 glass, Midnight Blue (TileBar)',
  order: 36,
  thicknessMm: 11.5,
  shape: 'pointed',
  scaleWIn: 3.3,
  domeIn: 2.6,
  pitchIn: 2.0,
  cols: 5,
  rows: 8,
  ppi: 64,
  finish: 'glass',
  glaze: { base: '#020e0d', light: '#041514', dark: '#010707' },
  variation: { spread: 0.8, offset: 0.1, mottle: 0.3, hue: 0.06 },
  grout: { color: '#d4d0c8', halfIn: 0.0625 },
  bevelIn: 0.14,
  rim: { amt: 0.25, to: '#8fa5a1', widthIn: 0.05 },
  ribs: { count: 100, amp: 0.1, albedo: 0.4, color: '#7e9792' },
  crackle: { cellIn: 0.3, depth: 0.01, albedo: 0.0, widthIn: 0.008 },
  glassEdge: 0.35,
  description: 'TileBar Nabi Fish Scale Midnight Blue Green 3x4" crackled glossy glass (FXBRQFNMB), 3" x 4" scales on a 9.05" x 12.79" sheet, 11.5 mm, feather-ribbed face, $34.95/sq ft, tilebar.com/product/nabi-midnight-blue-3x4-fishscale-polished-glass-mosaic-tile.html; much darker than Hale Navy and blue-green rather than navy',
});
