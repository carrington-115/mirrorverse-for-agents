import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  or,
  schema,
  sql,
  type Database,
  type SQL,
} from "@mirrorverse/db";

const { mcpDirectoryEntries } = schema;

export interface ListArgs {
  readonly category?: string;
  readonly type?: "remote" | "local";
  readonly search?: string;
  readonly cursor?: string;
  readonly limit: number;
}

export async function listEntries(db: Database, args: ListArgs) {
  const filters: SQL[] = [];
  if (args.category) {
    filters.push(
      sql`${args.category} = any(${mcpDirectoryEntries.categories})`,
    );
  }
  if (args.type) {
    filters.push(eq(mcpDirectoryEntries.type, args.type));
  }
  if (args.search) {
    const pattern = `%${args.search}%`;
    const searchFilter = or(
      ilike(mcpDirectoryEntries.displayName, pattern),
      ilike(mcpDirectoryEntries.name, pattern),
      ilike(mcpDirectoryEntries.oneLiner, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }
  if (args.cursor) {
    filters.push(gt(mcpDirectoryEntries.id, args.cursor));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const rows = await db
    .select()
    .from(mcpDirectoryEntries)
    .where(where)
    .orderBy(
      desc(mcpDirectoryEntries.popularityScore),
      asc(mcpDirectoryEntries.id),
    )
    .limit(args.limit + 1);

  const hasMore = rows.length > args.limit;
  const items = hasMore ? rows.slice(0, args.limit) : rows;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}

export async function getEntryBySlug(db: Database, slug: string) {
  const [row] = await db
    .select()
    .from(mcpDirectoryEntries)
    .where(eq(mcpDirectoryEntries.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function listByCategory(
  db: Database,
  category: string,
  limit: number,
) {
  return db
    .select()
    .from(mcpDirectoryEntries)
    .where(sql`${category} = any(${mcpDirectoryEntries.categories})`)
    .orderBy(desc(mcpDirectoryEntries.popularityScore))
    .limit(limit);
}
