import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id, db_updated_at } from "../db-utils";

export const VerificationTable = sqliteTable("verifications", {
  id: db_id,
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: db_created_at,
  updatedAt: db_updated_at,
});

export const insertVerificationSchema = createInsertSchema(
  VerificationTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectVerificationSchema = createSelectSchema(VerificationTable, {
  id: z.uuid(),
});
export const updateVerificationSchema = createUpdateSchema(
  VerificationTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VerificationDataModel = typeof VerificationTable.$inferSelect;
export type SelectVerification = z.infer<typeof selectVerificationSchema>;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
