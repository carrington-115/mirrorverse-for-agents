import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Note: this intentionally omits the `& { $client }` that `drizzle()` returns,
// so a transaction handle (PgTransaction) is also assignable to `Database`.
// That lets `withTenantContext` hand services a tenant-scoped transaction
// transparently wherever they expect a `db`.
export type Database = PostgresJsDatabase<typeof schema>;

export function connectToDatabase(connectionString: string): Database {
  const queryClient = postgres(connectionString);
  return drizzle(queryClient, { schema, casing: "snake_case" });
}
