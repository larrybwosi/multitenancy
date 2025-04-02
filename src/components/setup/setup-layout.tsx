import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SetupLayoutProps {
  children: ReactNode
  className?: string
}

export function SetupLayout({ children, className }: SetupLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-0">
      <Card className={cn("w-full min-h-screen border-0 rounded-none shadow-none", className)}>
        <CardContent className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10">{children}</CardContent>
      </Card>
    </div>
  )
}

