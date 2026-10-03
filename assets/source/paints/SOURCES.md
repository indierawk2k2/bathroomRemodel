# Paint colour sources (br-9q0)

The five preset paint colours in `src/options/paints/`. Each hex was read
from the maker's own colour page with `curl` (browser User-Agent) on
2026-10-02; nothing here is estimated.

Palette they were chosen against: the oval mirror's oak frame texture
(`assets/textures/wood_frame_albedo.jpg`) has a mean sRGB of **#784137**
(120, 65, 55), a red-brown. Around it: off-white walls, mid-grey wainscot and
tub stone, grey-brown vanity, white quartz counter, brushed / dark bronze
fixtures, brass and rattan lights.

| Order | Direction | Maker | Name | Code | Hex | Source (field read) |
| --- | --- | --- | --- | --- | --- | --- |
| 60 | deep teal / peacock blue-green | Farrow & Ball | Vardo | No. 288 | `#427F83` | https://www.farrow-ball.com/paint/vardo (swatch `product-data-colour-box` background-color) |
| 61 | deep hunter / forest green | Sherwin-Williams | Hunt Club | SW 6468 | `#2A4F43` | https://www.sherwin-williams.com/en-us/color/color-family/green-paint-colors/sw6468-hunt-club (RGB property 42, 79, 67); also listed as Hunt Club on https://encycolorpedia.com/2a4f43 |
| 62 | navy / inky blue | Benjamin Moore | Hale Navy | HC-154 | `#434B56` | https://www.benjaminmoore.com/en-us/paint-colors/color/hc-154/hale-navy (page JSON `"name":"Hale Navy","number":"HC-154","hex":"434B56"`) |
| 63 | aubergine / plum | Farrow & Ball | Brinjal | No. 222 | `#5E4449` | https://www.farrow-ball.com/paint/brinjal (swatch background-color) |
| 64 | terracotta / burnt clay | Sherwin-Williams | Cavern Clay | SW 7701 | `#AC6B53` | https://www.sherwin-williams.com/en-us/color/color-family/orange-paint-colors/sw7701-cavern-clay (RGB property 172, 107, 83); also listed as Cavern Clay on https://encycolorpedia.com/ac6b53 |

Candidates checked and not used: Farrow & Ball Studio Green No. 93
`#464D4A` (reads almost black-grey, too close to the stone); Benjamin Moore
Essex Green HC-188 `#27362E` (near black), Hunter Green 2041-10 `#2A453D`,
Forest Green 2047-10 `#174A43` (too close in hue to Vardo), Tarrytown Green
HC-134 `#415752`; Sherwin-Williams Rainstorm SW 6230 `#244653`.
(Benjamin Moore HC-137 is Mill Springs Blue `#7DA19A`, not Essex Green.)

Caveats:
- A published hex is the maker's screen rendering of the chip. Real paint
  varies with sheen, lighting and the batch; get a sample pot before buying.
- The viewer's finishes (eggshell, matte, satin) are roughness
  approximations, not measured sheen. For a bathroom, makers recommend a
  moisture-resistant eggshell / satin line (F&B Modern Emulsion or Estate
  Eggshell, BM Aura Bath & Spa, SW Duration Home or Emerald); the colour
  names here are colours, not a specific damp-rated product.
