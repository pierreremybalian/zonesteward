import fs from "node:fs";
import { createCanvas, Path2D } from "@napi-rs/canvas";
const m = JSON.parse(fs.readFileSync("brand/wordmark-paths.json", "utf8"));
const [vx, vy, vw, vh] = m.viewBox.split(" ").map(Number);
function render({ file, scale, bg, ink, accent, pad = 0.35 }) {
  const w = Math.round((vw + vw * pad) * scale), h = Math.round((vh + vh * pad * 2) * scale);
  const cv = createCanvas(w, h), ctx = cv.getContext("2d");
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.translate((w - vw * scale) / 2, (h - vh * scale) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-vx, -vy);
  ctx.fillStyle = ink; ctx.fill(new Path2D(m.zone));
  ctx.fillStyle = accent; ctx.fill(new Path2D(m.steward));
  fs.writeFileSync(file, cv.toBuffer("image/png"));
  console.log(file, `${w}x${h}`);
}
render({ file: "brand/preview-light.png", scale: 1.4, bg: "#faf9f6", ink: "#16150f", accent: "#c2410c" });
render({ file: "brand/preview-dark.png", scale: 1.4, bg: "#0d0d0f", ink: "#e8e8ea", accent: "#F6821F" });
// email assets: transparent, 2x of a 180px-wide mark
const emailScale = (180 / vw) * 2;
render({ file: "brand/zonesteward-wordmark@2x.png", scale: emailScale, bg: null, ink: "#16150f", accent: "#c2410c", pad: 0 });
render({ file: "brand/zonesteward-wordmark-dark@2x.png", scale: emailScale, bg: null, ink: "#e8e8ea", accent: "#F6821F", pad: 0 });
