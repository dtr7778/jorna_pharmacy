import { clearAll } from "../clearAll";
import { seedPermission } from "../permission.seed";
import { seedRolePermission } from "../rolePermission.seed";
import { seedRoles } from "../roles.seed";
import { seedDbClient } from "../seed-db.client";
import { seedCustomerPayments, seedCustomers } from "./customer.seed";
import {
  seedDailyClosings,
  seedExpenseCategories,
  seedExpenses,
  seedSalaryPayments,
} from "./finance.seed";
import { seedMedicineCategories, seedMedicines } from "./medicine.seed";
import { seedPurchaseReturns, seedPurchases } from "./purchase.seed";
import { seedSales } from "./sale.seed";
import { seedStockMovements } from "./stockMovement.seed";
import { seedUsers } from "./user.seed";
import { seedVendorPayments, seedVendors } from "./vendor.seed";

async function main() {
  console.log("🌱 Starting database seed...\n");

  const { db, dispose } = await seedDbClient();

  try {
    await clearAll(db);

    const roles = await seedRoles(db);
    const permissions = await seedPermission(db);
    const rolesAndPermissions = await seedRolePermission(
      db,
      roles,
      permissions
    );

    const users = await seedUsers(db, roles);

    const vendors = await seedVendors(db);
    const medicineCategories = await seedMedicineCategories(db);
    const medicines = await seedMedicines(db, {
      categories: medicineCategories,
      vendors,
    });
    const customers = await seedCustomers(db);

    const { purchases, purchaseItems } = await seedPurchases(db, {
      vendors,
      medicines,
      users,
    });
    await seedVendorPayments(db, { vendors, purchases, users });

    const { sales, saleItems } = await seedSales(db, {
      customers,
      purchaseItems,
      users,
    });
    await seedCustomerPayments(db, { customers, sales, users });

    const { purchaseReturns, purchaseReturnItems } = await seedPurchaseReturns(
      db,
      { purchases, purchaseItems, users }
    );

    const expenseCategories = await seedExpenseCategories(db);
    await seedExpenses(db, { categories: expenseCategories, users });
    await seedSalaryPayments(db, users);
    await seedDailyClosings(db, users);

    await seedStockMovements(db, {
      purchases,
      purchaseItems,
      sales,
      saleItems,
      purchaseReturns,
      purchaseReturnItems,
    });

    console.log("\n📊 Seed Summary:");

    console.log(`Roles: ${roles.length}`);
    console.log(`Permissions: ${permissions.length}`);
    console.log(`Roles and Permissions: ${rolesAndPermissions.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Vendors: ${vendors.length}`);
    console.log(`Medicine categories: ${medicineCategories.length}`);
    console.log(`Medicines: ${medicines.length}`);
    console.log(`Customers: ${customers.length}`);
    console.log(`Purchases: ${purchases.length}`);
    console.log(`Purchase items: ${purchaseItems.length}`);
    console.log(`Purchase returns: ${purchaseReturns.length}`);
    console.log(`Sales: ${sales.length}`);
    console.log(`Sale items: ${saleItems.length}`);
    console.log(`Expense categories: ${expenseCategories.length}`);

    console.log("\n🎉 Seed completed successfully!");
  } finally {
    await dispose();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  });
