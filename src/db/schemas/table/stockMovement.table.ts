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

import { db_created_at, db_id } from "../db-utils";
import { StockMovementTypeEnum } from "../enums/db-enums";
import { PurchaseItemTable } from "./purchase";
import { UserTable } from "./user";

export const StockMovementTable = sqliteTable(
  "stock_movements",
  {
    id: db_id,
    purchaseItemId: text("purchase_item_id").notNull(),
    movementType: StockMovementTypeEnum("movement_type").notNull(),
    qtyChange: integer("qty_change").notNull(), // + in, - out (base units)
    refTable: text("ref_table"), // e.g. "sales"
    refId: text("ref_id"), // id of the sale/purchase/return that caused it
    reason: text("reason"), // required for adjustment/expired/damaged
    createdBy: text("created_by"),
    createdAt: db_created_at,
  },
  (table) => [
    foreignKey({
      name: "stockMovement_purchaseItem_fkey",
      columns: [table.purchaseItemId],
      foreignColumns: [PurchaseItemTable.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "stockMovement_createdBy_fkey",
      columns: [table.createdBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    index("stockMovement_purchaseItemId_idx").on(table.purchaseItemId),
    index("stockMovement_ref_idx").on(table.refTable, table.refId),
    index("stockMovement_createdAt_idx").on(table.createdAt),
  ]
);

export const StockMovementRelations = relations(
  StockMovementTable,
  ({ one }) => ({
    purchaseItem: one(PurchaseItemTable, {
      fields: [StockMovementTable.purchaseItemId],
      references: [PurchaseItemTable.id],
      relationName: "StockMovementToPurchaseItem",
    }),
  })
);

export const insertStockMovementSchema = createInsertSchema(
  StockMovementTable,
  {
    purchaseItemId: z.uuid(),
    refId: z.uuid().nullish(),
    createdBy: z.uuid().nullish(),
  }
).omit({ id: true, createdAt: true });
export const selectStockMovementSchema = createSelectSchema(
  StockMovementTable,
  {
    id: z.uuid(),
    purchaseItemId: z.uuid(),
    refId: z.uuid().nullable(),
    createdBy: z.uuid().nullable(),
  }
);
export const updateStockMovementSchema = createUpdateSchema(
  StockMovementTable,
  {
    id: z.uuid().optional(),
    purchaseItemId: z.uuid().optional(),
    refId: z.uuid().nullish(),
    createdBy: z.uuid().nullish(),
  }
).omit({ id: true, createdAt: true, createdBy: true, purchaseItemId: true });

export type StockMovementDataModel = typeof StockMovementTable.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type SelectStockMovement = z.infer<typeof selectStockMovementSchema>;
export type UpdateStockMovement = z.infer<typeof updateStockMovementSchema>;
