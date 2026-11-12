import { findConcern, findWay, findTime, experienceYears, WAYS } from "./catalog";

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
export const LIST_FIELDS = ["badges", "concerns", "ways", "languages", "avail", "education"];
const SEP = "; ";

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "practitioner";
}

const splitList = (v) =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : String(v || "").split(/;|\n/).map((x) => x.trim()).filter(Boolean);

// Turn anything (a sheet row object, form data) into a clean record.
export function cleanRecord(input) {
  const r = {};
  for (const [key] of PRACTITIONER_COLUMNS) r[key] = input[key] ?? "";
  for (const key of LIST_FIELDS) r[key] = splitList(r[key]);
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

export function recordToRow(r) {
  return PRACTITIONER_COLUMNS.map(([key]) => {
    const v = r[key];
    if (LIST_FIELDS.includes(key)) return (v || []).join(SEP);
    if (v === null || v === undefined) return "";
    return String(v);
  });
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
  const ways = r.ways.map((l) => {
    const w = findWay(l);
    if (!w) return "custom:" + l;
    return /training/i.test(l) ? w.id + ":training" : w.id;
  });
  const avail = r.avail.map((l) => findTime(l)?.id).filter(Boolean);
  const creative = ways.some((w) => WAYS.find((x) => x.id === w.split(":")[0])?.creative);
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
