import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id, db_money, db_updated_at } from "../../db-utils";
import { UserTable } from "../user";
import { VendorTable, VendorPaymentTable } from "../vendor";
import { PurchaseItemTable } from "./purchaseItem.table";
import { PurchaseReturnTable } from "./purchaseReturn.table";

export const PurchaseTable = sqliteTable(
  "purchases",
  {
    id: db_id,
    vendorId: text("vendor_id").notNull(),
    vendorInvoiceNo: text("vendor_invoice_no"),
    invoiceNo: text("invoice_no").notNull(),
    subtotal: db_money("subtotal").notNull(),
    discount: db_money("discount").notNull().default(1),
    totalAmount: db_money("total_amount").notNull(),
    paidAmount: db_money("paid_amount").notNull().default(0),
    note: text("note"),
    createdBy: text("created_by"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "purchase_vendor_fkey",
      columns: [table.vendorId],
      foreignColumns: [VendorTable.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "purchase_createdBy_fkey",
      columns: [table.createdBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    uniqueIndex("purchase_vendorInvoice_idx").on(
      table.vendorId,
      table.vendorInvoiceNo
    ),
    index("purchase_vendorId_idx").on(table.vendorId),
    index("purchase_invoice_idx").on(table.invoiceNo),
    index("purchase_createdAt_idx").on(table.createdAt),
  ]
);

export const PurchaseRelations = relations(PurchaseTable, ({ one, many }) => ({
  vendor: one(VendorTable, {
    fields: [PurchaseTable.vendorId],
    references: [VendorTable.id],
    relationName: "PurchaseToVendor",
  }),
  items: many(PurchaseItemTable, { relationName: "PurchaseItemToPurchase" }),
  payments: many(VendorPaymentTable, {
    relationName: "VendorPaymentToPurchase",
  }),
  createdByUser: one(UserTable, {
    fields: [PurchaseTable.createdBy],
    references: [UserTable.id],
    relationName: "PurchaseToCreatedBy",
  }),
  returns: many(PurchaseReturnTable, {
    relationName: "PurchaseReturnToPurchase",
  }),
}));

export const insertPurchaseSchema = createInsertSchema(PurchaseTable, {
  vendorId: z.uuid(),
  createdBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const selectPurchaseSchema = createSelectSchema(PurchaseTable, {
  id: z.uuid(),
  vendorId: z.uuid(),
  createdBy: z.uuid().nullable(),
});
export const updatePurchaseSchema = createUpdateSchema(PurchaseTable, {
  id: z.uuid().optional(),
  vendorId: z.uuid().optional(),
  createdBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type PurchaseDataModel = typeof PurchaseTable.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type SelectPurchase = z.infer<typeof selectPurchaseSchema>;
export type UpdatePurchase = z.infer<typeof updatePurchaseSchema>;
