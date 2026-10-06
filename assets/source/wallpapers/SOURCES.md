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

## Heroad peel-and-stick gold chevron, dark green (eBay 168714908980 / Amazon B0CF5HCQ69)

Read and downloaded 2026-10-02.

- eBay listing (the owners' link): https://www.ebay.com/itm/168714908980
  "Peel and Stick Wallpaper Dark Green and Gold Wallpaper Geometric
  Wallpaper Dark", seller **roy-more** (CARVAJAL STORE, 99.6% positive,
  Tampa, Florida), condition **New**, **US $10.11 each** (2 for $9.91
  each), **2 available**, free 2-3 day shipping, 30-day returns. Item
  specifics: Brand "Does not apply"; Room Type Bedroom; Unit Count / Coverage
  9.36 sq ft; Number of Packs 1; Number of Items 1; Color Dark Green and
  Gold; Style Name / Style Modern; Theme Geometric; Material (Type)
  Polyvinyl Chloride; Item Weight 0.24 kg; Item Dimensions L x W
  78.7" L x 17.3" W; Installation Type Self-Adhesive; Application Method
  Direct Application; Type Does not apply; UPC 7445049618626; Country of
  Origin China. "Last updated on Oct 02, 2026".
- Seller's description (https://itm.ebaydesc.com/itmdesc/168714908980):
  title "... Contact Paper Self Adhesive Removable Wallpaper for Cabinets
  Thicken Vinyl 78.7"X17.3"" and "Heroad brand is committed to ...".
  17.3" x 78.7" per roll (1.44' x 6.5'), 9.36 sq ft; dark green and gold
  geometric pattern "arranged regularly like a herringbone"; "the gold
  part of the wallpaper surface has a slight luster"; faux vinyl / PVC,
  self-adhesive, **waterproof (but not for bathroom use)**, indoor, smooth
  flat surfaces. **No pattern repeat or match is given.**
- Identification: the same title, text and photos are Amazon
  https://www.amazon.com/dp/B0CF5HCQ69 ("Heroad Peel and Stick Wallpaper
  Dark Green and Gold ... Thicken Vinyl 78.7"x17.3"", "Visit the Heroad
  Store"); eBay's nine photos are Amazon's nine with a shipping badge
  added. Heroad is the maker; it publishes nothing else.
- eBay image URLs (all `s-l1600`; returned at 1500 px or less):
  i.ebayimg.com/images/g/{8cIAAeSwj8Fqs~yM, ~CUAAeSw7k1qs~yN,
  9LcAAeSwnR1qs~yO, ZYoAAeSwGB1qs~yP, ~EwAAeSw7k1qs~yQ, CMQAAeSwrvBqs~yR,
  CP0AAeSwrgBqs~yS, aAwAAeSwkfhqs~yT, 2mgAAeSwsABqs~yU}/s-l1600.jpg.
  Amazon originals (no size suffix):
  m.media-amazon.com/images/I/{81d7FAqKJUL, 815l9LOE+iL, 81ZBwuoPu6L,
  81epgy27nUL, 71y+YWWVpRL, 71zXryPBs3L, 81QnLa5B5IL, 91JMBEZHcIL,
  71nRejWWLKL}.jpg, Referer the Amazon page.
- **There is no flat image.** Every photo is a roll close-up or a room
  scene. Kept here:
  - `ebay-168714908980-8cIAAeSwj8Fqs~yM-s-l1600.jpg`, 1500 x 1500: eBay's
    main photo (roll on a sheet, with the badge), the identity reference.
    (eBay names every image `s-l1600.jpg`, so the item number and image
    id are prefixed.)
  - `81ZBwuoPu6L.jpg`, 1874 x 2560: the dining-room scene. Its wall is a
    flat, front-on composite. **This is the texture source.** Crop x
    420-1860, y 20-1380. Gold-line coverage (R - B) autocorrelation:
    rectangular period 241.72 x 156.07 px (0.95-0.98 out to 5 periods)
    plus a half lattice vector (78, 121): columns of four nested chevrons,
    alternate columns dropped half a repeat. Ground sRGB 15,35,33, gold
    129,114,69.
  - `81epgy27nUL.jpg`, 1600 x 1600: four close-ups; the "Easy to cut"
    panel shows the backing's 1 cm cutting grid (5 / 10 cm / 15 labels)
    next to the front. The nested chevrons there are ~3.2-3.4 cm apart
    (perspective makes this approximate). The close-ups also show the
    PVC's fine embossed grain and the lines' slight metallic luster.
  - `91JMBEZHcIL.jpg`, 1934 x 2499: the living-room scene, the same
    lattice (ratio 1.55) at 216 x 139 px; against a ~75 cm sofa back the
    chevrons are ~3.5 cm apart.
