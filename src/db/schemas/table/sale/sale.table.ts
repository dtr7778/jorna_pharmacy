import { relations, sql } from "drizzle-orm";
import {
  check,
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
import { CustomerPaymentTable, CustomerTable } from "../customer";
import { UserTable } from "../user";
import { SaleItemTable } from "./saleItem.table";

export const SaleTable = sqliteTable(
  "sales",
  {
    id: db_id,
    invoiceNo: text("invoice_no").notNull(),
    customerId: text("customer_id"),
    subtotal: db_money("subtotal").notNull(),
    discount: db_money("discount").notNull().default(0),
    totalAmount: db_money("total_amount").notNull(),
    paidAmount: db_money("paid_amount").notNull().default(0),
    createdBy: text("created_by"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "sale_customer_fkey",
      columns: [table.customerId],
      foreignColumns: [CustomerTable.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "sale_createdBy_fkey",
      columns: [table.createdBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    check(
      "sale_walkInPaid_chk",
      sql`${table.customerId} IS NOT NULL OR ${table.paidAmount} = ${table.totalAmount}`
    ),
    uniqueIndex("sale_invoiceNo_idx").on(table.invoiceNo),
    index("sale_customerId_idx").on(table.customerId),
    index("sale_createdAt_idx").on(table.createdAt),
    index("sale_createdBy_idx").on(table.createdBy),
  ]
);

export const SaleRelations = relations(SaleTable, ({ one, many }) => ({
  customer: one(CustomerTable, {
    fields: [SaleTable.customerId],
    references: [CustomerTable.id],
    relationName: "SaleToCustomer",
  }),
  createdByUser: one(UserTable, {
    fields: [SaleTable.createdBy],
    references: [UserTable.id],
    relationName: "SaleToCreatedBy",
  }),
  items: many(SaleItemTable, { relationName: "SaleItemToSale" }),
  payments: many(CustomerPaymentTable, {
    relationName: "CustomerPaymentToSale",
  }),
}));

export const insertSaleSchema = createInsertSchema(SaleTable, {
  customerId: z.uuid().nullish(),
  createdBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSaleSchema = createSelectSchema(SaleTable, {
  id: z.uuid(),
  customerId: z.uuid().nullable(),
  createdBy: z.uuid().nullable(),
});
export const updateSaleSchema = createUpdateSchema(SaleTable, {
  id: z.uuid().optional(),
  customerId: z.uuid().nullish(),
  createdBy: z.uuid().nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type SaleDataModel = typeof SaleTable.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SelectSale = z.infer<typeof selectSaleSchema>;
export type UpdateSale = z.infer<typeof updateSaleSchema>;
