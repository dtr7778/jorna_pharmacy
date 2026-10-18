import { faker } from "@faker-js/faker";

import type { DatabaseType } from "../../clients/drizzle-client";
import type {
  MedicineCategoryDataModel,
  MedicineDataModel,
  VendorDataModel,
} from "../../schemas";
import { MedicineCategoryTable, MedicineTable } from "../../schemas";
import { insertChunkedReturning } from "../seed-utils";

type MedicineInsert = typeof MedicineTable.$inferInsert;
type MedicineType = MedicineDataModel["type"];

const MEDICINE_CATEGORY_NAMES = [
  "Analgesics",
  "Antibiotics",
  "Antacids",
  "Antihistamines",
  "Antidiabetics",
  "Cardiovascular",
  "Vitamins & Supplements",
  "Syrups & Suspensions",
  "Injections",
  "Topicals",
];

const MEDICINE_CATALOG: Array<{
  name: string;
  genericName: string;
  strength: string;
  type: MedicineType;
  category: string;
  baseUnit: string;
}> = [
  {
    name: "Napa Extra",
    genericName: "Paracetamol + Caffeine",
    strength: "500mg/65mg",
    type: "tablet",
    category: "Analgesics",
    baseUnit: "tablet",
  },
  {
    name: "Ace",
    genericName: "Paracetamol",
    strength: "500mg",
    type: "tablet",
    category: "Analgesics",
    baseUnit: "tablet",
  },
  {
    name: "Voltaren",
    genericName: "Diclofenac Sodium",
    strength: "50mg",
    type: "tablet",
    category: "Analgesics",
    baseUnit: "tablet",
  },
  {
    name: "Amoxil",
    genericName: "Amoxicillin",
    strength: "500mg",
    type: "capsule",
    category: "Antibiotics",
    baseUnit: "capsule",
  },
  {
    name: "Azithral",
    genericName: "Azithromycin",
    strength: "500mg",
    type: "tablet",
    category: "Antibiotics",
    baseUnit: "tablet",
  },
  {
    name: "Ciprocin",
    genericName: "Ciprofloxacin",
    strength: "500mg",
    type: "tablet",
    category: "Antibiotics",
    baseUnit: "tablet",
  },
  {
    name: "Seclo",
    genericName: "Omeprazole",
    strength: "20mg",
    type: "capsule",
    category: "Antacids",
    baseUnit: "capsule",
  },
  {
    name: "Rantac",
    genericName: "Ranitidine",
    strength: "150mg",
    type: "tablet",
    category: "Antacids",
    baseUnit: "tablet",
  },
  {
    name: "Gaviscon Liquid",
    genericName: "Sodium Alginate + Antacid",
    strength: "10ml",
    type: "liquid_bottle",
    category: "Antacids",
    baseUnit: "bottle",
  },
  {
    name: "Cetrizin",
    genericName: "Cetirizine",
    strength: "10mg",
    type: "tablet",
    category: "Antihistamines",
    baseUnit: "tablet",
  },
  {
    name: "Lorinas",
    genericName: "Loratadine",
    strength: "10mg",
    type: "tablet",
    category: "Antihistamines",
    baseUnit: "tablet",
  },
  {
    name: "Glucophage",
    genericName: "Metformin",
    strength: "500mg",
    type: "tablet",
    category: "Antidiabetics",
    baseUnit: "tablet",
  },
  {
    name: "Amaryl",
    genericName: "Glimepiride",
    strength: "2mg",
    type: "tablet",
    category: "Antidiabetics",
    baseUnit: "tablet",
  },
  {
    name: "Glucometer Strips",
    genericName: "Blood Glucose Test Strips",
    strength: "N/A",
    type: "other",
    category: "Antidiabetics",
    baseUnit: "piece",
  },
  {
    name: "Amlodipin",
    genericName: "Amlodipine",
    strength: "5mg",
    type: "tablet",
    category: "Cardiovascular",
    baseUnit: "tablet",
  },
  {
    name: "Atorva",
    genericName: "Atorvastatin",
    strength: "10mg",
    type: "tablet",
    category: "Cardiovascular",
    baseUnit: "tablet",
  },
  {
    name: "Losacar",
    genericName: "Losartan",
    strength: "50mg",
    type: "tablet",
    category: "Cardiovascular",
    baseUnit: "tablet",
  },
  {
    name: "Cevit",
    genericName: "Vitamin C",
    strength: "500mg",
    type: "tablet",
    category: "Vitamins & Supplements",
    baseUnit: "tablet",
  },
  {
    name: "Neurobion",
    genericName: "Vitamin B-Complex",
    strength: "Forte",
    type: "tablet",
    category: "Vitamins & Supplements",
    baseUnit: "tablet",
  },
  {
    name: "Calcimax D3",
    genericName: "Calcium + Vitamin D3",
    strength: "500mg/250IU",
    type: "tablet",
    category: "Vitamins & Supplements",
    baseUnit: "tablet",
  },
  {
    name: "ORS Saline",
    genericName: "Oral Rehydration Salts",
    strength: "200ml",
    type: "liquid_bottle",
    category: "Syrups & Suspensions",
    baseUnit: "bottle",
  },
  {
    name: "Mucosolvan Syrup",
    genericName: "Ambroxol",
    strength: "15mg/5ml",
    type: "liquid_bottle",
    category: "Syrups & Suspensions",
    baseUnit: "bottle",
  },
  {
    name: "Paracetamol Drops",
    genericName: "Paracetamol",
    strength: "100mg/ml",
    type: "liquid_drop",
    category: "Syrups & Suspensions",
    baseUnit: "bottle",
  },
  {
    name: "Ceftriaxone Inj",
    genericName: "Ceftriaxone",
    strength: "1g",
    type: "injection",
    category: "Injections",
    baseUnit: "vial",
  },
  {
    name: "Voveran Inj",
    genericName: "Diclofenac Sodium",
    strength: "75mg/3ml",
    type: "injection",
    category: "Injections",
    baseUnit: "ampoule",
  },
  {
    name: "Betnovate Cream",
    genericName: "Betamethasone",
    strength: "0.05%",
    type: "cream",
    category: "Topicals",
    baseUnit: "tube",
  },
  {
    name: "Canesten Cream",
    genericName: "Clotrimazole",
    strength: "1%",
    type: "cream",
    category: "Topicals",
    baseUnit: "tube",
  },
  {
    name: "Hydrocortisone Cream",
    genericName: "Hydrocortisone",
    strength: "1%",
    type: "cream",
    category: "Topicals",
    baseUnit: "tube",
  },
];

