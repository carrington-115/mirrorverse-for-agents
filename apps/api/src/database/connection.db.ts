import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function connectToDatabase() {
  const queryClient = postgres(process.env.DATABASE_URL!);
  const db = drizzle(queryClient, { casing: "snake_case" });
  return db;
}
