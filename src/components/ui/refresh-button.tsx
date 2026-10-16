import { useCallback, useState } from "react"

import { RefreshCw } from "lucide-react"
import { Button, type ButtonProps } from "./button"
import { cn } from "cn"

export function RefreshButton({
  isLoading,
  onButtonClick,
  size = "icon",
  variant = "outline",
  ...props
}: Omit<ButtonProps, "onClick" | "disabled"> & {
  isLoading: boolean
  onButtonClick: () => void
}) {
  const [isOnRefresh, setIsOnRefresh] = useState<boolean>(false)

  const handleRefresh = useCallback(() => {
    onButtonClick()
    setIsOnRefresh(true)
    setTimeout(() => {
      setIsOnRefresh(false)
    }, 2000)
  }, [onButtonClick])

  return (
    <Button
      onClick={handleRefresh}
      size={size}
      variant={variant}
      disabled={isLoading || isOnRefresh}
      {...props}
    >
      <RefreshCw className={cn((isLoading || isOnRefresh) && "animate-spin")} />
    </Button>
  )
}
