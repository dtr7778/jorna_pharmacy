import type { DatabaseType } from "../clients/drizzle-client"
import * as schema from "../schemas"

export async function clearAll(db: DatabaseType) {
  console.log("🧹 Clearing existing data...")

  await db.delete(schema.UserEventTable)
  await db.delete(schema.UserSessionTable)
  await db.delete(schema.UserDeviceTable)
  await db.delete(schema.AccountTable)
  await db.delete(schema.SessionTable)
  await db.delete(schema.VerificationTable)

  await db.delete(schema.AddressTable)
  await db.delete(schema.UserTable)

  console.log("🗑️  Cleared existing data \n")
}
