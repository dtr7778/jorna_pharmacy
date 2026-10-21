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

import {
  db_created_at,
  db_date,
  db_id,
  db_money,
  db_updated_at,
} from "../../db-utils";
import { UserTable } from "../user";

export const CashClosingTable = sqliteTable(
  "cash_closings",
  {
    id: db_id,
    periodStart: db_date("period_start").notNull(),
    periodEnd: db_date("period_end").notNull(),
    openingCash: db_money("opening_cash").default(0),
    totalSales: db_money("total_sales").notNull(), // billed
    totalReturns: db_money("total_returns").notNull().default(0),
    cashReceived: db_money("cash_received").notNull(), // customer payments in the period
    vendorPaid: db_money("vendor_paid").default(0),
    totalExpenses: db_money("total_expenses").notNull().default(0),
    totalSalary: db_money("total_salary").notNull(),
    expectedCash: db_money("expected_cash"),
    countedCash: db_money("counted_cash"), // physically counted in drawer
    difference: db_money("difference"), // counted - expected
    closedBy: text("closed_by"),
    note: text("note"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "cashClosing_closedBy_fkey",
      columns: [table.closedBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    check(
      "cashClosing_period_chk",
      sql`${table.periodEnd} > ${table.periodStart}`
    ),
    index("cashClosing_closedBy_idx").on(table.closedBy),
    index("cashClosing_periodStart_idx").on(table.periodStart),
  ]
);

export const CashClosingRelations = relations(CashClosingTable, ({ one }) => ({
  closedByUser: one(UserTable, {
    fields: [CashClosingTable.closedBy],
    references: [UserTable.id],
    relationName: "CashClosingToClosedBy",
  }),
}));

export const insertCashClosingSchema = createInsertSchema(CashClosingTable, {
  closedBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const selectCashClosingSchema = createSelectSchema(CashClosingTable, {
  id: z.uuid(),
  closedBy: z.uuid().nullable(),
});
export const updateCashClosingSchema = createUpdateSchema(CashClosingTable, {
  id: z.uuid().optional(),
  closedBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type CashClosingDataModel = typeof CashClosingTable.$inferSelect;
export type InsertCashClosing = z.infer<typeof insertCashClosingSchema>;
export type SelectCashClosing = z.infer<typeof selectCashClosingSchema>;
export type UpdateCashClosing = z.infer<typeof updateCashClosingSchema>;
