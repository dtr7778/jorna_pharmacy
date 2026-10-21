import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";

import {
  db_bool,
  db_created_at,
  db_date,
  db_id,
  db_updated_at,
} from "../../db-utils";
import { UserTable } from "../user";
import { PurchaseTable } from "./purchase.table";

export const PurchaseInvoiceTable = sqliteTable(
  "purchase_invoices",
  {
    id: db_id,
    number: text("number").notNull(),
    isLinked: db_bool("is_linked").notNull().default(false),
    reservedBy: text("reserved_by"),
    reservedUntil: db_date("reserved_until"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "purchase_invoice_reservedBy_fkey",
      columns: [table.reservedBy],
      foreignColumns: [UserTable.id],
    }).onDelete("set null"),
    uniqueIndex("purchase_invoice_number_idx").on(table.number),
    index("purchase_invoice_reservation_idx").on(
      table.isLinked,
      table.reservedUntil
    ),
  ]
);

export const PurchaseInvoiceRelations = relations(
  PurchaseInvoiceTable,
  ({ one }) => ({
    purchase: one(PurchaseTable, {
      fields: [PurchaseInvoiceTable.id],
      references: [PurchaseTable.invoiceId],
      relationName: "PurchaseToInvoice",
    }),
    reservedByUser: one(UserTable, {
      fields: [PurchaseInvoiceTable.reservedBy],
      references: [UserTable.id],
      relationName: "PurchaseInvoiceToReservedBy",
    }),
  })
);

export const selectPurchaseInvoiceSchema =
  createSelectSchema(PurchaseInvoiceTable);
export type SelectPurchaseInvoice = typeof PurchaseInvoiceTable.$inferSelect;
