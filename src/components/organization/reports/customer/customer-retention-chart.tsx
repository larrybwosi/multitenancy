"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CustomerData } from "@/types/reports"

interface CustomerRetentionChartProps {
  data?: CustomerData["retention"]
}

export function CustomerRetentionChart({ data }: CustomerRetentionChartProps) {
  if (!data) return null

  const maxValue = Math.max(...data.cohortData.flatMap(cohort => cohort.values))
  const getColor = (value: number) => {
    // Create a color scale from light blue to dark blue based on retention rate
    const intensity = Math.max(0.1, value / maxValue)
    return `rgba(14, 165, 233, ${intensity})`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Overall Retention Rate</div>
              <div className="text-2xl font-bold">{data.retentionRate.toFixed(1)}%</div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {data.retentionRate >= 70 ? "Excellent" :
               data.retentionRate >= 50 ? "Good" :
               data.retentionRate >= 30 ? "Fair" : "Needs Improvement"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium mb-4">Cohort Analysis</div>
          <div className="relative overflow-x-auto">
            <div className="min-w-full">
              <div className="grid" style={{
                gridTemplateColumns: `minmax(120px, auto) repeat(${data.cohortData[0]?.values.length ?? 0}, minmax(80px, 1fr))`
              }}>
                {/* Header */}
                <div className="text-sm font-medium text-muted-foreground p-2">Cohort</div>
                {Array.from({ length: data.cohortData[0]?.values.length ?? 0 }, (_, i) => (
                  <div key={i} className="text-sm font-medium text-muted-foreground p-2 text-center">
                    Month {i + 1}
                  </div>
                ))}

                {/* Data Rows */}
                {data.cohortData.map((cohort) => (
                  <React.Fragment key={cohort.cohort}>
                    <div className="text-sm font-medium border-t p-2">
                      {cohort.cohort}
                      <div className="text-xs text-muted-foreground">
                        {cohort.size.toLocaleString()} customers
                      </div>
                    </div>
                    {cohort.values.map((value, colIndex) => (
                      <div
                        key={colIndex}
                        className="border-t p-2 text-center relative group"
                        style={{
                          backgroundColor: getColor(value)
                        }}
                      >
                        <div className="font-medium text-sm text-white mix-blend-difference">
                          {value.toFixed(1)}%
                        </div>
                        <div className="absolute hidden group-hover:block bg-black text-white text-xs rounded p-1 -mt-8 left-1/2 transform -translate-x-1/2">
                          {value.toFixed(1)}% retained after {colIndex + 1} month{colIndex === 0 ? '' : 's'}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}