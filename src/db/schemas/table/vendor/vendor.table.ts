import { relations } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_bool, db_created_at, db_id, db_updated_at } from "../../db-utils";
import { MedicineTable } from "../medicine/medicine.table";
import { PurchaseReturnTable, PurchaseTable } from "../purchase";
import { VendorPaymentTable } from "./vendorPayment.table";

export const VendorTable = sqliteTable(
  "vendors",
  {
    id: db_id,
    name: text("name").notNull(),
    phone: text("phone"),
    address: text("address"),
    note: text("note"),
    isActive: db_bool("is_active").notNull().default(true),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [index("vendor_name_idx").on(table.name)]
);

export const VendorRelations = relations(VendorTable, ({ many }) => ({
  medicines: many(MedicineTable, { relationName: "MedicineToVendor" }),
  purchases: many(PurchaseTable, { relationName: "PurchaseToVendor" }),
  payments: many(VendorPaymentTable, { relationName: "VendorPaymentToVendor" }),
  returns: many(PurchaseReturnTable, {
    relationName: "PurchaseReturnToVendor",
  }),
}));

export const insertVendorSchema = createInsertSchema(VendorTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectVendorSchema = createSelectSchema(VendorTable, {
  id: z.uuid(),
});
export const updateVendorSchema = createUpdateSchema(VendorTable, {
  id: z.uuid().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VendorDataModel = typeof VendorTable.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type SelectVendor = z.infer<typeof selectVendorSchema>;
export type UpdateVendor = z.infer<typeof updateVendorSchema>;
