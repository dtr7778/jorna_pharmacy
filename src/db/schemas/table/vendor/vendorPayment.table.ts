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
import { PurchaseTable } from "../purchase";
import { UserTable } from "../user";
import { VendorTable } from "./vendor.table";

export const VendorPaymentTable = sqliteTable(
  "vendor_payments",
  {
    id: db_id,
    vendorId: text("vendor_id").notNull(),
    purchaseId: text("purchase_id"),
    amount: db_money("amount").notNull(),
    note: text("note"),
    createdBy: text("created_by"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "vendorPayment_vendor_fkey",
      columns: [table.vendorId],
      foreignColumns: [VendorTable.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "vendorPayment_purchase_fkey",
      columns: [table.purchaseId],
      foreignColumns: [PurchaseTable.id],
    }).onDelete("set null"),
    foreignKey({
      name: "vendorPayment_createdBy_fkey",
      columns: [table.createdBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    check("vendorPayment_amount_chk", sql`${table.amount} > 0`),
    index("vendorPayment_vendorId_idx").on(table.vendorId),
    index("vendorPayment_createdAt_idx").on(table.createdAt),
    index("vendorPayment_createdBy_idx").on(table.createdBy),
  ]
);

export const VendorPaymentRelations = relations(
  VendorPaymentTable,
  ({ one }) => ({
    vendor: one(VendorTable, {
      fields: [VendorPaymentTable.vendorId],
      references: [VendorTable.id],
      relationName: "VendorPaymentToVendor",
    }),
    createdByUser: one(UserTable, {
      fields: [VendorPaymentTable.createdBy],
      references: [UserTable.id],
      relationName: "VendorPaymentToCreatedBy",
    }),
    purchase: one(PurchaseTable, {
      fields: [VendorPaymentTable.purchaseId],
      references: [PurchaseTable.id],
      relationName: "VendorPaymentToPurchase",
    }),
  })
);

export const insertVendorPaymentSchema = createInsertSchema(
  VendorPaymentTable,
  {
    vendorId: z.uuid(),
    purchaseId: z.uuid().nullish(),
    createdBy: z.uuid().nullish(),
    amount: z.number().int().positive(),
  }
).omit({ id: true, createdAt: true, updatedAt: true });
export const selectVendorPaymentSchema = createSelectSchema(
  VendorPaymentTable,
  {
    id: z.uuid(),
    vendorId: z.uuid(),
    purchaseId: z.uuid().nullable(),
    createdBy: z.uuid().nullable(),
  }
);
export const updateVendorPaymentSchema = createUpdateSchema(
  VendorPaymentTable,
  {
    id: z.uuid().optional(),
    vendorId: z.uuid().optional(),
    purchaseId: z.uuid().nullish(),
    createdBy: z.uuid().nullish(),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  vendorId: true,
});

export type VendorPaymentDataModel = typeof VendorPaymentTable.$inferSelect;
export type InsertVendorPayment = z.infer<typeof insertVendorPaymentSchema>;
export type SelectVendorPayment = z.infer<typeof selectVendorPaymentSchema>;
export type UpdateVendorPayment = z.infer<typeof updateVendorPaymentSchema>;
