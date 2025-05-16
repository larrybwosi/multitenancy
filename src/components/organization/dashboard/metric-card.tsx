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
  suffix?: string
  description?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeText,
  icon,
  iconBg,
  changeType = change > 0 ? "positive" : change < 0 ? "negative" : "neutral",
  suffix,
  description,
}: MetricCardProps) {
  return (
    <Card className="p-6 overflow-hidden relative group hover:shadow-md transition-all duration-200">
      <div className="flex justify-between">
        <div className="relative z-10">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-1 flex items-baseline">
            {value.toLocaleString()}{suffix && <span className="text-sm ml-1 font-normal text-muted-foreground">{suffix}</span>}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 max-w-[180px] leading-relaxed">
              {description}
            </p>
          )}
          <div className="flex items-center mt-2">
            {changeType === "positive" && <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />}
            {changeType === "negative" && <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />}
            {changeType === "neutral" && <MinusIcon className="h-4 w-4 text-gray-500 mr-1" />}
            <span
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-green-500",
                changeType === "negative" && "text-red-500",
                changeType === "neutral" && "text-gray-500",
              )}
            >
              {changeText}
            </span>
          </div>
        </div>
        <div className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center transition-transform duration-200",
          iconBg,
          "group-hover:scale-110"
        )}>
          {icon}
        </div>
      </div>
      
      {/* Decorative background gradient */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200",
        changeType === "positive" ? "bg-gradient-to-br from-green-200" : 
        changeType === "negative" ? "bg-gradient-to-br from-red-200" : 
        "bg-gradient-to-br from-gray-200"
      )}></div>
    </Card>
  )
}
