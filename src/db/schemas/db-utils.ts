import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

export const db_id = text("id")
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID())
  .notNull();

export const db_created_at = integer("created_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`);

export const db_updated_at = integer("updated_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)
  .$onUpdate(() => new Date());

export const db_soft_delete = {
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  deletedBy: text("deleted_by"),
};
