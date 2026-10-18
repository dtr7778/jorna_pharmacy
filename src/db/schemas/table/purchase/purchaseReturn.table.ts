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
import { VendorTable } from "../vendor";
import { PurchaseTable } from "./purchase.table";
import { PurchaseReturnItemTable } from "./purchaseReturnItem.table";

export const PurchaseReturnTable = sqliteTable(
  "purchase_returns",
  {
    id: db_id,
    vendorId: text("vendor_id").notNull(),
    purchaseId: text("purchase_id").notNull(),
    totalAmount: db_money("total_amount").notNull(),
    reason: text("reason"),
    createdBy: text("created_by"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "purchaseReturn_vendor_fkey",
      columns: [table.vendorId],
      foreignColumns: [VendorTable.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "purchaseReturn_purchase_fkey",
      columns: [table.purchaseId],
      foreignColumns: [PurchaseTable.id],
    }).onDelete("set null"),
    foreignKey({
      name: "purchaseReturn_createdBy_fkey",
      columns: [table.createdBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    index("purchaseReturn_vendorId_idx").on(table.vendorId),
    index("purchaseReturn_createdBy_idx").on(table.createdBy),
  ]
);

export const PurchaseReturnRelations = relations(
  PurchaseReturnTable,
  ({ one, many }) => ({
    vendor: one(VendorTable, {
      fields: [PurchaseReturnTable.vendorId],
      references: [VendorTable.id],
      relationName: "PurchaseReturnToVendor",
    }),
    purchase: one(PurchaseTable, {
      fields: [PurchaseReturnTable.purchaseId],
      references: [PurchaseTable.id],
      relationName: "PurchaseReturnToPurchase",
    }),
    createdByUser: one(UserTable, {
      fields: [PurchaseReturnTable.createdBy],
      references: [UserTable.id],
      relationName: "PurchaseReturnToCreatedBy",
    }),
    items: many(PurchaseReturnItemTable, {
      relationName: "PurchaseReturnItemToPurchaseReturn",
    }),
  })
);

export const insertPurchaseReturnSchema = createInsertSchema(
  PurchaseReturnTable,
  {
    vendorId: z.uuid(),
    purchaseId: z.uuid().nullish(),
    createdBy: z.uuid().nullish(),
  }
).omit({ id: true, createdAt: true, updatedAt: true });
export const selectPurchaseReturnSchema = createSelectSchema(
  PurchaseReturnTable,
  {
    id: z.uuid(),
    vendorId: z.uuid(),
    purchaseId: z.uuid().nullable(),
    createdBy: z.uuid().nullable(),
  }
);
export const updatePurchaseReturnSchema = createUpdateSchema(
  PurchaseReturnTable,
  {
    id: z.uuid().optional(),
    vendorId: z.uuid().optional(),
    purchaseId: z.uuid().nullish(),
    createdBy: z.uuid().nullish(),
  }
).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type PurchaseReturnDataModel = typeof PurchaseReturnTable.$inferSelect;
export type InsertPurchaseReturn = z.infer<typeof insertPurchaseReturnSchema>;
export type SelectPurchaseReturn = z.infer<typeof selectPurchaseReturnSchema>;
export type UpdatePurchaseReturn = z.infer<typeof updatePurchaseReturnSchema>;
