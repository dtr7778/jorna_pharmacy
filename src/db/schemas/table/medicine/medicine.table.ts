import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_bool, db_created_at, db_id, db_updated_at } from "../../db-utils";
import { MedicineTypeEnum } from "../../enums/db-enums";
import { PurchaseItemTable } from "../purchase";
import { VendorTable } from "../vendor/vendor.table";
import { MedicineCategoryTable } from "./medicineCategory.table";

export const MedicineTable = sqliteTable(
  "medicines",
  {
    id: db_id,
    name: text("name").notNull(),
    genericName: text("generic_name"),
    strength: text("strength"),
    categoryId: text("category_id"),
    vendorId: text("vendor_id"),
    type: MedicineTypeEnum("type").notNull(),
    baseUnit: text("base_unit").notNull(),
    barcode: text("barcode"),
    rackLocation: text("rack_location"),
    minimumStock: integer("minimum_stock").notNull().default(0),
    isActive: db_bool("is_active").notNull().default(true),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "medicine_category_fkey",
      columns: [table.categoryId],
      foreignColumns: [MedicineCategoryTable.id],
    }).onDelete("set null"),
    foreignKey({
      name: "medicine_vendor_fkey",
      columns: [table.vendorId],
      foreignColumns: [VendorTable.id],
    }).onDelete("set null"),
    index("medicine_barcode_idx").on(table.barcode),
    index("medicine_name_idx").on(table.name),
    index("medicine_categoryId_idx").on(table.categoryId),
    index("medicine_vendorId_idx").on(table.vendorId),
  ]
);

export const MedicineRelations = relations(MedicineTable, ({ one, many }) => ({
  category: one(MedicineCategoryTable, {
    fields: [MedicineTable.categoryId],
    references: [MedicineCategoryTable.id],
    relationName: "MedicineToCategory",
  }),
  vendor: one(VendorTable, {
    fields: [MedicineTable.vendorId],
    references: [VendorTable.id],
    relationName: "MedicineToVendor",
  }),
  batches: many(PurchaseItemTable, { relationName: "PurchaseItemToMedicine" }),
}));

export const insertMedicineSchema = createInsertSchema(MedicineTable, {
  categoryId: z.uuid().nullish(),
  vendorId: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const selectMedicineSchema = createSelectSchema(MedicineTable, {
  id: z.uuid(),
  categoryId: z.uuid().nullable(),
  vendorId: z.uuid().nullable(),
});
export const updateMedicineSchema = createUpdateSchema(MedicineTable, {
  id: z.uuid().optional(),
  categoryId: z.uuid().nullish(),
  vendorId: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type MedicineDataModel = typeof MedicineTable.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type SelectMedicine = z.infer<typeof selectMedicineSchema>;
export type UpdateMedicine = z.infer<typeof updateMedicineSchema>;
