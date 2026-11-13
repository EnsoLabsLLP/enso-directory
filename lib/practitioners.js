import { findConcern, findClient, findWay, findTime, findLanguage, isTraining, experienceYears, IN_TRAINING } from "./catalog";

// Column order of the "Practitioners" tab in the Google Sheet.
export const PRACTITIONER_COLUMNS = [
  ["id", "ID"],
  ["status", "Status"],
  ["order", "Order"],
  ["name", "Name"],
  ["role", "Title"],
  ["place", "Based in"],
  ["badges", "Badges"],
  ["summary", "Short summary"],
  ["about", "About (in their words)"],
  ["concerns", "Can help with"],
  ["clients", "Works with"],
  ["ways", "Ways of working"],
  ["languages", "Languages"],
  ["avail", "Usually available"],
  ["availNote", "Availability note"],
  ["fee", "Fee (INR)"],
  ["exp", "Experience"],
  ["education", "Education and registration"],
  ["photo", "Photo URL"],
  ["video", "Intro video URL"],
  ["updated", "Last updated"]
];
export const LIST_FIELDS = ["badges", "concerns", "clients", "ways", "languages", "avail", "education"];
const SEP = "; ";

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "practitioner";
}

const splitList = (v, sep = /;|\n/) =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : String(v || "").split(sep).map((x) => x.trim()).filter(Boolean);
const uniq = (list) => {
  const seen = new Set();
  return list.filter((x) => {
    const k = x.toLowerCase();
    return seen.has(k) ? false : seen.add(k);
  });
};

// Known options are stored under their current label; anything else is kept as typed.
// "Teens" and "Couples" used to be concerns; they now live under "Works with".
function tidyLists(r) {
  const concerns = [], clients = [];
  for (const l of r.concerns) {
    const c = findConcern(l);
    const g = c ? null : findClient(l);
    if (c) concerns.push(c.label);
    else if (g) clients.push(g.label);
    else concerns.push(l);
  }
  for (const l of r.clients) clients.push(findClient(l)?.label || l);
  r.concerns = uniq(concerns);
  r.clients = uniq(clients);
  r.ways = uniq(r.ways.map((l) => {
    const w = findWay(l);
    return w ? w.short + (isTraining(l) ? IN_TRAINING : "") : l;
  }));
  r.languages = uniq(r.languages.flatMap((l) => l.split(",")).map((l) => l.trim()).filter(Boolean).map((l) => findLanguage(l)?.label || l));
  r.avail = uniq(r.avail.map((l) => findTime(l)?.label || l));
  for (const key of ["badges", "education"]) r[key] = uniq(r[key]);
}

// Turn anything (a sheet row object, form data) into a clean record.
export function cleanRecord(input) {
  const r = {};
  for (const [key] of PRACTITIONER_COLUMNS) r[key] = input[key] ?? "";
  for (const key of LIST_FIELDS) r[key] = splitList(r[key]);
  tidyLists(r);
  r.id = slugify(r.id || r.name);
  r.status = /hid/i.test(r.status) ? "Hidden" : "Published";
  r.order = Number.isFinite(Number(r.order)) && String(r.order).trim() !== "" ? Number(r.order) : 999;
  const fee = String(r.fee).replace(/[^\d.]/g, "");
  r.fee = fee === "" ? null : Math.round(Number(fee));
  for (const key of ["name", "role", "place", "summary", "about", "availNote", "exp", "photo", "video", "updated"]) {
    r[key] = String(r[key] || "").trim();
  }
  return r;
}

const cell = (r, key) => {
  const v = r[key];
  if (LIST_FIELDS.includes(key)) return (v || []).join(SEP);
  if (v === null || v === undefined) return "";
  return String(v);
};

export function recordToRow(r) {
  return PRACTITIONER_COLUMNS.map(([key]) => cell(r, key));
}

// Values keyed by sheet header, so a row can be written in whatever column order the sheet has.
export function recordToCells(r) {
  return Object.fromEntries(PRACTITIONER_COLUMNS.map(([key, header]) => [header, cell(r, key)]));
}

export function rowToRecord(headers, row) {
  const byHeader = {};
  headers.forEach((h, i) => (byHeader[String(h).trim()] = row[i] ?? ""));
  const input = {};
  for (const [key, header] of PRACTITIONER_COLUMNS) input[key] = byHeader[header] ?? "";
  return cleanRecord(input);
}

// The shape the public directory script works with.
export function toPublic(r) {
  const concerns = r.concerns.map((l) => findConcern(l)?.id || "custom:" + l);
  const clients = r.clients.map((l) => findClient(l)?.id || "custom:" + l);
  const ways = r.ways.map((l) => {
    const w = findWay(l);
    if (!w) return "custom:" + l;
    return isTraining(l) ? w.id + ":training" : w.id;
  });
  const avail = r.avail.map((l) => findTime(l)?.id).filter(Boolean);
  const creative = r.ways.some((l) => findWay(l)?.creative);
  const badges = [...r.badges];
  if (creative && !badges.some((b) => /creative/i.test(b))) badges.push("Creative therapies");
  return {
    slug: r.id,
    order: r.order,
    name: r.name,
    role: r.role,
    place: r.place,
    badges,
    summary: r.summary,
    about: r.about,
    concerns,
    clients,
    ways,
    creative,
    languages: r.languages,
    avail: [...new Set(avail)],
    availNote: r.availNote,
    fee: r.fee,
    exp: r.exp,
    expYears: experienceYears(r.exp),
    education: r.education,
    photo: r.photo,
    video: r.video
  };
}

export function sortRecords(list) {
  return [...list].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
