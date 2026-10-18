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
import { ExpenseCategoryTable } from "./expenseCategory.table";

export const ExpenseTable = sqliteTable(
  "expenses",
  {
    id: db_id,
    categoryId: text("category_id").notNull(),
    amount: db_money("amount").notNull(),
    note: text("note"),
    createdBy: text("created_by"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "expense_category_fkey",
      columns: [table.categoryId],
      foreignColumns: [ExpenseCategoryTable.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "expense_createdBy_fkey",
      columns: [table.createdBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    check("expense_amount_chk", sql`${table.amount} > 0`),
    index("expense_categoryId_idx").on(table.categoryId),
    index("expense_createdBy_idx").on(table.createdBy),
    index("expense_createdAt_idx").on(table.createdAt),
  ]
);

export const ExpenseRelations = relations(ExpenseTable, ({ one }) => ({
  category: one(ExpenseCategoryTable, {
    fields: [ExpenseTable.categoryId],
    references: [ExpenseCategoryTable.id],
    relationName: "ExpenseToCategory",
  }),
  createdByUser: one(UserTable, {
    fields: [ExpenseTable.createdBy],
    references: [UserTable.id],
    relationName: "ExpenseToCreatedBy",
  }),
}));

export const insertExpenseSchema = createInsertSchema(ExpenseTable, {
  categoryId: z.uuid(),
  createdBy: z.uuid().nullish(),
  amount: z.number().int().positive(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const selectExpenseSchema = createSelectSchema(ExpenseTable, {
  id: z.uuid(),
  categoryId: z.uuid(),
  createdBy: z.uuid().nullable(),
});
export const updateExpenseSchema = createUpdateSchema(ExpenseTable, {
  id: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  createdBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type ExpenseDataModel = typeof ExpenseTable.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type SelectExpense = z.infer<typeof selectExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
