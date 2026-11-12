// Picks where data lives: the Google Sheet when it's configured, otherwise local files.
import * as sheets from "./sheets";
import * as local from "./localdb";

export function storageMode() {
  const { GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;
  return GOOGLE_SHEET_ID && GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY ? "sheets" : "local";
}
export function uploadMode() {
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
}
export function sheetUrl() {
  return process.env.GOOGLE_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit` : null;
}

const driver = () => (storageMode() === "sheets" ? sheets : local);

export const status = () => driver().status();
export const setup = () => driver().setup();
export const listPractitioners = () => driver().listPractitioners();
export const savePractitioner = (r) => driver().savePractitioner(r);
export const deletePractitioner = (id) => driver().deletePractitioner(id);
export const appendRequest = (r) => driver().appendRequest(r);
export const listRequests = (n) => driver().listRequests(n);
