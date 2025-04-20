"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatDuration } from "@/lib/location-utils"
import type { LocationMetrics } from "@/types/dashboard"

interface LocationsOverviewProps {
  locations: LocationMetrics[]
}

export function LocationsOverview({ locations }: LocationsOverviewProps) {
  // Transform data for the chart
  const chartData = locations.map((location) => ({
    name: location.name,
    checkIns: location.totalCheckIns,
    visitors: location.uniqueVisitors,
    avgDuration: location.averageDuration || 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Locations</CardTitle>
        <CardDescription>Check-in activity by location</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 70,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "avgDuration") {
                    return [formatDuration(value as number), "Avg. Duration"]
                  }
                  return [value, name === "checkIns" ? "Check-ins" : "Unique Visitors"]
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="checkIns" name="Check-ins" fill="#8884d8" />
              <Bar yAxisId="left" dataKey="visitors" name="Unique Visitors" fill="#82ca9d" />
              <Bar yAxisId="right" dataKey="avgDuration" name="Avg. Duration (min)" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Location</th>
                <th className="text-right py-2">Check-ins</th>
                <th className="text-right py-2">Unique Visitors</th>
                <th className="text-right py-2">Avg. Duration</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="border-b">
                  <td className="py-2">{location.name}</td>
                  <td className="text-right py-2">{location.totalCheckIns}</td>
                  <td className="text-right py-2">{location.uniqueVisitors}</td>
                  <td className="text-right py-2">{formatDuration(location.averageDuration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
