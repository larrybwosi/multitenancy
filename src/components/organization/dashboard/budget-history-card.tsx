"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {  ChartArea, Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type BudgetData = {
  name: string
  amount: number
  amountUsed: number
  periodStart: string
  periodEnd: string
}

interface BudgetHistoryCardProps {
  data: BudgetData[]
}

export function BudgetHistoryCard({ data }: BudgetHistoryCardProps) {
  // Calculate overall budget utilization
  const totalBudget = data.reduce((sum, budget) => sum + budget.amount, 0)
  const totalUsed = data.reduce((sum, budget) => sum + budget.amountUsed, 0)
  const utilization = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900">
              <ChartArea className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span>Budget Allocation</span>
          </div>
          <Badge variant={utilization > 90 ? "destructive" : utilization > 75 ? "warning" : "outline"}>
            {Math.round(utilization)}% Used
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5 mt-2">
          {data.map((budget, index) => {
            const percentUsed = (budget.amountUsed / budget.amount) * 100
            const statusColor = 
              percentUsed > 90 ? "text-red-500" : 
              percentUsed > 75 ? "text-amber-500" : 
              "text-green-500"
            
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2 cursor-help">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start">
                          <div className="mt-0.5 mr-2">
                            <Coins className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium line-clamp-1">{budget.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {format(new Date(budget.periodStart), "MMM d")} - {format(new Date(budget.periodEnd), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${statusColor}`}>
                            {Math.round(percentUsed)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${budget.amountUsed.toLocaleString()} / ${budget.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={percentUsed} 
                        className="h-1.5" 
                        indicatorClassName={
                          percentUsed > 90 ? "bg-red-500" : 
                          percentUsed > 75 ? "bg-amber-500" : 
                          "bg-green-500"
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="text-xs">
                      <p className="font-semibold">{budget.name}</p>
                      <p>Period: {format(new Date(budget.periodStart), "MMM d, yyyy")} - {format(new Date(budget.periodEnd), "MMM d, yyyy")}</p>
                      <p>Budget: ${budget.amount.toLocaleString()}</p>
                      <p>Used: ${budget.amountUsed.toLocaleString()} ({Math.round(percentUsed)}%)</p>
                      <p>Remaining: ${(budget.amount - budget.amountUsed).toLocaleString()}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
        
        <div className="mt-5 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Overall Budget Utilization</h4>
            <span className="text-sm font-medium">
              ${totalUsed.toLocaleString()} / ${totalBudget.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={utilization} 
            className="h-2" 
            indicatorClassName={
              utilization > 90 ? "bg-red-500" : 
              utilization > 75 ? "bg-amber-500" : 
              "bg-green-500"
            }
          />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
