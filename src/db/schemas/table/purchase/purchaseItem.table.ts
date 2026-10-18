import { relations, sql } from "drizzle-orm";
import {
  check,
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

import {
  db_created_at,
  db_date,
  db_id,
  db_money,
  db_updated_at,
} from "../../db-utils";
import { MedicineTable } from "../medicine";
import { PurchaseTable } from "./purchase.table";

export const PurchaseItemTable = sqliteTable(
  "purchase_items",
  {
    id: db_id,
    purchaseId: text("purchase_id").notNull(),
    medicineId: text("medicine_id").notNull(),
    batchNo: text("batch_no"),
    tabletsPerStrip: integer("tablets_per_strip"),
    stripsPerBox: integer("strips_per_box"),
    qtyPurchased: integer("qty_purchased").notNull(),
    qtyRemaining: integer("qty_remaining").notNull(),
    costPerUnit: db_money("cost_per_unit").notNull(),
    sellPricePerUnit: db_money("sell_price_per_unit").notNull(),
    expiryDate: db_date("expiry_date"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "purchaseItem_purchase_fkey",
      columns: [table.purchaseId],
      foreignColumns: [PurchaseTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "purchaseItem_medicine_fkey",
      columns: [table.medicineId],
      foreignColumns: [MedicineTable.id],
    }).onDelete("restrict"),
    check(
      "purchaseItem_qty_chk",
      sql`${table.qtyPurchased} > 0 AND ${table.qtyRemaining} >= 0 AND ${table.qtyRemaining} <= ${table.qtyPurchased}`
    ),
    check(
      "purchaseItem_packaging_chk",
      sql`(${table.tabletsPerStrip} IS NULL OR ${table.tabletsPerStrip} > 0) AND (${table.stripsPerBox} IS NULL OR ${table.stripsPerBox} > 0)`
    ),
    index("purchaseItem_purchaseId_idx").on(table.purchaseId),
    index("purchaseItem_medicineExpiry_idx").on(
      table.medicineId,
      table.expiryDate
    ),
  ]
);

export const PurchaseItemRelations = relations(
  PurchaseItemTable,
  ({ one }) => ({
    purchase: one(PurchaseTable, {
      fields: [PurchaseItemTable.purchaseId],
      references: [PurchaseTable.id],
      relationName: "PurchaseItemToPurchase",
    }),
    medicine: one(MedicineTable, {
      fields: [PurchaseItemTable.medicineId],
      references: [MedicineTable.id],
      relationName: "PurchaseItemToMedicine",
    }),
  })
);

export const insertPurchaseItemSchema = createInsertSchema(PurchaseItemTable, {
  purchaseId: z.uuid(),
  medicineId: z.uuid(),
  tabletsPerStrip: z.number().int().positive().nullish(),
  stripsPerBox: z.number().int().positive().nullish(),
  qtyPurchased: z.number().int().nonnegative(),
  qtyRemaining: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const selectPurchaseItemSchema = createSelectSchema(PurchaseItemTable, {
  id: z.uuid(),
  purchaseId: z.uuid(),
  medicineId: z.uuid(),
});
export const updatePurchaseItemSchema = createUpdateSchema(PurchaseItemTable, {
  id: z.uuid().optional(),
  purchaseId: z.uuid().optional(),
  medicineId: z.uuid().optional(),
}).omit({
  id: true,
  medicineId: true,
  purchaseId: true,
  createdAt: true,
  updatedAt: true,
});

export type PurchaseItemDataModel = typeof PurchaseItemTable.$inferSelect;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type SelectPurchaseItem = z.infer<typeof selectPurchaseItemSchema>;
export type UpdatePurchaseItem = z.infer<typeof updatePurchaseItemSchema>;
