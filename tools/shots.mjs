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
  // Added 2026-09-30. Workspace frames are cropped to the canvas (no chat
  // column). Skipped on purpose: the audit-log frame (test rows from guard
  // probes), the users frame (one alias repeated), the AI settings frame (shows
  // the key's last characters), and Connect's label field (its placeholder
  // carries a real first name) — connect-tiers starts below it.
  "see-live":      ["61-canvas-live.png", [980, 290, 2870, 1775]],
  "undo-changes":  ["65-canvas-changes.png", [1000, 330, 2830, 1800]],
  "ask-library":   ["68-question-library.png", [672, 150, 2208, 1094]],
  "graph-viz":     ["71-canvas-viz.png", [985, 290, 2860, 1320]],
  "connect-tiers": ["40-settings-connect.png", [715, 890, 2165, 1350]],
  // A frame from the Fleet video (~/Desktop/zonesteward-video, made by the
  // recording script): the Fleet tab replaying a day across every site.
  "fleet-still":   [path.join(os.homedir(), "Desktop", "zonesteward-video", "fleet-poster.png"), null],
};

for (const [slot, [file, box]] of Object.entries(CROPS)) {
  const src = path.isAbsolute(file) ? file : path.join(SRC, file);
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

// Social card: a frame of the Fleet video, 1.905:1 → 1200×630.
const og = path.join(os.homedir(), "Desktop", "zonesteward-video", "fleet-poster.png");
if (fs.existsSync(og)) {
  await sharp(og).extract({ left: 330, top: 150, width: 1270, height: 667 }).resize(1200, 630).jpeg({ quality: 82, mozjpeg: true }).toFile("public/og.jpg");
  console.log("og.jpg", (fs.statSync("public/og.jpg").size / 1024).toFixed(0), "KB");
  // The hero video's poster, shown before the first frame and under reduced motion.
  await sharp(og).webp({ quality: 80 }).toFile("public/media/fleet-poster.webp");
  console.log("fleet-poster.webp", (fs.statSync("public/media/fleet-poster.webp").size / 1024).toFixed(0), "KB");
}
