# Fan / fish-scale tile references (br-s42)

One reference image per product, downloaded unmodified (curl, browser
User-Agent, product page as Referer) on 2026-10-02. The tiles are drawn
procedurally by `src/options/tiles/fanTile.js`. These images supply the
**glaze colour** and the **geometry check** only. No texture-pack maps are
built from them.

**Colour sampling** (`sample.py` in the br-s42 scratchpad; the method is
written out here so it can be repeated):
1. Keep pixels darker than L 0.55 that are not near-neutral (sat < 0.06 and
   L > 0.3). This drops the white background and the light grout.
2. Drop the darkest 3 % (gaps and shadow) and the brightest 8 % (specular
   highlights).
3. Take the **median** per channel. `light` and `dark` are the mean colours of
   the 75–90th and 10–25th luminance bands.

The generator's own `glaze` hexes are then scaled per channel, so that the
median of the drawn face equals the photo median. This is the "rendered
median" column, measured in node on the generated albedo.

| file | product | page / image URL | photo median | light | dark | rendered median |
|---|---|---|---|---|---|---|
| `daltile-revalia-rv33-radiant-blue-3in-fan.jpg` (999x964) | Daltile Revalia Remix 3" Fan Mosaic, Radiant Blue RV33 (RV333FANMS1P2; Daltile page lists RV33FAN3GL) | https://www.daltile.com/products/wall/revalia-remix/radiant-blue — https://s7d9.scene7.com/is/image/daltile/DAL_RV33_3_Fan_Msc_RadiantBlue?scl=1&fmt=jpg&qlt=100 | `#3f4454` | `#464c5c` | `#343847` | `#3f4454` |
| `mercury-medium-fish-scales-129-slate.jpg` (2000x1500) | Mercury Mosaics Medium Moroccan Fish Scales, 129 Slate (MFS00129MM) | https://mercurymosaics.com/products/medium-moroccan-fish-scales — https://cdn.shopify.com/s/files/1/2440/8571/files/Slate_Medium_Fish_Scales_fe9ec552-f10f-4d9a-b8ef-2c060bba2c26.jpg?v=1767977963 | `#414751` | `#484f57` | `#3a404a` | `#414752` |
| `mercury-large-fish-scales-129-slate.jpg` (2000x1500) | Mercury Mosaics Large Moroccan Fish Scales, 129 Slate (LFS00129MM) | https://mercurymosaics.com/products/large-moroccan-fish-scales — https://cdn.shopify.com/s/files/1/2440/8571/files/Slate_Large_Fish_Scales_fc5333f7-8fbb-45be-91ee-02e973fe5cec.jpg?v=1767977516 | `#484c59` | `#505460` | `#414451` | `#484c59` |
| `mercury-large-fish-scales-1013-denim.jpg` (1356x1017) | Mercury Mosaics Large Moroccan Fish Scales, 1013 Denim (LFS01013MM) | same page — https://cdn.shopify.com/s/files/1/2440/8571/files/LFS-1013-Denim-Sheet_678x678_2x.progressive_cca154fd-5d5b-4c7e-8654-593d24133b6c.jpg?v=1767736598 | `#2c3e4e` | `#374a5e` | `#213041` | `#2c3e4e` |
| `fireclay-ogee-drop-navy-blue-gloss.jpg` (1006x566) | Fireclay Tile Ogee Drop, Original Ceramic Navy Blue Gloss (TT.OC.OOS.A59.G197.MA) | https://www.fireclaytile.com/products/original-ceramic-gloss-navy-blue-tile-ogee-drop — https://cdn.shopify.com/s/files/1/0971/1596/3695/files/d6f8993fe68dc33f0356c79244df1985517cf046_navy_blue_ogee_drop_composition_rendering69c3125f8274c9.64369981.jpg?v=1774415511 | `#060d1c` | `#080f1e` | `#050b1a` | `#060d1c` |
| `tilebar-nabi-fish-scale-midnight-blue.jpg` (1200x1200) | TileBar Nabi Fish Scale Midnight Blue Green 3x4" crackled glossy glass (FXBRQFNMB) | https://www.tilebar.com/product/nabi-midnight-blue-3x4-fishscale-polished-glass-mosaic-tile.html — https://www.tilebar.com/media/catalog/product/5/-/5-p-fxbrqfnmb.jpg | `#071716` | `#223332` (ribs) | `#010c0c` | `#0c1a18` (ribs added on top) |
| `daltile-miramo-mr49-reef-fan.jpg` (1600x1569) | Daltile Miramo 3" Fan Undulated, Reef MR49 (MR49FAN3MBGL; retail MR49FAN3MBMSGL) | https://www.daltile.com/products/mosaic/miramo/reef — https://s7d9.scene7.com/is/image/daltile/DAL_MR49_Fan_Msc_Reef_Silo_01_web?wid=1600&fmt=jpg&qlt=90 | `#556b5c` | `#617564` | `#495b51` | `#556b5c` |
| `daltile-miramo-mr48-horizon-fan.jpg` (1600x1579) | Daltile Miramo 3" Fan Undulated, Horizon MR48 (MR48FAN3MBGL) | https://www.daltile.com/products/mosaic/miramo/horizon — https://s7d9.scene7.com/is/image/daltile/DAL_MR48_Fan_Msc_Horizon_Silo_01_web?wid=1600&fmt=jpg&qlt=90 | `#355558` | `#416263` | `#26454a` | `#355558` |
| `mercury-large-fish-scales-512-canopy.jpg` (2000x1500) | Mercury Mosaics Large Moroccan Fish Scales, 512 Canopy (LFS00512MM) | Mercury large page — https://cdn.shopify.com/s/files/1/2440/8571/files/Canopy_Large_Fish_Scales.jpg?v=1767648715 | `#355145` | `#3a5548` | `#314c41` | `#355145` |
| `fireclay-ogee-drop-evergreen-gloss.jpg` (1067x600) | Fireclay Tile Ogee Drop, Original Ceramic Evergreen Gloss (TT.OC.OOS.A59.G198.MA) | https://www.fireclaytile.com/products/original-ceramic-gloss-evergreen-tile-ogee-drop — https://cdn.shopify.com/s/files/1/0971/1596/3695/files/face663805857c436820e0f7e66b9fb21eafe363_evergreen_ogee_drop_composition69c31112cb5ed6.88268245.jpg?v=1774415684 | `#1c382a` | `#254536` | `#172d22` | `#1c382a` |

