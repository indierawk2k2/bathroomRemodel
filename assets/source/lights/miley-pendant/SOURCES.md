# Mitzi by Hudson Valley "Miley" pendant (H373701-AGB): modelling references

Retrieved 2026-10-05. The pendant is **no longer on the manufacturer's
site**: <https://www.hvlgroup.com/Product/H373701-AGB> (and -OB / -PN)
redirect to "ProductNotFound", and mitzi.com 404s. The brief's dealer page
<https://www.foundrylighting.com/products/mitzi-by-hudson-valley-lighting-h373701-agb-miley-1-light-pendant-in-aged-brass>
now redirects (curl and Claude in Chrome alike) to Foundry's Mitzi
collection page, which no longer lists it; its search-index entry is still
titled "Miley 1-Light Pendant in Aged Brass 4.5L x 4W x 26.75H". Specs were
therefore taken from:

- the search-index extract of that Foundry page (web search, 2026-10-05):
  opal shiny glass, **120" cord**, **maximum height 32"**, **minimum height
  29"**, shade 4"W x 15.63"H, steel, 4.75" canopy, E26 medium base, 6 W;
- France & Son's Shopify product JSON
  <https://franceandson.com/products/miley-1-light-pendant.json>
  ("Miley 1 Light Pendant", MITZI-H373701-AGB): 4.00" W x 26.75" H, glass
  and metal, 1 lamp, 6 W, E26 medium base;
- HVL's live page for the matching **Miley wall sconce**
  <https://www.hvlgroup.com/Product/H373101-PN>: the same shade, glass
  "opal glossy", top 4", bottom 4", height 15.75"; cUL damp.

These are references for the owners' private local visualisation only.

| file | source URL | what |
|---|---|---|
| `miley-H373701-AGB-studio.jpg` | https://cdn.shopify.com/s/files/1/0549/8093/5725/files/mitzi-miley-pendant-h373701-agb-montreal-lighting-and-hardware-1.jpg (Canada Light Shop's product image, 700 px) | Aged Brass, studio, unlit: capsule, brass rod ends, cord |

## The drop conflict, and the choice

The Foundry data gives a **120" cord** and also a **maximum height of
32"** (minimum 29"). The fixture itself is 26.75" (incl. canopy), so a 32"
maximum would allow only ~3" of cord below the canopy, which contradicts a
120" cord, and it would put the capsule's centre ~100" above the floor at
this 120" ceiling, above the mirror's top. HVL's other Mitzi cord pendants
list the cord as the real reach (Stella: 120" cord, max 114.25"; Reese:
120" cord, max 139"), and cord pendants are cut to length on site.
**Choice: the cord.** `realDropRangeIn: [29, 120]` (the listed minimum, and
the cord, which at this ceiling never limits). The 32" figure is treated as
a listing error (probably the overall height with the shortest cord).

## Verified vs assumed

- Verified (listings): 4" x 15.63" opal glass shade (sconce: 15.75"), 4"
  x 26.75" fixture, 4.75" canopy, E26, 120" cord, 29" minimum.
- **Enclosed**: the photo shows a closed capsule with rounded ends, the
  rod passing through it; no bulb can be seen.
- Assumed from the photo: brass tube above the glass ~4.5" x 0.58", finial
  below ~4.5" x 0.55" with a rounded tip, small brass cups where they meet
  the glass; canopy depth ~1.1" (so the parts add up to 26.75").
- Damp rating for the pendant: not found (the matching sconce is cUL damp).
- Hang: `hangBottomIn` is the finial tip (the lowest point). The mirror-
  centre default wants the tip at 57.7" at the default mirror; the hang
  slider stops at 60", so the default becomes 60" (capsule centre 72.3",
  2.3" above the mirror centre).
