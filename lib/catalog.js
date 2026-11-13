// Shared lists used by the directory, the admin panel and the Google Sheet.
// The option lists live in data/taxonomy/*.json (see the README there).
// Labels are what appears in the sheet, so practitioners' rows stay readable there.
import concernsData from "../data/taxonomy/concerns.json";
import clientsData from "../data/taxonomy/client-groups.json";
import approachesData from "../data/taxonomy/approaches.json";
import languagesData from "../data/taxonomy/languages.json";

export const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const CONCERN_GROUPS = concernsData.categories;
export const CONCERNS = concernsData.items;
export const FEATURED_CONCERNS = concernsData.featured;
export const CRISIS_NOTE = concernsData.crisisNote;

export const CLIENT_GROUPS = clientsData.categories;
export const CLIENTS = clientsData.items;

export const WAY_GROUPS = approachesData.categories;
export const WAYS = approachesData.items;
export const IN_TRAINING = approachesData.inTrainingSuffix;

export const LANGUAGES = languagesData.items;
export const FEATURED_LANGUAGES = languagesData.featured.map((id) => LANGUAGES.find((l) => l.id === id).label);

export const TIMES = [
  { id: "m", label: "Weekday mornings", days: "Mon–Fri", icon: "sunrise", aliases: ["mornings", "morning", "weekday morning"] },
  { id: "a", label: "Weekday afternoons", days: "Mon–Fri", icon: "sun", aliases: ["afternoons", "afternoon", "weekday afternoon"] },
  { id: "e", label: "Weekday evenings", days: "Mon–Fri", icon: "sunset", aliases: ["evenings", "evening", "weekday evening"] },
  { id: "w", label: "Weekends", days: "Sat–Sun", icon: "calendar-week", aliases: ["weekend", "saturday", "sunday", "weekends"] }
];

export const FEES = [
  { id: "lt1000", label: "Under ₹1,000", min: 0, max: 999 },
  { id: "1000-1500", label: "₹1,000 – ₹1,500", min: 1000, max: 1500 },
  { id: "gt1500", label: "Above ₹1,500", min: 1501, max: Infinity }
];

export const EXPERIENCE = [
  { label: "Under 2 years", years: 1 },
  { label: "2–3 years", years: 2.5 },
  { label: "4–6 years", years: 5 },
  { label: "7–10 years", years: 8.5 },
  { label: "10+ years", years: 12 }
];

export const BADGE_PRESETS = ["RCI registered", "Enso's clinical advisor"];

// "Who is the session for?" on the request forms, in the client's words. Each maps to the
// "I work with" groups that fit, so the directory can show practitioners who see that kind of client.
export const FOR_WHOM = [
  { id: "self", label: "Myself", icon: "user", clients: ["individuals"] },
  { id: "couple", label: "Me and my partner", icon: "friends", clients: ["couples", "premarital"] },
  { id: "child", label: "My child or teen", icon: "mood-kid", clients: ["young-children", "children", "adolescents", "parent-child"] },
  { id: "parent-child", label: "Me and my child", icon: "horse-toy", clients: ["parent-child"] },
  { id: "family", label: "My family", icon: "home-heart", clients: ["families"] }
];

// One lookup per list: matches ids, labels, short and full names, and aliases.
function index(items, keys) {
  const map = new Map();
  for (const it of items) for (const k of keys(it)) {
    const n = norm(k);
    if (n && !map.has(n)) map.set(n, it);
  }
  return (label) => map.get(norm(label)) || null;
}

export const findConcern = index(CONCERNS, (c) => [c.id, c.label, ...(c.aliases || [])]);
export const findClient = index(CLIENTS, (c) => [c.id, c.label, ...(c.aliases || [])]);
export const findLanguage = index(LANGUAGES, (l) => [l.id, l.label, l.native, ...(l.aliases || [])]);
const wayIndex = index(WAYS, (w) => [w.id, w.short, w.name, ...(w.aliases || [])]);
export const isTraining = (label) => /\bin training\b/i.test(String(label || ""));
export const findWay = (label) => wayIndex(norm(label).replace(/ in training$/, ""));
export const findTime = index(TIMES, (t) => [t.id, t.label, ...t.aliases]);

export function experienceYears(label) {
  const hit = EXPERIENCE.find((e) => norm(e.label) === norm(label));
  if (hit) return hit.years;
  const nums = String(label || "").match(/\d+/g);
  return nums ? nums.map(Number).reduce((a, b) => a + b, 0) / nums.length : 0;
}

// What the public page needs to render tiles, filters and explanations.
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
export const PUBLIC_CATALOG = {
  concerns: CONCERNS.map((c) => pick(c, ["id", "label", "category", "icon", "description", "aliases", "crisisNote"])),
  concernGroups: CONCERN_GROUPS,
  featured: FEATURED_CONCERNS,
  crisisNote: CRISIS_NOTE,
  clients: CLIENTS.map((c) => pick(c, ["id", "label", "category", "icon", "description", "ages", "aliases"])),
  clientGroups: CLIENT_GROUPS,
  forWhom: FOR_WHOM,
  times: TIMES,
  fees: FEES.map(({ id, label, min, max }) => ({ id, label, min, max: max === Infinity ? null : max })),
  ways: WAYS.map((w) => ({ ...pick(w, ["id", "short", "name", "category", "icon", "creative", "aliases"]), about: w.description })),
  wayGroups: WAY_GROUPS
};
