import type { DatabaseType } from "../clients/drizzle-client";
import * as schema from "../schemas";

export async function clearAll(db: DatabaseType) {
  console.log("🧹 Clearing existing data...");

  // Join tables first so their parent rows can be removed safely
  await db.delete(schema.UserRoleTable);
  await db.delete(schema.RolePermissionTable);

  await db.delete(schema.UserEventTable);
  await db.delete(schema.UserSessionTable);
  await db.delete(schema.UserDeviceTable);
  await db.delete(schema.AccountTable);
  await db.delete(schema.SessionTable);
  await db.delete(schema.VerificationTable);

  // Business data: children before parents, users last
  await db.delete(schema.StockMovementTable);
  await db.delete(schema.CustomerPaymentTable);
  await db.delete(schema.VendorPaymentTable);
  await db.delete(schema.SalaryPaymentTable);
  await db.delete(schema.ExpenseTable);
  await db.delete(schema.CashClosingTable);
  await db.delete(schema.SaleItemTable);
  await db.delete(schema.SaleTable);
  await db.delete(schema.PurchaseReturnItemTable);
  await db.delete(schema.PurchaseReturnTable);
  await db.delete(schema.PurchaseItemTable);
  await db.delete(schema.PurchaseTable);
  await db.delete(schema.PurchaseInvoiceTable);
  await db.delete(schema.MedicineTable);
  await db.delete(schema.MedicineCategoryTable);
  await db.delete(schema.ExpenseCategoryTable);
  await db.delete(schema.CustomerTable);
  await db.delete(schema.VendorTable);

  await db.delete(schema.AddressTable);
  await db.delete(schema.UserTable);

  await db.delete(schema.RoleTable);
  await db.delete(schema.PermissionTable);

  console.log("🗑️  Cleared existing data \n");
}
