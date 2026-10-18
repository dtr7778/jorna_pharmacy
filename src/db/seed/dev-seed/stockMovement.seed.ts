import type { DatabaseType } from "../../clients/drizzle-client";
import type {
  PurchaseDataModel,
  PurchaseItemDataModel,
  PurchaseReturnDataModel,
  PurchaseReturnItemDataModel,
  SaleDataModel,
  SaleItemDataModel,
} from "../../schemas";
import { StockMovementTable } from "../../schemas";
import { insertChunked } from "../seed-utils";

type StockMovementInsert = typeof StockMovementTable.$inferInsert;

export async function seedStockMovements(
  db: DatabaseType,
  {
    purchases,
    purchaseItems,
    sales,
    saleItems,
    purchaseReturns,
    purchaseReturnItems,
  }: {
    purchases: Array<PurchaseDataModel>;
    purchaseItems: Array<PurchaseItemDataModel>;
    sales: Array<SaleDataModel>;
    saleItems: Array<SaleItemDataModel>;
    purchaseReturns: Array<PurchaseReturnDataModel>;
    purchaseReturnItems: Array<PurchaseReturnItemDataModel>;
  }
): Promise<void> {
  console.log("🌱 Seeding stock movements...");

  const purchaseById = new Map(purchases.map((row) => [row.id, row] as const));
  const saleById = new Map(sales.map((row) => [row.id, row] as const));
  const returnById = new Map(
    purchaseReturns.map((row) => [row.id, row] as const)
  );

  const movementsData: Array<StockMovementInsert> = [
    ...purchaseItems.map((item) => {
      const purchase = purchaseById.get(item.purchaseId)!;
      return {
        purchaseItemId: item.id,
        movementType: "purchase",
        qtyChange: item.qtyPurchased,
        refTable: "purchases",
        refId: purchase.id,
        createdBy: purchase.createdBy,
        createdAt: purchase.createdAt,
      } satisfies StockMovementInsert;
    }),
    ...saleItems.map((item) => {
      const sale = saleById.get(item.saleId)!;
      return {
        purchaseItemId: item.purchaseItemId,
        movementType: "sale",
        qtyChange: -item.qty,
        refTable: "sales",
        refId: sale.id,
        createdBy: sale.createdBy,
        createdAt: sale.createdAt,
      } satisfies StockMovementInsert;
    }),
    ...purchaseReturnItems.map((item) => {
      const purchaseReturn = returnById.get(item.purchaseReturnId)!;
      return {
        purchaseItemId: item.purchaseItemId,
        movementType: "purchase_return",
        qtyChange: -item.qty,
        refTable: "purchase_returns",
        refId: purchaseReturn.id,
        reason: purchaseReturn.reason,
        createdBy: purchaseReturn.createdBy,
        createdAt: purchaseReturn.createdAt,
      } satisfies StockMovementInsert;
    }),
  ];

  await insertChunked(movementsData, (chunk) =>
    db.insert(StockMovementTable).values(chunk)
  );

  console.log(`✅ ${movementsData.length} Stock movements seeded`);
}
