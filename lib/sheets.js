// Google Sheets storage. Uses a service account that has Editor access to the sheet.
import { JWT } from "google-auth-library";
import { PRACTITIONER_COLUMNS, cleanRecord, recordToCells, rowToRecord } from "./practitioners";
import { REQUEST_COLUMNS, requestToCells, rowToRequest } from "./requests";
import { SEED } from "./seed";

export const TABS = { practitioners: "Practitioners", requests: "Requests" };
// SHEETS_API_BASE and GOOGLE_ACCESS_TOKEN exist only for automated tests against a fake Sheets server.
const BASE = process.env.SHEETS_API_BASE || "https://sheets.googleapis.com/v4/spreadsheets/";

let client = null;
function auth() {
  if (!client) {
    client = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
  }
  return client;
}

export class SheetError extends Error {
  constructor(status, detail) {
    super(`Google Sheets request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

async function api(path, { method = "GET", body } = {}) {
  const token = process.env.GOOGLE_ACCESS_TOKEN || (await auth().getAccessToken()).token;
  const init = {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  };
  if (method === "GET") init.next = { tags: ["sheets"] };
  const res = await fetch(BASE + process.env.GOOGLE_SHEET_ID + path, init);
  if (!res.ok) throw new SheetError(res.status, await res.text());
  return res.json();
}

const range = (tab, a1 = "") => encodeURIComponent(`'${tab}'${a1 ? "!" + a1 : ""}`);
const colLetter = (n) => {
  let s = "";
  for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

async function tabsMeta() {
  const meta = await api("?fields=sheets.properties(sheetId,title)");
  return Object.fromEntries((meta.sheets || []).map((s) => [s.properties.title, s.properties.sheetId]));
}

// Rows are always written to match each tab's own header row, so columns you add or move
// yourself in the sheet are left alone. Any of our headers that are missing get added at the end.
async function syncHeaders(title, sheetId, cols) {
  const head = await api(`/values/${range(title, "1:1")}`);
  const current = ((head.values && head.values[0]) || []).map((h) => String(h).trim());
  const missing = cols.map(([, h]) => h).filter((h) => !current.includes(h));
  if (missing.length) {
    const start = colLetter(current.length);
    await api(`/values/${range(title, `${start}1`)}?valueInputOption=RAW`, { method: "PUT", body: { values: [missing] } });
    await api(":batchUpdate", {
      method: "POST",
      body: {
        requests: [{
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold"
          }
        }]
      }
    });
  }
  return [...current, ...missing];
}

async function headersFor(title, cols, headers) {
  if (cols.every(([, h]) => headers.includes(h))) return headers;
  const tabs = await tabsMeta();
  return syncHeaders(title, tabs[title], cols);
}

let tabsReady = false;
export async function ensureTabs() {
  if (tabsReady) return;
  let tabs = await tabsMeta();
  const wanted = [
    [TABS.practitioners, PRACTITIONER_COLUMNS],
    [TABS.requests, REQUEST_COLUMNS]
  ];
  const missing = wanted.filter(([title]) => tabs[title] === undefined);
  if (missing.length) {
    await api(":batchUpdate", {
      method: "POST",
      body: { requests: missing.map(([title]) => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } })) }
    });
    tabs = await tabsMeta();
  }
  for (const [title, cols] of wanted) await syncHeaders(title, tabs[title], cols);
  tabsReady = true;
}

// Lines values up with the sheet's own header row. Cells under headers we don't know keep what was there.
const alignRow = (headers, cells, existing = []) =>
  headers.map((h, i) => (Object.prototype.hasOwnProperty.call(cells, h) ? cells[h] : existing[i] ?? ""));

async function readTab(title) {
  try {
    const data = await api(`/values/${range(title)}`);
    const [headers = [], ...rows] = data.values || [];
    return { headers: headers.map((h) => String(h).trim()), rows };
  } catch (e) {
    if (e instanceof SheetError && e.status === 400) return { headers: [], rows: [], missing: true };
    throw e;
  }
}

export async function status() {
  const tabs = await tabsMeta();
  const ready = tabs[TABS.practitioners] !== undefined && tabs[TABS.requests] !== undefined;
  return { ready };
}

export async function setup() {
  await ensureTabs();
  const { headers, rows } = await readTab(TABS.practitioners);
  let seeded = 0;
  if (!rows.some((r) => r.some((c) => String(c).trim()))) {
    await api(`/values/${range(TABS.practitioners, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: "POST",
      body: { values: SEED.map((r) => alignRow(headers, recordToCells(cleanRecord({ ...r, updated: new Date().toISOString() })))) }
    });
    seeded = SEED.length;
  }
  return { seeded };
}

export async function listPractitioners() {
  const { headers, rows } = await readTab(TABS.practitioners);
  return rows
    .filter((row) => row.some((c) => String(c).trim()))
    .map((row) => rowToRecord(headers, row))
    .filter((r) => r.name);
}

async function findRow(id) {
  const { headers, rows } = await readTab(TABS.practitioners);
  const idx = rows.findIndex((row) => row.some((c) => String(c).trim()) && rowToRecord(headers, row).id === id);
  return { headers, at: idx < 0 ? null : idx + 2, existing: idx < 0 ? [] : rows[idx] }; // 1-based, after the header row
}

export async function savePractitioner(record) {
  await ensureTabs();
  const found = await findRow(record.id);
  const { at, existing } = found;
  const headers = await headersFor(TABS.practitioners, PRACTITIONER_COLUMNS, found.headers);
  const row = alignRow(headers, recordToCells(record), existing);
  if (at) {
    const last = colLetter(headers.length - 1);
    await api(`/values/${range(TABS.practitioners, `A${at}:${last}${at}`)}?valueInputOption=RAW`, {
      method: "PUT",
      body: { values: [row] }
    });
  } else {
    await api(`/values/${range(TABS.practitioners, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: "POST",
      body: { values: [row] }
    });
  }
  return record;
}

export async function deletePractitioner(id) {
  const { at } = await findRow(id);
  if (!at) return false;
  const tabs = await tabsMeta();
  await api(":batchUpdate", {
    method: "POST",
    body: { requests: [{ deleteDimension: { range: { sheetId: tabs[TABS.practitioners], dimension: "ROWS", startIndex: at - 1, endIndex: at } } }] }
  });
  return true;
}

export async function appendRequest(req) {
  await ensureTabs();
  const head = await api(`/values/${range(TABS.requests, "1:1")}`);
  const current = ((head.values && head.values[0]) || []).map((h) => String(h).trim());
  const headers = await headersFor(TABS.requests, REQUEST_COLUMNS, current);
  await api(`/values/${range(TABS.requests, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: { values: [alignRow(headers, requestToCells(req))] }
  });
  return req;
}

export async function listRequests(limit = 25) {
  const { headers, rows } = await readTab(TABS.requests);
  return rows.map((row) => rowToRequest(headers, row)).filter((r) => r.name).reverse().slice(0, limit);
}