- Scale chosen: two rectangular repeats per 44 cm roll width
  (0.22 x 0.142 m, chevrons 3.55 cm apart), which agrees with both
  estimates and keeps the lattice continuous across the strips. **It is an
  estimate, about +/-10%**; the seller would have to confirm the repeat.

## Six navy trellis / geometric papers (br-cru)

Read and downloaded 2026-10-02 (same method: `curl -L`, browser User-Agent,
product page as Referer; files unmodified, except that Spoonflower's swatch,
served as JPEG data under a `.png` name, was saved with a `.jpg` extension).
Specs were read from each page's HTML (and the Shopify product JSON,
`<handle>.js`, for York and Wallpaper Warehouse) and, for Spoonflower and
Schumacher, in Chrome. "Hale Navy" is Benjamin Moore HC-154, #434B56, the
paint option. Lattices were measured with the zero-padded,
overlap-normalised autocorrelation of each image's normalised luminance,
refined with a parabolic fit (recipe step 9).

### Chesapeake (York) Quelala Ring Ogee, Navy (3122-11002)

- Page: https://yorkwallcoverings.com/products/chesapeake-quelala-ring-ogee-wallpaper
  ("Chesapeake Quelala Ring Ogee Wallpaper", York Wallcoverings, book
  Flora & Fauna; colourways Black, Coral, Green, Navy, Yellow). Navy
  variant 3122-11002: "Large white circles form an interlocking chain
  against a variegated navy backdrop"; **"Prepasted acrylic coated paper
  material", "10.5-in repeat, straight match", "Washable and strippable",
  "20.5-in by 33-ft long roll"**, covers about 56.4 sq ft. **$110.00 per
  double roll** (20.5 in x 33.0 ft); sample $5.99. No bathroom wording.
- `york-chesapeake-quelala-ring-ogee-navy-3122-11002-1.jpg`, 1800 x 1800,
  from https://cdn.shopify.com/s/files/1/1000/3831/2247/files/3122-11002-1.jpg
  (the Navy flat). **Texture source.** Autocorrelation: (0, 450) px 0.994,
  (916.06, 0) px 0.992; the half-drop near-copies (457, +-225) reach only
  0.75 (the distressed ring edges differ), so the exact repeat is
  450 x 916 px. 916 px = 10.5" gives 87.2 px/in, and the 1800 px width =
  4 x 450 px = 20.6": the image is one roll width x ~2 repeats. The four
  copies across are averaged and upscaled 2x (900 x 1832 px);
  physicalSizeM = (10.5" x 450/916, 10.5") = 0.131 x 0.2667 m (pixel
  aspect kept; 4 rings = 20.6" vs the 20.5" roll, 0.6 %). Ground
  (variegated) median #3C5670: bluer and a little lighter than Hale Navy;
  rings sRGB 247,246,244.
- `3122-11002-3.jpg` on the same CDN is a "How much wallpaper?" chart (not
  kept).

### Schumacher Imperial Trellis II, Ivory / Navy (5005801)

- Page: https://schumacher.com/catalog/products/5005801 ("Imperial Trellis
  II - Ivory / Navy", Print Happy collection; also as fabric 174411). Spec
  table: Pretrim y, Pre-Pasted n, **Substrate Paper**, Flame ASTM E84
  Class A, made and finished in the USA, **Care "washable"**, **27.0" x
  162.0" roll (4.5 yd), 60.75 sq ft, Horizontal Repeat 6.75", Vertical
  Repeat 12.625" (32 cm), Match STRAIGHT**, priced by single roll. **No
  price is shown** without a trade sign-in (`priceUsd` null).
- `schumacher-imperial-trellis-ii-ivory-navy-5005801-hd.jpg`, 1200 x 1200,
  from https://cdn-webassets.schumacher.com/catalog/hd/5005801.jpg (the
  largest size served; `xl/` and `original/` 404, the S3 original is
  800 px). **Texture source.** Lattice (dy, dx) = (629.82, 0.65) and
  (-0.46, 306.70) px (0.984 / 0.985), slightly sheared. With 12.625" =
  629.8 px the image is 24.0" square at 49.9 px/in, and the horizontal
  period is **6.15", not the listed 6.75"** (cell ratio 2.05 vs the
  listed 1.87). The maker's front-on room photo `hd/5005801-1.jpg` gives
  the same 2.03 : 1 cell (133 x 269 px), so the artwork's aspect is right
  and the listing's horizontal figure is not. The texture keeps the
  artwork's aspect and takes its scale from the vertical repeat:
  0.1562 x 0.3207 m. The 3 copies across are resampled onto an exact
  630 x 307 grid (`lattice_mean`, bilinear) and averaged; the ivory
  coverage is upscaled 3x (921 x 1890 px), re-sharpened and drawn in the
  median ivory sRGB 245,237,224 on the median navy #32415E (darker and
  bluer than Hale Navy).

