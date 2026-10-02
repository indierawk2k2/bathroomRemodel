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
