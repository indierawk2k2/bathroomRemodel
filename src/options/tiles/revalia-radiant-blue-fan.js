// Daltile Revalia Remix 3" Fan Mosaic, Radiant Blue RV33 (RV333FANMS1P2, Daltile page
// RV33FAN3GL).  Sheet 13-3/4" x 13-1/2"; the maker's flat sheet image shows 8.4 fans
// across that width, so the fan period is 1.64" (not the nominal 3"), rows 0.80"
// apart: classic fish scale.  5/16" (8 mm), glossy, V2, 1/16" grout.
// Procedural (fanTile.js); colours sampled from the maker's image, see
// assets/source/tiles/SOURCES.md.  (br-s42)
import { makeFanTile } from './fanTile.js';

export default makeFanTile({
  id: 'revalia-radiant-blue-fan',
  name: 'Revalia Remix Fan, Radiant Blue (Daltile RV33)',
  order: 31,
  thicknessMm: 8,
  scaleWIn: 1.638,
  pitchIn: 0.798,
  cols: 8,
  rows: 16,
  ppi: 80,
  glaze: { base: '#3a3e4e', light: '#44495a', dark: '#2c2f3a' },
  variation: { spread: 0.8, offset: 0.1, mottle: 0.3, hue: 0.04 },
  grout: { color: '#d6d4ce', halfIn: 0.032 },
  bevelIn: 0.09,
  rim: { amt: 0.3, to: '#8e94a3', widthIn: 0.05 },
  description: 'Daltile Revalia Remix 3" Fan Mosaic, Radiant Blue RV33 (RV333FANMS1P2), 13-3/4" x 13-1/2" sheet (fans measure ~1.6" on the maker\'s sheet image), 5/16" (8 mm), glossy V2, ~$13.50-19/sq ft retail, daltile.com/products/wall/revalia-remix/radiant-blue; a shade darker and a touch bluer than Hale Navy',
});
