import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  server: {
    ENVIRONMENT: z
      .enum(["development", "production", "test"] as const)
      .default("development"),
    MAIL_USER: z.string(),
    MAIL_PASS: z.string(),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_ENVIRONMENT: z
      .enum(["development", "production", "test"] as const)
      .default("development"),
    VITE_APP_NAME: z.string(),
    VITE_SITE_URL: z.url(),
    VITE_MAIL: z.email(),
  },
  runtimeEnv: typeof window === "undefined" ? process.env : import.meta.env,
  emptyStringAsUndefined: true,
})
