import { env } from "@/lib/env"
import { Link } from "@tanstack/react-router"

export function SiteLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 self-center font-semibold">
      <div className="flex aspect-square size-8 items-center justify-center">
        <img src="/sitelogo.png" alt={`${env.VITE_APP_NAME} logo`} />
      </div>
      <span>{env.VITE_APP_NAME}</span>
    </Link>
  )
}