export async function seedMedicineCategories(
  db: DatabaseType
): Promise<Array<MedicineCategoryDataModel>> {
  console.log("🌱 Seeding medicine categories...");

  const categories = await insertChunkedReturning(
    MEDICINE_CATEGORY_NAMES.map((name) => ({ name })),
    (chunk) => db.insert(MedicineCategoryTable).values(chunk).returning()
  );

  console.log(`✅ ${categories.length} Medicine categories seeded`);

  return categories;
}

export async function seedMedicines(
  db: DatabaseType,
  {
    categories,
    vendors,
  }: {
    categories: Array<MedicineCategoryDataModel>;
    vendors: Array<VendorDataModel>;
  }
): Promise<Array<MedicineDataModel>> {
  console.log("🌱 Seeding medicines...");

  const categoryByName = new Map(
    categories.map((category) => [category.name, category] as const)
  );

  const medicinesData: Array<MedicineInsert> = MEDICINE_CATALOG.map(
    (medicine) => ({
      name: medicine.name,
      genericName: medicine.genericName,
      strength: medicine.strength,
      categoryId: categoryByName.get(medicine.category)!.id,
      vendorId: faker.datatype.boolean(0.8)
        ? faker.helpers.arrayElement(vendors).id
        : null,
      type: medicine.type,
      baseUnit: medicine.baseUnit,
      barcode: faker.datatype.boolean(0.7)
        ? faker.string.numeric({ length: 13 })
        : null,
      rackLocation: `R${faker.number.int({ min: 1, max: 12 })}-S${faker.number.int({ min: 1, max: 6 })}`,
      isActive: true,
    })
  );

  const medicines = await insertChunkedReturning(medicinesData, (chunk) =>
    db.insert(MedicineTable).values(chunk).returning()
  );

  console.log(`✅ ${medicines.length} Medicines seeded`);

  return medicines;
}
