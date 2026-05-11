import type { Database } from "@mirrorverse/db";

import * as repo from "./repo";
import type { ByCategoryInput, GetBySlugInput, ListInput } from "./inputs";

export const mcpDirectoryService = {
  list: (db: Database, input: ListInput) => repo.listEntries(db, input),
  getBySlug: (db: Database, input: GetBySlugInput) =>
    repo.getEntryBySlug(db, input.slug),
  byCategory: (db: Database, input: ByCategoryInput) =>
    repo.listByCategory(db, input.category, input.limit),
};
