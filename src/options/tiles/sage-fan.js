// Daltile Handcrafted Sage Fan (photo 01): ~4" fan / fish-scale mosaic,
// muted sage-green glossy glaze with handmade variation, 10 mm thick,
// light grey grout.  Uses ctx.textures.tile_sage_fan when present; otherwise
// draws the scallops procedurally (periodic 16" x 20" repeat) with the shared
// fan factory (fanTile.js), whose defaults are this tile's numbers: 4" fans,
// 2.5" row pitch, tombstone skirt.  Output is bit-identical to the
// pre-factory generator (br-s42).
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'sage-fan',
  name: 'Sage Fan (Daltile Handcrafted)',
  order: 10,
  thicknessMm: 10,
  textureName: 'tile_sage_fan',
  scaleWIn: 4, pitchIn: 2.5, cols: 4, rows: 8, ppi: 56,
  glaze: { base: '#7d8b78', light: '#a3ad98', dark: '#5f6c5d' },
  grout: { color: '#cfcdc6' },
  edgeColor: '#8d9a86',
  description: '4" fan mosaic, glossy sage glaze, 3/8" thick',
});
