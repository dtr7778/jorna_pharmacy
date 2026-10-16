import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import { globalHead } from "@/lib/head"
import { requireSessions } from "@/features/auth/auth.functions"
import { DevPanel } from "@/components/dev-panel"
import { env } from "@/lib/env"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { Toaster } from "react-hot-toast"
import type { QueryClient } from "@tanstack/react-query"
import { TanstackQueryProvider } from "@/components/tanstack-query/tanstack-query-provider"

interface RouterContextProps {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContextProps>()({
  beforeLoad: async () => {
    const result = await requireSessions()

    return {
      user: result?.user,
      session: result?.session,
      roles: result?.roles,
      permissions: result?.permissions,
    }
  },
  head: () => globalHead(),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const context = Route.useRouteContext()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TanstackQueryProvider queryClient={context.queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="theme">
            {children}
            <DevPanel
              currentEnv={env.VITE_ENVIRONMENT}
              envVars={Object.entries(import.meta.env)
                .filter(([k]) => k.startsWith("VITE_"))
                .map(([key, value]) => ({ key, value: value ?? "" }))}
            />
            <Toaster
              position="top-center"
              reverseOrder={true}
              gutter={6}
              toastOptions={{
                duration: 3000,
                removeDelay: 2000,
                className: "__react-hot-toast",
              }}
            />
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                {
                  name: "Tanstack Query",
                  render: <ReactQueryDevtoolsPanel />,
                },
              ]}
            />
          </ThemeProvider>
        </TanstackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
