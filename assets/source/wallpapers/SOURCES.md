# Wallpaper product imagery

Manufacturer / retailer images of wallpapers the owners are considering, kept
here only for the private, local visualisation in this repo.
`tools/make_textures.py` builds the `wallpaper_*` textures from these files.
All files were downloaded on 2026-10-01 with `curl -L`, sending a browser
User-Agent and the product page as Referer. Every file is the original,
unmodified download.

## Cole & Son Feather Fan, Soft Olive (112/10037), via Perigold QWH8178

- Retail page: https://www.perigold.com/decor/pdp/cole-sons-qwh8178.html
  ("Cole & Sons Icons Feather Fan Geometric Wallpaper Roll", colour "Old Olive",
  SKU QWH8178, piid 29098963). Perigold lists it as: paper, non-pasted, pretrimmed,
  33' L x 21" W (57.75 sq ft per roll), "pattern interval 7''", "match type random".
- Maker's page: https://cole-and-son.com/products/feather-fan-roll (Icons
  collection, colourway **Soft Olive, 112/10037**): roll length 10.05 m,
  roll width 0.53 m, **pattern repeat 10.6 cm, straight match**.
- Identification: Perigold does not print the maker's reference. Its
  "Old Olive" flat image is the same artwork as Cole & Son's 112/10037 flat
  image at the same colour (mean sRGB 216,218,204 vs 215,219,203), and
  112/10037 is the only olive/green Feather Fan colourway Cole & Son sells.