## Specs as found (2026-10-02)

- **Revalia Remix 3" Fan, RV33.** The Daltile page lists 5/16" thick,
  nominal 3, glossy, V2, and a 1/16" grout joint. The 2021 Daltile sales sheet
  gives a 13-3/4" x 13-1/2" sheet (and 1/4" thick). Retail (getfloorsonline)
  is $13.53/sq ft on sale, $19.21 regular.
  **Scale is measured, not nominal.** Autocorrelation of the flat sheet image
  gives a fan period of 119 px and a row pitch of 58 px across 999 px = 13-3/4".
  That is a **1.64" fan period, 0.80" rows**. The room scenes (fans about 1.5x
  the tub-filler riser) agree. The nominal "3"" does not match the maker's
  own sheet image, so check a real sheet.
- **Mercury Medium / Large Moroccan Fish Scales.** Pieces are about
  3-3/4" x 3-3/16" and 5-5/8" x 5", both 0.25" thick, handmade. Prices are
  $85/sq ft (medium) and $55/sq ft (large); large sheets are 0.93 sq ft.
  Glazes: Slate is "dark blue with grey undertones", glossy, medium variation.
  Denim is a "semi-transparent Prussian blue", glossy crackle, medium variation.
  Canopy is "jade-green with speckles", glossy, medium variation.
- **Fireclay Ogee Drop.** The Original Ceramic spec sheet
  (https://assets.fireclaytile.com/resources/FireclayTile-Original-Ceramic-SpecSheet.pdf)
  gives:
  - size 5-5/16" x 4-11/16", 9 pieces/sq ft at a 3/16" joint;
  - thickness about 5/16";
  - Navy Blue Gloss: V2, crackle Medium;
  - Evergreen Gloss: V3, crackle Medium.

  Both are $48/sq ft and made to order. The glaze is translucent over a red
  clay body, so the edges read warm.
- **TileBar Nabi Fish Scale Midnight Blue Green 3x4.** 9.05" x 12.79" sheet
  (0.8 sq ft), 11.5 mm thick, glass, "crackled glossy". The face is pressed
  with radial feather ribs that read pale on the crests. $27.96 per sheet,
  $34.95/sq ft.
- **Miramo Fan Undulated, MR49 Reef / MR48 Horizon.** The Daltile pages give
  1/4" thick, nominal 3, glossy, V3 High. Retailers list a 13-1/4" x 12-3/4"
  sheet. On the sheet image the fans are 2.96" with 1.50" rows, which matches 3".
  Retail is about $14.56/sq ft (getfloorsonline).
