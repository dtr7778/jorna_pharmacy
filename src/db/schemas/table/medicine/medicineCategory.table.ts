import { relations } from "drizzle-orm";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id, db_updated_at } from "../../db-utils";
import { MedicineTable } from "./medicine.table";

export const MedicineCategoryTable = sqliteTable(
  "medicine_categories",
  {
    id: db_id,
    name: text("name").notNull(),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [uniqueIndex("medicineCategory_name_idx").on(table.name)]
);

export const MedicineCategoryRelations = relations(
  MedicineCategoryTable,
  ({ many }) => ({
    medicines: many(MedicineTable, { relationName: "MedicineToCategory" }),
  })
);

export const insertMedicineCategorySchema = createInsertSchema(
  MedicineCategoryTable
).omit({ id: true, createdAt: true, updatedAt: true });
export const selectMedicineCategorySchema = createSelectSchema(
  MedicineCategoryTable,
  { id: z.uuid() }
);
export const updateMedicineCategorySchema = createUpdateSchema(
  MedicineCategoryTable,
  { id: z.uuid().optional() }
).omit({ id: true, createdAt: true, updatedAt: true });

export type MedicineCategoryDataModel =
  typeof MedicineCategoryTable.$inferSelect;
export type InsertMedicineCategory = z.infer<
  typeof insertMedicineCategorySchema
>;
export type SelectMedicineCategory = z.infer<
  typeof selectMedicineCategorySchema
>;
export type UpdateMedicineCategory = z.infer<
  typeof updateMedicineCategorySchema
>;
