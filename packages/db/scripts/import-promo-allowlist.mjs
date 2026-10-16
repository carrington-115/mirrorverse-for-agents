// Load the emails allowed to redeem an allowlist-restricted promo code (e.g.
// event participants) from a registration CSV export. Every column whose header
// is "email" (case/whitespace-insensitive) is read, so both the account email
// and the form's "Email" answer are allowed. Idempotent — re-run it with an
// updated export to add new registrants.
//
// The CSV holds participants' personal data: keep it outside the repo.
//
//   DATABASE_URL=... node packages/db/scripts/import-promo-allowlist.mjs \
//     --code HACKTOBERFEST-26 --csv /path/to/participants.csv [--dry-run]

import fs from "node:fs";
import { parseArgs } from "node:util";

import postgres from "postgres";

const { values: args } = parseArgs({
  options: {
    code: { type: "string" },
    csv: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

if (!args.code || !args.csv) {
  console.error("Usage: import-promo-allowlist.mjs --code <CODE> --csv <file> [--dry-run]");
  process.exit(1);
}

// RFC 4180 parser: handles quoted fields containing commas, quotes and newlines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const [header, ...records] = parseCsv(fs.readFileSync(args.csv, "utf8").replace(/^\uFEFF/, ""));
const emailColumns = header
  .map((name, index) => ({ name: name.trim().toLowerCase(), index }))
  .filter((col) => col.name === "email")
  .map((col) => col.index);

if (emailColumns.length === 0) {
  console.error('No "email" column found in the CSV header.');
  process.exit(1);
}

const emails = new Set();
const invalid = [];
for (const record of records) {
  for (const index of emailColumns) {
    const email = (record[index] ?? "").trim().toLowerCase();
    if (!email) continue;
    if (EMAIL_RE.test(email)) emails.add(email);
    else invalid.push(email);
  }
}

console.log(`${records.length} rows, ${emails.size} unique valid emails.`);
if (invalid.length > 0) console.warn(`Skipped invalid emails: ${invalid.join(", ")}`);

if (args["dry-run"]) {
  console.log("Dry run — nothing written.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  const code = args.code.trim().toUpperCase();
  const [promo] = await sql`select id, restrict_to_allowlist from promo_codes where code = ${code}`;
  if (!promo) throw new Error(`Promo code ${code} not found — run the migrations first.`);

  const rows = [...emails].map((email) => ({ promo_code_id: promo.id, email }));
  const inserted = await sql`
    insert into promo_code_allowed_emails ${sql(rows, "promo_code_id", "email")}
    on conflict do nothing
    returning email
  `;
  const [{ total }] = await sql`
    select count(*)::int as total from promo_code_allowed_emails where promo_code_id = ${promo.id}
  `;
  console.log(`Added ${inserted.length} new emails; ${code} now allows ${total}.`);
  if (!promo.restrict_to_allowlist) {
    console.warn(
      `Note: ${code} has restrict_to_allowlist = false, so the allowlist is not enforced.`,
    );
  }
} finally {
  await sql.end();
}
