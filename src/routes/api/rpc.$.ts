import { getDB } from "@/lib/db"
import { rpcHandler } from "@/server/orpc.handler"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { response } = await rpcHandler.handle(request, {
          prefix: "/api/rpc",
          context: {
            reqHeaders: request.headers,
            db: getDB(),
            user: null,
            session: null,
            roles: [],
            permissions: [],
          },
        })

        return response ?? new Response("Not Found", { status: 404 })
      },
    },
  },
})