### Spoonflower "Traditional Geometric Trellis White on Navy Blue" (design 15299902)

- Page: https://www.spoonflower.com/en/wallpaper/15299902 (design by
  allisonrichardson; curl gets 403, read in Chrome). "A timeless classic,
  navy blue and white trellis pattern". **Paper width 24 inches, lengths
  1, 3, 6, 9 or 12 ft, design vertical repeat 6 inches.** Types offered:
  Peel and Stick (default; "100% paper with a woven linen texture"),
  Pre-Pasted, Traditional, PVC-Free Type II, **Vinyl**, Grasscloth, Gold
  and Silver Metallic. **$96.75 per panel** (peel and stick, default size,
  25 % off $129.00). The page's type selector did not respond in the
  automated browser, so the Vinyl type's own care text could not be read;
  the owners' brief says Spoonflower lists vinyl for bathrooms, and the
  option models that substrate.
- `spoonflower-15299902-traditional-geometric-trellis-white-on-navy-l.jpg`,
  400 x 400 (JPEG data), from
  https://img.spoonflower.com/c/15299902/p/f/l/oryUjEALc6AFD2yU2BU5XsFRwjXhR3I4C3fW7g9Fba57ihZhC9NUf7M/15299902.png
  **Texture source.** Every other size key (`m`, `xl`, `xxl`, `h`, `o`,
  `?w=2880`) returns the same or a smaller file; the page's 1024 px images
  (`/i/l/...`) are roll and room mock-ups at ~25 px/in, not kept.
  Autocorrelation: exact square lattice (0, 262) and (262, 0) px at
  0.9997, plus a (131, 131) centring vector at 0.90 (the over/under
  interlace differs), so one 6" repeat = 262 px (43.7 px/in) and four fit
  the 24" panel (the mock-ups show four crosses across).
- **Rebuilt at 4x, not traced:** the swatch's single full 262 x 262 repeat
  (top-left) is converted to white-line coverage (normalised luminance
  between the 30th and 90th percentiles), upscaled 4x with a wrap-padded
  Lanczos, re-thresholded (smoothstep 0.35-0.65) and softened by a 0.7 px
  blur, then drawn in the swatch's median white (#FCFEFE) on its median
  navy (#3B5272: bluer and a little lighter than Hale Navy). Result
  1048 x 1048 px for 0.1524 m (0.145 mm/px). Edges are crisp but keep the
  swatch's slight stair-stepping at one source pixel (0.58 mm); the
  geometry is the swatch's, not redrawn vectors.

### Arthouse Orson Navy Trellis (AH909702)

- Page: https://wallpaperwarehouse.com/products/brewster-orson-navy-trellis-wallpaper-ah909702
  ("Orson Navy Trellis by Arthouse ... Brewster Home Fashions AH909702"):
  "crisp white linework over a rich navy ground"; **printed on paper,
  unpasted, 20.9" x 33 ft (57.5 sq ft), "20.9-inch repeat with a straight
  match", made in Poland, "spongeable and wet removable"**, paste the
  paper. **$25.00 per roll.** No bathroom wording.
- `arthouse-orson-navy-trellis-AH909702.jpg`, 1800 x 1800, from
  https://cdn.shopify.com/s/files/1/0621/3605/7898/files/AH909702.jpg.
  **Texture source.** The image is one roll width x one 20.9" repeat
  (86.1 px/in). Inside it the linework repeats exactly every (0, 300) and
  (600, 0) px (0.995 / 0.999), i.e. 3.48" x 6.97": the 6 x 3 = 18 copies
  are averaged, upscaled 3x, re-sharpened and drawn in the median line
  colour sRGB 209,212,198 on the median navy #3A495C (very close to Hale
  Navy, a touch bluer). Texture 900 x 1800 px = 0.0885 x 0.177 m. The
  detail photos (`AH909702_Detail.jpg`, `_Detail2.jpg`, not kept) show
  matte off-white lines; the owners asked for them to read lightly
  metallic silver, so the lines carry metalness 0.25 / roughness 0.45
  (an interpretation, not the retailer's wording).

### York Graceful Geo, Navy / Silver (MD7174)

- Page: https://yorkwallcoverings.com/products/graceful-geo-wallpaper
  (book Antonina Vella Modern Metals Second Edition; Navy/Silver variant
  MD7174): "Sinuous recurve lines and diamonds construct a romantic
  geometric of burnished, weathered metallic ... shown in navy with deep
  silver metallic"; **"Unpasted non woven material", "25.2-in repeat,
  straight match", "Washable and strippable", "27-in by 26.9-ft long
  roll"**, about 60.5 sq ft. **$290.00 per double roll**; sample $5.99.
  No bathroom wording.
- `york-graceful-geo-navy-silver-MD7174.jpg`, 1800 x 1682, from
  https://cdn.shopify.com/s/files/1/1000/3831/2247/files/MD7174.jpg (the
  sample image `MD7174SAM.jpg` is byte-identical). **Texture source.**
  1800 px = 27" (66.7 px/in) and 25.2" = 1680 px: the last two rows
  repeat rows 0-1 (mean abs difference 0.015 vs 0.08-0.17 for other
  rows), so the image is one roll width x one repeat and the texture is
  its 1800 x 1680 crop, unchanged (0.6858 x 0.6401 m). Across it the
  ribbons repeat every 450 px = 6.75" (0.96 only: the weathered texture in
  the metal differs between copies, so they are not averaged). No light
  sweep: silver median sRGB 163 in every 450 px block. Ground median
  #394A5E (close to Hale Navy, a touch bluer); silver ~161,166,163.

