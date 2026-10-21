import { faker } from "@faker-js/faker";

import type { DatabaseType } from "../../clients/drizzle-client";
import type { ExpenseCategoryDataModel, UserDataModel } from "../../schemas";
import {
  CashClosingTable,
  ExpenseCategoryTable,
  ExpenseTable,
  SalaryPaymentTable,
} from "../../schemas";
import { RoleEnumSchema } from "../../schemas/enums/zod-db-enums";
import {
  addDays,
  daysAgo,
  insertChunked,
  insertChunkedReturning,
} from "../seed-utils";
import { seedConfigs } from "../seed.config";

type ExpenseInsert = typeof ExpenseTable.$inferInsert;
type SalaryPaymentInsert = typeof SalaryPaymentTable.$inferInsert;
type CashClosingInsert = typeof CashClosingTable.$inferInsert;

const EXPENSE_CATEGORY_NAMES = [
  "Rent",
  "Electricity",
  "Water",
  "Internet",
  "Transport",
  "Maintenance",
  "Stationery",
  "Miscellaneous",
];

const SALARY_MONTHS = 3;
const CASH_CLOSING_COUNT = 30;
const CASH_CLOSING_PERIOD_LENGTHS = [1, 2, 7, 30];

export async function seedExpenseCategories(
  db: DatabaseType
): Promise<Array<ExpenseCategoryDataModel>> {
  console.log("🌱 Seeding expense categories...");

  const categories = await insertChunkedReturning(
    EXPENSE_CATEGORY_NAMES.map((name) => ({ name })),
    (chunk) => db.insert(ExpenseCategoryTable).values(chunk).returning()
  );

  console.log(`✅ ${categories.length} Expense categories seeded`);

  return categories;
}

export async function seedExpenses(
  db: DatabaseType,
  {
    categories,
    users,
  }: {
    categories: Array<ExpenseCategoryDataModel>;
    users: Array<UserDataModel>;
  }
): Promise<void> {
  console.log("🌱 Seeding expenses...");

  const expensesData: Array<ExpenseInsert> = Array.from(
    { length: seedConfigs.targets.expenses },
    () => ({
      categoryId: faker.helpers.arrayElement(categories).id,
      amount: faker.number.int({ min: 100, max: 5000 }),
      note: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: faker.date.recent({ days: 90 }),
    })
  );

  await insertChunked(expensesData, (chunk) =>
    db.insert(ExpenseTable).values(chunk)
  );

  console.log(`✅ ${expensesData.length} Expenses seeded`);
}

export async function seedSalaryPayments(
  db: DatabaseType,
  users: Array<UserDataModel>
): Promise<void> {
  console.log("🌱 Seeding salary payments...");

  const staff = users.filter((user) => user.role !== RoleEnumSchema.enum.USER);

  const salariesData: Array<SalaryPaymentInsert> = [];

  for (const employee of staff) {
    for (let month = 1; month <= SALARY_MONTHS; month++) {
      salariesData.push({
        userId: employee.id,
        amount: faker.number.int({ min: 15000, max: 40000 }),
        note: "Monthly salary",
        createdBy: faker.helpers.arrayElement(users).id,
        createdAt: daysAgo(30 * month),
      });
    }
  }

  await insertChunked(salariesData, (chunk) =>
    db.insert(SalaryPaymentTable).values(chunk)
  );

  console.log(`✅ ${salariesData.length} Salary payments seeded`);
}

export async function seedCashClosings(
  db: DatabaseType,
  users: Array<UserDataModel>
): Promise<void> {
  console.log("🌱 Seeding cash closings...");

  const closingsData: Array<CashClosingInsert> = [];

  // Walk backwards from yesterday in back-to-back windows of varying length,
  // so the seed covers daily, two-day, weekly, and monthly closings.
  let periodEnd = daysAgo(1);

  for (let index = 0; index < CASH_CLOSING_COUNT; index++) {
    const periodLength = faker.helpers.arrayElement(
      CASH_CLOSING_PERIOD_LENGTHS
    );
    const periodStart = addDays(periodEnd, -periodLength);

    const openingCash = faker.number.int({ min: 1000, max: 5000 });
    const totalSales = faker.number.int({ min: 5000, max: 20000 });
    const cashReceived = Math.round(
      totalSales * faker.number.float({ min: 0.6, max: 0.9 })
    );
    const vendorPaid = faker.number.int({ min: 0, max: 3000 });
    const totalExpenses = faker.number.int({ min: 0, max: 800 });
    const totalSalary = 0;
    const expectedCash =
      openingCash + cashReceived - vendorPaid - totalExpenses - totalSalary;
    const difference = faker.number.int({ min: -50, max: 50 });

    closingsData.push({
      periodStart,
      periodEnd,
      openingCash,
      totalSales,
      totalReturns: faker.number.int({ min: 0, max: 500 }),
      cashReceived,
      vendorPaid,
      totalExpenses,
      totalSalary,
      expectedCash,
      countedCash: expectedCash + difference,
      difference,
      closedBy: faker.helpers.arrayElement(users).id,
      note: null,
      createdAt: periodEnd,
    });

    periodEnd = periodStart;
  }

  await insertChunked(closingsData, (chunk) =>
    db.insert(CashClosingTable).values(chunk)
  );

  console.log(`✅ ${closingsData.length} Cash closings seeded`);
}
