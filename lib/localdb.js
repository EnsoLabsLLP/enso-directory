// Local JSON storage for development on your own computer (no Google Sheet needed).
// Not used on Vercel once the Google Sheet variables are set.
import { promises as fs } from "fs";
import path from "path";
import { cleanRecord } from "./practitioners";
import { SEED } from "./seed";

const DIR = path.join(process.cwd(), ".data");
const file = (name) => path.join(DIR, name);

async function read(name, fallback) {
  try {
    return JSON.parse(await fs.readFile(file(name), "utf8"));
  } catch {
    return fallback;
  }
}
async function write(name, data) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(name), JSON.stringify(data, null, 2));
}

export async function status() {
  return { ready: true };
}
export async function setup() {
  const existing = await read("practitioners.json", null);
  if (!existing) await write("practitioners.json", SEED);
  return { seeded: existing ? 0 : SEED.length };
}
export async function listPractitioners() {
  const list = await read("practitioners.json", SEED);
  return list.map(cleanRecord);
}
export async function savePractitioner(record) {
  const list = await listPractitioners();
  const i = list.findIndex((p) => p.id === record.id);
  if (i >= 0) list[i] = record;
  else list.push(record);
  await write("practitioners.json", list);
  return record;
}
export async function deletePractitioner(id) {
  const list = await listPractitioners();
  const next = list.filter((p) => p.id !== id);
  await write("practitioners.json", next);
  return next.length !== list.length;
}
export async function appendRequest(req) {
  const list = await read("requests.json", []);
  list.push(req);
  await write("requests.json", list);
  return req;
}
export async function listRequests(limit = 25) {
  const list = await read("requests.json", []);
  return list.slice().reverse().slice(0, limit);
}

export const UPLOAD_DIR = path.join(DIR, "uploads");
