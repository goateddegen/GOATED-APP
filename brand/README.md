# GOATED — brand assets

Static 2D exports of the app mark (`src/components/GoatLogo.jsx`), with all SMIL
animation, cursor-tracking eyes and floating particles removed so they render
identically everywhere.

## Files

| File | Size | Use |
|---|---|---|
| `goated-logo.svg` | vector | Master. Full 200×200 artwork incl. outer orbit rings. |
| `goated-icon-tight.svg` | vector | Master, cropped to the horns/chin bounding box. Better in small square frames. |
| `goated-linkedin-logo-400.png` | 400×400 | **LinkedIn organisation logo.** Dark background — recommended. |
| `goated-linkedin-logo-400-transparent.png` | 400×400 | Same crop, transparent. |
| `goated-linkedin-banner-1128x191.png` | 1128×191 | **LinkedIn company cover image.** |
| `goated-logo-400.png` | 400×400 | Full artwork, transparent. |
| `goated-logo-300.png` | 300×300 | Full artwork, transparent. |
| `goated-logo-300-dark.png` | 300×300 | Full artwork on `#030712`. |

## Which to upload to LinkedIn

- **Logo:** `goated-linkedin-logo-400.png`. LinkedIn wants a square ≥300×300 and
  crops to a rounded square. Use the dark version — the horns are a
  white→silver gradient and largely disappear against LinkedIn's white surface.
- **Cover:** `goated-linkedin-banner-1128x191.png`.

## Palette

Degen (orange), matching the live cover page:

- `#ef4444` red · `#f97316` orange · `#fb923c` light orange · `#fbbf24` amber
- Surface `#030712` · body gradient `#1e293b` → `#0f172a` → `#030712`

## Regenerating the PNGs

No SVG toolchain is required — headless Chrome rasterises them:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --allow-file-access-from-files \
  --hide-scrollbars --screenshot=out.png --window-size=400,400 wrapper.html
```

where `wrapper.html` sets `html,body{margin:0;width:400px;height:400px}` and
embeds the SVG at that exact size. Add `--default-background-color=00000000`
for a transparent export.

## Note on gradient text

The wordmark uses `background-clip: text`, which paints the gradient only inside
the element's box. Any element using it needs `width: max-content` and a little
horizontal padding, or the final glyph renders unfilled — this is what made the
cover page show "GOATEI" instead of "GOATED".
