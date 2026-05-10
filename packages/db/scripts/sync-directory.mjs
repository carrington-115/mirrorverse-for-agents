// Fetch Anthropic's public MCP server directory and upsert into
// `mcp_directory_entries`. Idempotent — run as often as you like.
//
//   DATABASE_URL=... node packages/db/scripts/sync-directory.mjs
/* global fetch */
import postgres from "postgres";

const DIRECTORY_URL =
  process.env.MCP_DIRECTORY_URL ??
  "https://api.anthropic.com/api/directory/servers?limit=500&visibility=commercial%2Cgsuite%2Cgsuite-google";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set.");
  process.exit(1);
}

const res = await fetch(DIRECTORY_URL, {
  headers: { accept: "application/json" },
});
if (!res.ok) {
  console.error(`Directory fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const body = await res.json();
const servers = Array.isArray(body) ? body : (body?.servers ?? body?.data ?? []);
if (!Array.isArray(servers) || servers.length === 0) {
  console.error("No servers in directory response. Top-level keys:", Object.keys(body ?? {}));
  process.exit(1);
}

console.log(`Fetched ${servers.length} entries.`);

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

let inserted = 0;
let updated = 0;
const fetchedAt = new Date();

// postgres-js rejects `undefined` — coalesce everything to `null` and skip
// entries missing the required identity fields.
const n = (v) => (v === undefined ? null : v);

for (const s of servers) {
  if (!s?.id || !s?.slug || !s?.name) {
    console.warn("skipping entry without id/slug/name:", s?.id ?? s?.slug ?? "(unknown)");
    continue;
  }
  const author = s.author ?? {};
  const remote = s.remote ?? null;
  const local = s.local ?? null;
  const addedAt = n(s.added_at);

  const result = await sql`
    insert into mcp_directory_entries (
      id, slug, name, display_name, one_liner, description,
      author_name, author_url, icon_url, logo,
      documentation_url, support_url, privacy_policy_url,
      type, source, source_feed,
      categories, tool_names, prompt_names, works_with, visibility,
      remote, local,
      permissions, has_mcp_app, claude_code_copy_text,
      directory_url, background_pattern, server_label,
      sort_order, rank, popularity_score, trending_score,
      added_at, fetched_at, raw
    ) values (
      ${s.id},
      ${s.slug},
      ${s.name},
      ${n(s.display_name) ?? s.name},
      ${n(s.one_liner)},
      ${n(s.description)},
      ${n(author.name)},
      ${n(author.url)},
      ${n(s.icon_url)},
      ${n(s.logo)},
      ${n(s.documentation)},
      ${n(s.support)},
      ${n(s.privacy_policy)},
      ${n(s.type) ?? "remote"},
      ${n(s.source)},
      ${n(s.source_feed)},
      ${s.categories ?? []},
      ${s.tool_names ?? []},
      ${s.prompt_names ?? []},
      ${s.works_with ?? []},
      ${s.visibility ?? []},
      ${remote ? sql.json(remote) : null},
      ${local ? sql.json(local) : null},
      ${n(s.permissions)},
      ${s.has_mcp_app ?? false},
      ${n(s.claude_code_copy_text)},
      ${n(s.directory_url)},
      ${n(s.background_pattern)},
      ${n(s.server_label)},
      ${n(s.sort_order)},
      ${n(s.rank)},
      ${n(s.popularity_score)},
      ${n(s.trending_score)},
      ${addedAt},
      ${fetchedAt},
      ${sql.json(s)}
    )
    on conflict (id) do update set
      slug = excluded.slug,
      name = excluded.name,
      display_name = excluded.display_name,
      one_liner = excluded.one_liner,
      description = excluded.description,
      author_name = excluded.author_name,
      author_url = excluded.author_url,
      icon_url = excluded.icon_url,
      logo = excluded.logo,
      documentation_url = excluded.documentation_url,
      support_url = excluded.support_url,
      privacy_policy_url = excluded.privacy_policy_url,
      type = excluded.type,
      source = excluded.source,
      source_feed = excluded.source_feed,
      categories = excluded.categories,
      tool_names = excluded.tool_names,
      prompt_names = excluded.prompt_names,
      works_with = excluded.works_with,
      visibility = excluded.visibility,
      remote = excluded.remote,
      local = excluded.local,
      permissions = excluded.permissions,
      has_mcp_app = excluded.has_mcp_app,
      claude_code_copy_text = excluded.claude_code_copy_text,
      directory_url = excluded.directory_url,
      background_pattern = excluded.background_pattern,
      server_label = excluded.server_label,
      sort_order = excluded.sort_order,
      rank = excluded.rank,
      popularity_score = excluded.popularity_score,
      trending_score = excluded.trending_score,
      added_at = excluded.added_at,
      fetched_at = excluded.fetched_at,
      raw = excluded.raw,
      updated_at = now()
    returning (xmax = 0) as inserted
  `;
  if (result[0]?.inserted) inserted++;
  else updated++;
}

console.log(`Done. Inserted ${inserted}, updated ${updated}.`);
await sql.end();
