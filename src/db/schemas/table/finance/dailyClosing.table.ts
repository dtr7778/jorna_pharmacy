import { relations } from "drizzle-orm";
import { foreignKey, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id, db_money, db_updated_at } from "../../db-utils";
import { UserTable } from "../user";

export const DailyClosingTable = sqliteTable(
  "daily_closings",
  {
    id: db_id,
    openingCash: db_money("opening_cash").default(0),
    totalSales: db_money("total_sales").notNull(), // billed
    totalReturns: db_money("total_returns").notNull().default(0),
    cashReceived: db_money("cash_received").notNull(), // customer payments that day
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
      name: "dailyClosing_closedBy_fkey",
      columns: [table.closedBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    index("dailyClosing_closedBy_idx").on(table.closedBy),
  ]
);

export const DailyClosingRelations = relations(
  DailyClosingTable,
  ({ one }) => ({
    closedByUser: one(UserTable, {
      fields: [DailyClosingTable.closedBy],
      references: [UserTable.id],
      relationName: "DailyClosingToClosedBy",
    }),
  })
);

export const insertDailyClosingSchema = createInsertSchema(DailyClosingTable, {
  closedBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const selectDailyClosingSchema = createSelectSchema(DailyClosingTable, {
  id: z.uuid(),
  closedBy: z.uuid().nullable(),
});
export const updateDailyClosingSchema = createUpdateSchema(DailyClosingTable, {
  id: z.uuid().optional(),
  closedBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type DailyClosingDataModel = typeof DailyClosingTable.$inferSelect;
export type InsertDailyClosing = z.infer<typeof insertDailyClosingSchema>;
export type SelectDailyClosing = z.infer<typeof selectDailyClosingSchema>;
export type UpdateDailyClosing = z.infer<typeof updateDailyClosingSchema>;
