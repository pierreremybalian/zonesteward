// Zonesteward wordmark → SVG paths. "Zone" in Newsreader Regular, "steward" in
// Newsreader Italic, set at the marketing masthead's proportions (23px, 400).
// Output is outlines, so nothing that shows the mark needs the font.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ot = require("opentype.js");
const load = (f) => ot.parse(fs.readFileSync(f).buffer.slice(fs.readFileSync(f).byteOffset, fs.readFileSync(f).byteOffset + fs.readFileSync(f).byteLength));
const a = load("nr-a.ttf"), b = load("nr-b.ttf");
const isItalic = (f) => (f.tables.post.italicAngle || 0) !== 0 || /italic/i.test(f.names.fontSubfamily?.en ?? "");
const [regular, italic] = isItalic(a) ? [b, a] : [a, b];
console.error("regular:", regular.names.fullName?.en, "| italic:", italic.names.fullName?.en, "| upem", regular.unitsPerEm);

const SIZE = 100;                  // design units: 100px cap-ish em; scale later
function run(font, text, x0) {
  const paths = []; let x = x0;
  font.forEachGlyph(text, x, 0, SIZE, { kerning: true, features: { liga: true } }, (glyph, gx, gy, fontSize) => {
    const p = glyph.getPath(gx, gy, fontSize);
    paths.push(p.toPathData(2));
    x = gx + glyph.advanceWidth * (fontSize / font.unitsPerEm);
  });
  return { d: paths.join(" "), end: x };
}
const zone = run(regular, "Zone", 0);
// tiny optical gap between the roman and the italic
const steward = run(italic, "steward", zone.end + SIZE * 0.01);
const totalW = steward.end;
const asc = SIZE * (regular.ascender / regular.unitsPerEm), desc = -SIZE * (regular.descender / regular.unitsPerEm);
const top = -SIZE * 0.78, bottom = SIZE * 0.24;    // tight box around cap height + descender (y down)
const H = bottom - top;
const round = (n) => Math.round(n * 100) / 100;
const vb = `0 ${round(top)} ${round(totalW)} ${round(H)}`;

const svg = ({ ink, accent, title }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${round(totalW)}" height="${round(H)}" role="img" aria-label="Zonesteward"><title>${title}</title>
  <path fill="${ink}" d="${zone.d}"/>
  <path fill="${accent}" d="${steward.d}"/>
</svg>`;
fs.mkdirSync("brand", { recursive: true });
fs.writeFileSync("brand/zonesteward-wordmark.svg", svg({ ink: "currentColor", accent: "#c2410c", title: "Zonesteward" }));
fs.writeFileSync("brand/zonesteward-wordmark-light.svg", svg({ ink: "#16150f", accent: "#c2410c", title: "Zonesteward" }));
fs.writeFileSync("brand/zonesteward-wordmark-dark.svg", svg({ ink: "#e8e8ea", accent: "#F6821F", title: "Zonesteward" }));
fs.writeFileSync("brand/wordmark-paths.json", JSON.stringify({ viewBox: vb, width: round(totalW), height: round(H), zone: zone.d, steward: steward.d }, null, 0));
console.error("viewBox", vb, "| zone.d", zone.d.length, "chars | steward.d", steward.d.length, "chars");
