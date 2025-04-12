import type React from "react"
import { Card } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: number
  change: number
  changeText: string
  icon: React.ReactNode
  iconBg: string
  changeType?: "positive" | "negative" | "neutral"
}

export function MetricCard({
  title,
  value,
  change,
  changeText,
  icon,
  iconBg,
  changeType = change > 0 ? "positive" : change < 0 ? "negative" : "neutral",
}: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          <div className="flex items-center mt-2">
            {changeType === "positive" && <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />}
            {changeType === "negative" && <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />}
            {changeType === "neutral" && <MinusIcon className="h-4 w-4 text-gray-500 mr-1" />}
            <span
              className={cn(
                "text-xs",
                changeType === "positive" && "text-green-500",
                changeType === "negative" && "text-red-500",
                changeType === "neutral" && "text-gray-500",
              )}
            >
              {changeText}
            </span>
          </div>
        </div>
        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", iconBg)}>{icon}</div>
      </div>
    </Card>
  )
}
