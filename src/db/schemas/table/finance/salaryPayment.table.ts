import { relations, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id, db_money, db_updated_at } from "../../db-utils";
import { UserTable } from "../user";

export const SalaryPaymentTable = sqliteTable(
  "salary_payments",
  {
    id: db_id,
    userId: text("user_id").notNull(),
    amount: db_money("amount").notNull(),
    note: text("note"),
    createdBy: text("created_by"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "salaryPayment_user_fkey",
      columns: [table.userId],
      foreignColumns: [UserTable.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "salaryPayment_createdBy_fkey",
      columns: [table.createdBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    check("salaryPayment_amount_chk", sql`${table.amount} > 0`),
    index("salaryPayment_userId_idx").on(table.userId),
    index("salaryPayment_createdBy_idx").on(table.createdBy),
    index("salaryPayment_createdAt_idx").on(table.createdAt),
  ]
);

export const SalaryPaymentRelations = relations(
  SalaryPaymentTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [SalaryPaymentTable.userId],
      references: [UserTable.id],
      relationName: "SalaryPaymentToUser",
    }),
    createdByUser: one(UserTable, {
      fields: [SalaryPaymentTable.createdBy],
      references: [UserTable.id],
      relationName: "SalaryPaymentToCreatedBy",
    }),
  })
);

export const insertSalaryPaymentSchema = createInsertSchema(
  SalaryPaymentTable,
  {
    userId: z.uuid(),
    createdBy: z.uuid().nullish(),
    amount: z.number().int().positive(),
  }
).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSalaryPaymentSchema = createSelectSchema(
  SalaryPaymentTable,
  {
    id: z.uuid(),
    userId: z.uuid(),
    createdBy: z.uuid().nullable(),
    amount: z.number().int().positive(),
  }
);
export const updateSalaryPaymentSchema = createUpdateSchema(
  SalaryPaymentTable,
  {
    id: z.uuid().optional(),
    userId: z.uuid().optional(),
    createdBy: z.uuid().nullish(),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  userId: true,
});

export type SalaryPaymentDataModel = typeof SalaryPaymentTable.$inferSelect;
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;
export type SelectSalaryPayment = z.infer<typeof selectSalaryPaymentSchema>;
export type UpdateSalaryPayment = z.infer<typeof updateSalaryPaymentSchema>;
