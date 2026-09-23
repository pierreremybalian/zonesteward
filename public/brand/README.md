# Zonesteward wordmark

"Zone" in Newsreader Regular, "steward" in Newsreader Italic, as the marketing
masthead sets it — converted to outlines so nothing that shows the mark needs
the font.

- `zonesteward-wordmark.svg` — `currentColor` text, burnt-orange accent. Use inline
  or as an `<img>` on light surfaces; inline lets CSS recolour the text.
- `zonesteward-wordmark-light.svg` / `-dark.svg` — fixed colours for `<img>` use.
- `zonesteward-wordmark@2x.png` / `-dark@2x.png` — 360×69, for email (mail clients
  strip SVG). Display at 180×35.
- `wordmark-paths.json` — the two path strings + viewBox, for inlining in code.

Regenerate: `node tools/wordmark.mjs` (needs the two Newsreader TTFs from Google
Fonts in the working dir) then `node tools/raster.mjs`.
