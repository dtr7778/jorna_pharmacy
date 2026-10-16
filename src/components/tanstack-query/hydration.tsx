import { cache } from "react"

import type { QueryClient } from "@tanstack/react-query"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { createQueryClient } from "@/lib/tanstack-query/query-client.orpc"

export const getQueryClient = cache(createQueryClient)

export function HydrateClient({
  children,
  client,
}: {
  children: React.ReactNode
  client: QueryClient
}) {
  return (
    <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>
  )
}
