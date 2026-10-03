// Daltile Miramo 3" Fan Undulated, Reef MR49 (MR49FAN3MBGL / MR49FAN3MBMSGL).
// 3" fans (4.5 per 13-1/4" sheet on the maker's image), rows 1.5" apart, 1/4"
// thick, glossy, V3 high variation (some fans fired dark and speckled), wavy face.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'miramo-reef-fan',
  name: 'Miramo Fan Undulated, Reef (Daltile MR49)',
  order: 41,
  thicknessMm: 6.35,
  scaleWIn: 2.96,
  pitchIn: 1.48,
  cols: 5,
  rows: 10,
  ppi: 72,
  glaze: { base: '#4f6558', light: '#607565', dark: '#405147' },
  variation: { spread: 0.9, offset: 0.05, mottle: 0.5, hue: 0.08, value: 0.14, mottleTiles: 0.2, mottleDark: 0.3, mottleIn: 0.12 },
  grout: { color: '#cfcdc6', halfIn: 0.032 },
  bevelIn: 0.12,
  rim: { amt: 0.14, to: '#a9b8aa', widthIn: 0.06 },
  undulate: { waveIn: 0.55, amp: 0.05 },
  description: 'Daltile Miramo 3" Fan Undulated, Reef MR49 (MR49FAN3MBGL), 13-1/4" x 12-3/4" sheet, 1/4" (6.35 mm), glossy V3, ~$14.50/sq ft retail, daltile.com/products/mosaic/miramo/reef; a deeper, bluer green than the sage, about two shades darker',
});
