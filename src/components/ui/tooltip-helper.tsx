"use client"
import { HelpCircle } from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TooltipHelperProps {
  content: string
  side?: "top" | "right" | "bottom" | "left"
}

export function TooltipHelper({ content, side = "top" }: TooltipHelperProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="ml-1 h-4 w-4 cursor-help text-muted-foreground opacity-70 hover:opacity-100" />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
