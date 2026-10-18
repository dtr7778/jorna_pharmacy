import { relations } from "drizzle-orm";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id, db_updated_at } from "../../db-utils";
import { ExpenseTable } from "./expense.table";

export const ExpenseCategoryTable = sqliteTable(
  "expense_categories",
  {
    id: db_id,
    name: text("name").notNull(),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [uniqueIndex("expenseCategory_name_idx").on(table.name)]
);

export const ExpenseCategoryRelations = relations(
  ExpenseCategoryTable,
  ({ many }) => ({
    expenses: many(ExpenseTable, { relationName: "ExpenseToCategory" }),
  })
);

export const insertExpenseCategorySchema = createInsertSchema(
  ExpenseCategoryTable
).omit({ id: true, createdAt: true, updatedAt: true });
export const selectExpenseCategorySchema = createSelectSchema(
  ExpenseCategoryTable,
  { id: z.uuid() }
);
export const updateExpenseCategorySchema = createUpdateSchema(
  ExpenseCategoryTable,
  { id: z.uuid().optional() }
).omit({ id: true, createdAt: true, updatedAt: true });

export type ExpenseCategoryDataModel = typeof ExpenseCategoryTable.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type SelectExpenseCategory = z.infer<typeof selectExpenseCategorySchema>;
export type UpdateExpenseCategory = z.infer<typeof updateExpenseCategorySchema>;
