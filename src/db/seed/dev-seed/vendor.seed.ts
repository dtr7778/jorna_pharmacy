import { faker } from "@faker-js/faker";

import type { DatabaseType } from "../../clients/drizzle-client";
import type {
  PurchaseDataModel,
  UserDataModel,
  VendorDataModel,
} from "../../schemas";
import { VendorPaymentTable, VendorTable } from "../../schemas";
import {
  insertChunked,
  insertChunkedReturning,
  splitAmount,
} from "../seed-utils";
import { seedConfigs } from "../seed.config";

type VendorInsert = typeof VendorTable.$inferInsert;
type VendorPaymentInsert = typeof VendorPaymentTable.$inferInsert;

export async function seedVendors(
  db: DatabaseType
): Promise<Array<VendorDataModel>> {
  console.log("🌱 Seeding vendors...");

  const vendorsData: Array<VendorInsert> = Array.from(
    { length: seedConfigs.targets.vendors },
    () => ({
      name: faker.company.name(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      note: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
      isActive: faker.datatype.boolean(0.9),
    })
  );

  const vendors = await insertChunkedReturning(vendorsData, (chunk) =>
    db.insert(VendorTable).values(chunk).returning()
  );

  console.log(`✅ ${vendors.length} Vendors seeded`);

  return vendors;
}

export async function seedVendorPayments(
  db: DatabaseType,
  {
    vendors,
    purchases,
    users,
  }: {
    vendors: Array<VendorDataModel>;
    purchases: Array<PurchaseDataModel>;
    users: Array<UserDataModel>;
  }
): Promise<void> {
  console.log("🌱 Seeding vendor payments...");

  const paymentsData: Array<VendorPaymentInsert> = [];

  for (const purchase of purchases) {
    if (purchase.paidAmount === 0) continue;

    for (const amount of splitAmount(purchase.paidAmount)) {
      paymentsData.push({
        vendorId: purchase.vendorId,
        purchaseId: purchase.id,
        amount,
        note: null,
        createdBy: faker.helpers.arrayElement(users).id,
        createdAt: faker.date.between({
          from: purchase.createdAt,
          to: new Date(),
        }),
      });
    }
  }

  for (const vendor of vendors) {
    if (!faker.datatype.boolean(0.3)) continue;

    paymentsData.push({
      vendorId: vendor.id,
      purchaseId: null,
      amount: faker.number.int({ min: 1000, max: 5000 }),
      note: "On-account payment",
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: faker.date.recent({ days: 90 }),
    });
  }

  await insertChunked(paymentsData, (chunk) =>
    db.insert(VendorPaymentTable).values(chunk)
  );

  console.log(`✅ ${paymentsData.length} Vendor payments seeded`);
}
