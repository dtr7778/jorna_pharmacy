import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from "@/constants"
import { z } from "zod"

export const querySearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE_INDEX),
  limit: z.coerce.number().int().min(1).default(DEFAULT_PAGE_SIZE),
  search: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  orderField: z.string().optional(),
})