- `Icons+Feather+Fan+Geometric+Wallpaper+Roll-29098963.jpg`, 1200 x 1200,
  from
  https://assets.wfcdn.com/im/46026780/resize-h1200-w1200%5Ecompr-r85/5670/56705613/Icons+Feather+Fan+Geometric+Wallpaper+Roll-29098963.jpg
  (Perigold's only gallery image; the CDN returns a placeholder for larger
  sizes). Flat, digital artwork. **This is the texture source.**
  Autocorrelation gives an exact lattice: fans 400 px wide, rows 120 px apart,
  alternate rows offset half a fan, so the rectangular repeat is
  400 x 240 px. The image holds exactly 3 x 5 such repeats. 400 : 240 equals
  (53 cm / 3) : 10.6 cm, so the image is one full roll width (53 cm) by
  5 repeats (53 cm). One fan is 17.67 cm (6.96") wide, which matches
  Perigold's 7" interval.
- `Cole_Son_Icons_FeatherFan_112-10037.jpg`, 750 x 750, from
  https://cdn.shopify.com/s/files/1/0577/0543/1226/files/Cole_Son_Icons_FeatherFan_112-10037.jpg?v=1782389409
  The maker's flat image, kept as the colour and identity reference. It has
  a lower resolution (250 px per fan), so the texture does not use it.

## Rebel Walls Ripple Blue (R19317)

- Page: https://rebelwalls.com/ripple-blue ("Ripple Blue - Wall Mural",
  SKU R19317, collection Imperfections, design by Rebel Studio, EAN 7332905048461).
  It is digitally printed to the customer's wall size. Paper "Rebel Mattic"
  (non-woven, 150 g/m², matte) in 0.5 m (19.7") panels. Peel & Stick and
  Commercial Grade (up to 1.0 m wide, 207 g/m²) options are also offered.
- The spec table lists **Horizontal Repeat: Yes, Vertical Repeat: Yes**, and the
  page data gives `customWallMural_pattern_width 1000`,
  `customWallMural_pattern_height 1200` (mm). This is a **repeating
  pattern** printed to wall size, not a one-off scene. One repeat is
  1.00 m x 1.20 m.
- `R19317_product.jpg`, 2000 x 2401, from
  https://res.rebelwalls.com/gimmersta-wallpaper/image/upload/v1/articles/R19317_product
  (the Cloudinary original, with no transformation). One full repeat at 0.5 mm/px.
  The last row duplicates the first row's neighbourhood, so the true period
  is 2400 rows. Inside it, the line drawing repeats every 500 x 300 px. The
  worn / patina overlay repeats only at the full 2000 x 2400 px.
  Arches are about 250 px = 12.5 cm (4.9") wide.

## Debona Crystal Trellis, Blue / Silver (8894), via World of Wallpaper DEB052

- Retail page (the owners' link):
  https://www.worldofwallpaper.com/us/crystal-trellis-wallpaper-blue-silver-debona-8894.html
  ("Crystal Trellis Wallpaper Blue / Silver Debona 8894", SKU DEB052). The
  page was read in Chrome on 2026-10-01. It describes a metallic silver
  fretwork trellis on a midnight-blue ground "infused with sparkling glitter
  particles", with a textured lined finish like gathered silk. "High
  quality textured wallpaper": **10.05 m x 53 cm roll, 16 cm pattern
  repeat, offset pattern match**, paste the paper, **washable**.
- Other stockists: B&Q (https://www.diy.com/departments/debona-crystal-trellis-navy-wallpaper-8894/5060119353966_BQ.prd,
  EAN 5060119353966) gives the same specs: 160 mm repeat, offset match,
  10.05 x 0.53 m, washable, 1020 g. B&Q also says "suitable for any room
  except bathrooms and kitchens". wallpapersales.co.uk says 18 cm repeat;
  the artwork measures 16 cm. Debona has no retail site of its own.
- `debona-crystal-trellis-navy-wallpaper-8894~5060119353966_01c_MP.jpg`,
  1502 x 1814, from
  https://media.diy.com/is/image/KingfisherDigital/debona-crystal-trellis-navy-wallpaper-8894~5060119353966_01c_MP?scl=1&qlt=100
  (Scene7 at native scale; `?req=imageprops` reports 1502 x 1814; Referer
  = the B&Q page). This is B&Q's flat image. **This is the texture source.**
  Its aspect ratio is 53 : 64, so it is one roll width x 4 repeats, at
  0.353 mm/px. A mask autocorrelation gives the exact period
  751 x 907 px (0.9997). Lanterns are 375.5 px = 13.25 cm wide in rows
  453.5 px = 16 cm apart, with alternate columns dropped half a row, so
  4 lanterns fill the roll width. The trellis therefore runs on across the
  strips when they are matched; a literal 8 cm half-drop would break it.
  The crinkle texture in the ground repeats with the trellis.
- `deb052_crystal_trellis_wallpaper_navy_silver_ae1.jpg`, 1200 x 1200, from
  https://www.worldofwallpaper.com/media/catalog/product/d/e/deb052_crystal_trellis_wallpaper_navy_silver_ae1.jpg
  (World of Wallpaper's flat image, the original without the Magento
  `/cache/<hash>/` path). It is the top of the same artwork scaled 0.8x
  (mask correlation 0.99 at zero offset, ground high-pass 0.98). It is
  graded lighter: silver sRGB 153 vs 116, ground 22,34,59 vs 18,27,51.
  The retailer's room scene (`..._ae2.jpg`, not kept) shows silver
  about 120, closer to B&Q, so the texture uses B&Q's colours. This file is
  kept as the identity and colour reference.

## World of Wallpaper Metro Prism, Emerald Green / Gold (WOW037)

Downloaded 2026-10-02 (same method: `curl -L`, browser User-Agent, product
page as Referer; files unmodified).

- Retail page (the owners' link):
  https://www.worldofwallpaper.com/metro-prism-geometric-triangle-wallpaper-emerald-green-and-gold-wow037.html
  ("Metro Prism Geometric Triangle Wallpaper - Emerald Green and Gold -
  WOW037", SKU WOW037, World of Wallpaper's own exclusive Metro
  collection). Read in Chrome on 2026-10-02: metallic gold geometric
  triangles on a matte emerald green background, "the metallic elements
  capture the light"; **10.05 m x 53 cm roll, 17.6 cm pattern repeat,
  offset pattern match**, paste the paper, **spongeable**. No embossing or
  texture is mentioned.
- Other stockists: B&Q sells it through World of Wallpaper
  (https://www.diy.com/departments/world-of-wallpaper-metro-prism-geometric-wallpaper-emerald-green-gold-a361-an-bur-/3294270361047_BQ.prd,
  "A361.AN-BUR", code 3294270361047): same specs (176 mm repeat, offset
  match, 10050 x 530 mm, 800 g, not paintable) and "any room, excluding
  bathroom & kitchen". Its five Scene7 images are all 1200 x 1200
  (`?req=imageprops`); image `_04c_MP` is byte-for-byte the same artwork as
  World of Wallpaper's flat (mean abs difference 0.04/255). No larger flat
  was found.
- `wow037-metro-prism-geometric-triangle-wallpaper-green-gold.jpg`,
  1200 x 1200, from
  https://www.worldofwallpaper.com/media/catalog/product/w/o/wow037-metro-prism-geometric-triangle-wallpaper-green-gold.jpg
  (the Magento original, without `/cache/<hash>/`). Flat digital artwork.
  **This is the texture source.** Zero-padded, overlap-normalised
  autocorrelation of the gold-line mask gives the lattice (dy, dx) =
  (400, 0) and (200, 300) px (0.96; the shortfall from 1.0 is a light
  sweep baked into the gold, which is darker in two corners). So the
  rectangular repeat is 600 x 400 px with two half-dropped motifs, and the
  image is 2 x 3 repeats. 400 px = 17.6 cm gives 0.44 mm/px, and
  1200 px = 52.8 cm = the roll width: the image is one roll width x three
  repeats, the "offset" match is the half drop inside the artwork, and the
  roll width is a lattice vector, so strips run on across the seams. The
  lines sit on a 150 x 100 px (6.6 x 4.4 cm) grid of star nodes and are
  about 4 px (2 mm) wide. Ground sRGB 58,89,84 everywhere; gold sRGB R
  100-150 across the image (the sweep), median 137,125,66.
- `wow037-metro-prism-geometric-triangle-wallpaper-green-gold-7.jpg`,
  1200 x 1200, same path with `-7`: the retailer's photo of the roll,
  kept as the finish reference (bright, mirror-like gold lines; under
  studio light the ground photographs more saturated than the flat). The
  other gallery images (`-2`, `-3`, `-6`, room scenes and a second roll
  photo) were not kept.
