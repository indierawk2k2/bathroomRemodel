// Daltile Miramo 3" Fan Undulated, Horizon MR48 (MR48FAN3MBGL).  Same body as Reef.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'miramo-horizon-fan',
  name: 'Miramo Fan Undulated, Horizon (Daltile MR48)',
  order: 42,
  thicknessMm: 6.35,
  scaleWIn: 2.96,
  pitchIn: 1.48,
  cols: 5,
  rows: 10,
  ppi: 72,
  glaze: { base: '#304e52', light: '#3e5e62', dark: '#223e47' },
  variation: { spread: 0.9, offset: 0.05, mottle: 0.5, hue: 0.08, value: 0.14, mottleTiles: 0.2, mottleDark: 0.3, mottleIn: 0.12 },
  grout: { color: '#cfcdc6', halfIn: 0.032 },
  bevelIn: 0.12,
  rim: { amt: 0.14, to: '#93aeb0', widthIn: 0.06 },
  undulate: { waveIn: 0.55, amp: 0.05 },
  description: 'Daltile Miramo 3" Fan Undulated, Horizon MR48 (MR48FAN3MBGL), 13-1/4" x 12-3/4" sheet, 1/4" (6.35 mm), glossy V3, ~$14.50/sq ft retail, daltile.com/products/mosaic/miramo/horizon; teal, much darker and bluer than the sage',
});
