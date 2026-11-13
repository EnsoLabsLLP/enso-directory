// Column order of the "Requests" tab in the Google Sheet.
export const REQUEST_COLUMNS = [
  ["received", "Received (IST)"],
  ["type", "Type"],
  ["practitioner", "Practitioner"],
  ["name", "Name"],
  ["phone", "Phone / WhatsApp"],
  ["email", "Email"],
  ["time", "Preferred time"],
  ["concerns", "Wants help with"],
  ["forWhom", "Session for"],
  ["language", "Language"],
  ["budget", "Budget"],
  ["message", "Message"],
  ["status", "Status"],
  ["requestId", "Request ID"]
];

const cell = (r, key) => (r[key] === undefined || r[key] === null ? "" : String(r[key]));

export function requestToRow(r) {
  return REQUEST_COLUMNS.map(([key]) => cell(r, key));
}

// Values keyed by sheet header, so a row can be written in whatever column order the sheet has.
export function requestToCells(r) {
  return Object.fromEntries(REQUEST_COLUMNS.map(([key, header]) => [header, cell(r, key)]));
}

export function rowToRequest(headers, row) {
  const out = {};
  REQUEST_COLUMNS.forEach(([key, header]) => {
    const i = headers.indexOf(header);
    out[key] = i >= 0 ? row[i] ?? "" : "";
  });
  return out;
}

export function istNow() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: true
  }).format(new Date());
}
