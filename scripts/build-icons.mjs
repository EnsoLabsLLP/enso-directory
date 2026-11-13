// Rebuilds lib/icons.json: the Tabler icons the site uses, inlined so nothing loads from outside.
//
//   npm i --no-save @tabler/icons@3.39.0
//   npm run icons
//
// Icons come from the UI list below plus every icon named in data/taxonomy/*.json.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] || join(root, "node_modules/@tabler/icons/icons/outline");

const UI = [
  // site
  "search", "adjustments-horizontal", "x", "arrow-right", "arrow-up-right", "check", "copy", "chevron-down",
  "video", "player-play", "map-pin", "language", "briefcase", "school", "currency-rupee", "calendar-check",
  "message-heart", "user-search", "users", "sparkles", "circle-check", "alert-circle", "info-circle", "plus",
  "rosette-discount-check", "user-star", "palette", "phone", "mail", "brand-linkedin", "device-mobile",
  // times of day
  "sunrise", "sun", "sunset", "calendar-week",
  // admin
  "photo", "movie", "upload", "trash", "eye", "eye-off", "pencil", "logout", "external-link", "inbox"
];

const taxonomyDir = join(root, "data/taxonomy");
const fromTaxonomy = [];
for (const file of readdirSync(taxonomyDir).filter((f) => f.endsWith(".json"))) {
  const j = JSON.parse(readFileSync(join(taxonomyDir, file), "utf8"));
  if (j.icon) fromTaxonomy.push(j.icon);
  for (const x of [...(j.categories || []), ...(j.items || [])]) if (x.icon) fromTaxonomy.push(x.icon);
}

if (!existsSync(source)) {
  console.error(`Tabler icons not found at ${source}. Run: npm i --no-save @tabler/icons@3.39.0`);
  process.exit(1);
}

const out = {};
const missing = [];
for (const name of [...new Set([...UI, ...fromTaxonomy])].sort()) {
  const file = join(source, name + ".svg");
  if (!existsSync(file)) { missing.push(name); continue; }
  const svg = readFileSync(file, "utf8");
  out[name] = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, "")
    .replace(/\s*\n\s*/g, "")
    .trim();
}
if (missing.length) {
  console.error("Not in Tabler:", missing.join(", "));
  process.exit(1);
}
writeFileSync(join(root, "lib/icons.json"), JSON.stringify(out, null, 0) + "\n");
console.log(`Wrote ${Object.keys(out).length} icons to lib/icons.json`);
