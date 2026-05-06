import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  website: varchar("website", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }).notNull(),
  companySize: varchar("company_size", { length: 255 }).notNull(),
  creatorId: varchar("creator_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
