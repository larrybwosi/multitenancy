"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InvitationStatus } from "@prisma/client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type Application = {
  createdAt: string
  status: InvitationStatus
}

interface StaffApplicationsCardProps {
  data: Application[]
}

export function StaffApplicationsCard({ data }: StaffApplicationsCardProps) {
  // Process data for chart
  const processedData = data.reduce<{ date: string; total: number }[]>((acc, curr) => {
    const date = new Date(curr.createdAt).toLocaleDateString()
    const existingEntry = acc.find(entry => entry.date === date)
    
    if (existingEntry) {
      existingEntry.total++
    } else {
      acc.push({ date, total: 1 })
    }
    
    return acc
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
