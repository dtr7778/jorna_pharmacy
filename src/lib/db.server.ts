import { env as workerEnv } from "cloudflare:workers";

import { createDrizzleClient } from "@/db/clients/drizzle-client";

export function getDB() {
  return createDrizzleClient(workerEnv.DB);
}
