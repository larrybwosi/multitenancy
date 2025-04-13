"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface CustomerSatisfactionChartProps {
  data: any[]
}

export function CustomerSatisfactionChart({ data }: CustomerSatisfactionChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line")

  // Calculate averages for summary cards
  const averageNPS = data.reduce((sum, item) => sum + item.nps, 0) / data.length
  const averageCSAT = data.reduce((sum, item) => sum + item.csat, 0) / data.length
  const averageReviewScore = data.reduce((sum, item) => sum + Number.parseFloat(item.reviewScore), 0) / data.length
  const averageResponseRate = data.reduce((sum, item) => sum + item.responseRate, 0) / data.length

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="text-2xl font-bold">{averageNPS.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Average NPS Score</div>
        </div>
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as "line" | "bar")}>
          <TabsList className="grid w-[180px] grid-cols-2">
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="bar">Bar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="nps"
                name="NPS Score"
                stroke="#7c3aed"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="csat"
                name="CSAT Score"
                stroke="#10b981"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="responseRate"
                name="Response Rate (%)"
                stroke="#f97316"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Legend />
              <Bar dataKey="nps" name="NPS Score" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="csat" name="CSAT Score" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="responseRate" name="Response Rate (%)" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">NPS Score</div>
            <div className="text-2xl font-bold">{averageNPS.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground mt-1">{getNPSCategory(averageNPS)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">CSAT Score</div>
            <div className="text-2xl font-bold">{averageCSAT.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Customer satisfaction</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Review Score</div>
            <div className="text-2xl font-bold">{averageReviewScore.toFixed(1)}/5.0</div>
            <div className="text-sm text-muted-foreground mt-1">Average rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Response Rate</div>
            <div className="text-2xl font-bold">{averageResponseRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Survey participation</div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="text-sm font-medium mb-2">About Customer Satisfaction Metrics</h3>
        <p className="text-sm text-muted-foreground">
          <strong>NPS (Net Promoter Score):</strong> Measures customer loyalty on a scale from -100 to 100. Scores above
          0 are good, above 50 are excellent.
          <br />
          <strong>CSAT (Customer Satisfaction):</strong> Measures satisfaction with a specific interaction, typically on
          a percentage scale.
          <br />
          <strong>Review Score:</strong> Average rating from customer reviews, typically on a 1-5 scale.
          <br />
          <strong>Response Rate:</strong> Percentage of customers who respond to satisfaction surveys.
        </p>
      </div>
    </div>
  )
}

function getNPSCategory(nps: number): string {
  if (nps >= 70) return "Excellent"
  if (nps >= 50) return "Great"
  if (nps >= 30) return "Good"
  if (nps >= 0) return "Needs improvement"
  return "Critical attention needed"
}
