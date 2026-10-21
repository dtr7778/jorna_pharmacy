import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";

import type { DatabaseType } from "@/db/clients/drizzle-client";
import { PurchaseInvoiceTable } from "@/db/schemas";

const INVOICE_RESERVATION_MINUTES = 30;

export async function reserveInvoice(db: DatabaseType, userId: string) {
  const now = new Date();
  const reservedUntil = new Date(
    now.getTime() + INVOICE_RESERVATION_MINUTES * 60 * 1000
  );

  const availableInvoice = db
    .select({ id: PurchaseInvoiceTable.id })
    .from(PurchaseInvoiceTable)
    .where(
      and(
        eq(PurchaseInvoiceTable.isLinked, false),
        or(
          isNull(PurchaseInvoiceTable.reservedUntil),
          lt(PurchaseInvoiceTable.reservedUntil, now)
        )
      )
    )
    .orderBy(sql`CAST(${PurchaseInvoiceTable.number} AS INTEGER)`)
    .limit(1);

  const [reusedInvoice] = await db
    .update(PurchaseInvoiceTable)
    .set({ reservedBy: userId, reservedUntil })
    .where(eq(PurchaseInvoiceTable.id, sql`(${availableInvoice})`))
    .returning({
      id: PurchaseInvoiceTable.id,
      number: PurchaseInvoiceTable.number,
    });

  if (reusedInvoice) {
    return reusedInvoice;
  }

  const [createdInvoice] = await db
    .insert(PurchaseInvoiceTable)
    .values({
      number: sql`(SELECT printf('%04d', COALESCE(MAX(CAST(${PurchaseInvoiceTable.number} AS INTEGER)), 0) + 1) FROM ${PurchaseInvoiceTable})`,
      reservedBy: userId,
      reservedUntil,
    })
    .returning({
      id: PurchaseInvoiceTable.id,
      number: PurchaseInvoiceTable.number,
    });

  if (!createdInvoice) {
    throw new Error("Failed to reserve purchase invoice number");
  }

  return createdInvoice;
}

export async function claimInvoice(
  db: DatabaseType,
  invoiceId: string,
  userId: string
) {
  const [claimedInvoice] = await db
    .update(PurchaseInvoiceTable)
    .set({ isLinked: true })
    .where(
      and(
        eq(PurchaseInvoiceTable.id, invoiceId),
        eq(PurchaseInvoiceTable.isLinked, false),
        eq(PurchaseInvoiceTable.reservedBy, userId),
        gt(PurchaseInvoiceTable.reservedUntil, new Date())
      )
    )
    .returning({ id: PurchaseInvoiceTable.id });

  return claimedInvoice;
}

export async function releaseInvoice(db: DatabaseType, invoiceId: string) {
  await db
    .update(PurchaseInvoiceTable)
    .set({ isLinked: false })
    .where(eq(PurchaseInvoiceTable.id, invoiceId));
}