### A-Street Prints Livia Dark Blue Trellis (4014-26411)

- Page: https://wallpaperwarehouse.com/products/livia-dark-blue-trellis-wallpaper
  ("Livia Dark Blue Trellis Wallpaper with Metallic Silver Geometric
  Bohemian Pattern - A-Street Prints 4014-26411", book Seychelles): "The
  white geometric frame is accented with lines of metallic silver, all
  richly offset by a deep blue backdrop"; **"Unpasted non woven
  material", "10.4-in repeat, straight match", "Washable and strippable",
  "20.5-in by 33-ft long roll"**, about 56.4 sq ft. **$162.00 per roll.**
  No bathroom wording.
- `a-street-livia-dark-blue-trellis-4014-26411.jpg`, 1770 x 1800, from
  https://cdn.shopify.com/s/files/1/0621/3605/7898/files/4014-26411.jpg.
  **Texture source.** Exact lattice (0, 885) and (900, 0) px (0.997), with
  a (450, 442.5) near-copy at 0.85: the image is one roll width (20.5" at
  86.3 px/in) x two repeats (900 px = 10.42"). The 4 copies are averaged
  and upscaled 2x (1770 x 1800 px = 0.2603 x 0.2642 m), keeping the
  maker's three colours. Ground median #33536A (bluer and more saturated
  than Hale Navy); white bands ~240,242,237; the "metallic silver" lines
  print as neutral grey ~158,166,163. Metalness is on the silver only:
  neutral mid-grey pixels (not blue like the ground, darker than the
  white). The detail photo (`4014-26411_Detail.jpg`, not kept) shows the
  silver lines along both edges and the middle of each white band.

### Chesapeake Tap Root Dark Blue Floral Damask (4169-27600)

- Page (owner's link): https://totalwallcovering.com/p122666/tap-root-dark-blue-floral-damask-wallpaper.aspx
  ("4169-27600 Tap Root Dark Blue Floral Damask Wallpaper"; `curl` gets
  403, read in Chrome): pattern 4169-27600, book "Oak & Moss by
  Chesapeake", design studio Chesapeake (a Brewster brand); "Clusters of
  wildflowers arch upwards to form the chic scallops of this charming
  damask design", inks aqua, beige, sky blue, taupe and cream on "a dark
  blue backdrop imbued with linen detailing"; **"an unpasted, non woven
  wallpaper measuring 20.5 inches wide by 33 feet long"**, 56.38 sq ft;
  **Repeat Length 20.86, Match: StraightMatch**; attributes
  **"Strippable", "Washable", "Unpasted"**. **$102.00 sale ($120.00
  regular) per roll** seen 2026-10-02. No metallic wording, no bathroom
  wording.
- Maker's page: https://www.brewsterwallcovering.com/4169-27600-tap-root-dark-blue-floral-damask-wallpaper
  (brand Chesapeake, collection Oak & Moss, sold as a double roll, USD
  $120): Material Non Woven, Installation Unpasted, **Repeat 10.25"**,
  Match Straight, Roll Width 20.5", Roll Length 33', Washability
  "Washable", Removability "Strippable".
- `brewster-chesapeake-tap-root-dark-blue-4169-27600.jpg`, 1800 x 1796,
  from https://cdn.shopify.com/s/files/1/0621/3605/7898/files/4169-27600.jpg
  (Brewster's Shopify CDN). **Texture source.** Total Wallcovering's own
  images (`cdn.totalwallcovering.com/book/4169-27600_{Detail,Dims,Room,Room2,Stick}-l.jpg`)
  are 600 px roll / room shots, no flat; the `-xl` and suffix-less names
  404. Not kept.
- **Repeat.** Zero-padded, overlap-normalised luminance autocorrelation of
  the flat: (896.99, 0) px at 0.989 and (0, 898.75) px at 0.981, plus
  half-drop near-copies at (449, ±449.3) of only 0.91 (the scallops
  alternate, but the printed linen texture does not), so the exact repeat
  is a rectangular ~899 x 897 px cell holding two half-dropped scallops,
  and the flat is 2 x 2 cells. The two listed repeats disagree (10.25" vs
  20.86"). Total Wallcovering's roll photo (`_Dims-l.jpg`, marked 20.5 in)
  shows two scallop columns of the same row across the roll, i.e. two
  cells per roll width, so the flat is one roll width (87.8 px/in, the
  same scale as York's Quelala flat) and one cell is 10.25" x 10.22":
  Brewster's 10.25" is right, and the 20.86" is not supported by the
  artwork. The four copies are resampled onto an exact 899 x 897 grid
  with `lattice_mean`, averaged and upscaled 2x (1798 x 1794 px for
  0.2603 m square, the listed 10.25"; the artwork's vertical is 0.2%
  shorter). Maker's colours kept: ground median #364656 (darker and
  bluer than Hale Navy #434B56).

### Ondecor Vintage Botanical, Blue / Beige / Teal (C329)

- Page (owner's link): https://ondecor.com/products/floral-wallpaper-vintage-botanical-motif-blue-beige-teal-c329
  (Shopify; `<handle>.js` lists the variants), read 2026-10-05: "Floral
  Wallpaper with a Vintage Botanical Motif in Blue, Beige, and Teal -
  C329", "sophisticated shades of blue, beige, and teal against a dramatic
  dark backdrop"; made in the USA, Canon UVgel print. **Rolls 24" wide x
  76, 100, 112, 124 or 148"** (samples 8.5" x 7" $1.50, 24" x 24"
  $19.00). Materials: Smooth, Canvas or Fabric peel and stick (Commercial
  Grade Type I), Smooth or Canvas traditional (Type II, paste; Ondecor
  recommends PRO-880). **$51.00 (24" x 76" smooth peel and stick) to
  $119.00 (24" x 148" canvas / fabric / traditional) per roll.** Care: the
  FAQ says the materials are **"water-resistant, fade-resistant, and
  scratch-resistant"**; nothing says bathroom-rated, washable or
  scrubbable. The page text gives no repeat.
- `ondecor-c329-repeat-card.jpg`, 1000 x 1000 (the gallery's 3000 px
  `il_fullxfull.5433196216_lwez.jpg`, downsized): Ondecor's info card,
  **"A full 24" pattern repeats once in a 24" wide roll", "Horizontal
  Repeat: 24"", "Vertical Repeat: 24""**, beside a flat pattern detail
  (a zoomed crop, not a whole repeat). Kept as the repeat evidence and the
  colour reference: its modal ground is #3E3E42.
- `ondecor-c329-vintage-botanical-04-wall.jpg`, 2280 x 1450: the top 1450
  rows of the gallery's bench mock-up
  https://cdn.shopify.com/s/files/1/0491/5203/2932/files/C329_04.png
  (2280 px square, 9.3 MB PNG; JPEG q88 here). **Texture source.** No flat
  repeat is offered; the other mock-ups (C329_01-03, 05) carry more
  furniture or perspective. Luminance correlation over the clean wall:
  (0, 1039.18) px at 0.970 and (1039.46, 0) px at 0.961, so the wall is a
  front-on composite of a square 1039 px = 24" repeat (43.3 px/in, about
  2.2 repeats across the image). The mock-up's soft vignette (0.80-1.18)
  is divided out (120 px-blurred photo / tiled-cell ratio, 3 passes),
  the props (cushion, pot, plants, bench) are masked, and every lattice
  copy on clean wall is averaged (1-4 per pixel, mean 2.7). The cell is
  graded per channel (two points: modal ground, 97th-percentile
  highlight) to the card's flat detail (mock-up ground #3A363A, scene-
  graded warmer and darker) and upscaled to 2048 px for 0.6096 m.
  Finish: matte (0.80), no metal.
