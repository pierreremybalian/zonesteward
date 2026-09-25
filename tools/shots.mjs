// Crop the presentation-mode screenshots into the marketing plates.
// Source: ~/Desktop/zonesteward-shots (1440×900 @2x = 2880×1800). Output:
// src/assets/shots/<slot>.png (masters, committed; Astro's <Picture> derives
// AVIF/WebP at build) and public/og.jpg. Re-run after any recapture:
//   npm run shots
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SRC = process.argv[2] ?? path.join(os.homedir(), "Desktop", "zonesteward-shots");
const OUT = "src/assets/shots";
fs.mkdirSync(OUT, { recursive: true });

// [file, left, top, right, bottom] in source pixels. Each crop excludes the
// app chrome and any real text a frame might carry (permission banners, file
// paths, provider names) — see the plan's hazard list.
const CROPS = {
  "gate-card":     ["76b-approval-card-crop.png", null],
  "tour-ask":      ["70-chat-answer-chart.png", [0, 200, 2880, 1800]],
  "tour-security": ["64-canvas-security.png", [1020, 525, 2830, 1800]],
  "tour-alerts":   ["22-alert-rules.png", [530, 230, 2350, 1520]],
  "tour-see":      ["10-dashboard.png", [0, 100, 2880, 1800]],
  "tour-clients":  ["40-settings-shares.png", [720, 550, 2160, 1040]],
  "tour-keys":     ["50-admin-usage.png", [785, 480, 2095, 1800]],
  "uc-attack":     ["64-canvas-security.png", [1020, 890, 2830, 1800]],
  "uc-graph":      ["78-chat-cache-origin.png", [960, 200, 2880, 1400]],
  "role-dev":      ["73-canvas-graphql.png", [960, 200, 2880, 1500]],
  "mobile-dash":   ["90-mobile-dashboard.png", null],
  "mobile-work":   ["91-mobile-workspace.png", null],
  "mobile-alerts": ["92-mobile-alerts.png", null],
};

for (const [slot, [file, box]] of Object.entries(CROPS)) {
  const src = path.join(SRC, file);
  if (!fs.existsSync(src)) { console.log("skip (missing)", slot, file); continue; }
  let img = sharp(src);
  if (box) {
    const [l, t, r, b] = box;
    const meta = await img.metadata();
    const right = Math.min(r, meta.width), bottom = Math.min(b, meta.height);
    img = img.extract({ left: l, top: t, width: right - l, height: bottom - t });
  }
  const out = path.join(OUT, `${slot}.png`);
  await img.png({ compressionLevel: 9 }).toFile(out);
  const m = await sharp(out).metadata();
  console.log(`${slot.padEnd(14)} ${m.width}×${m.height}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}

// Social card: the dark dashboard, top band, 1.905:1 → 1200×630.
const og = path.join(SRC, "82-dark-dashboard.png");
if (fs.existsSync(og)) {
  await sharp(og).extract({ left: 0, top: 0, width: 2880, height: 1512 }).resize(1200, 630).jpeg({ quality: 82, mozjpeg: true }).toFile("public/og.jpg");
  console.log("og.jpg", (fs.statSync("public/og.jpg").size / 1024).toFixed(0), "KB");
}
