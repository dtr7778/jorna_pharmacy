import { createDrizzleClient } from "@/db/clients/drizzle-client"
import { env as workerEnv } from "cloudflare:workers"

export function getDB() {
  return createDrizzleClient(workerEnv.DB)
}
