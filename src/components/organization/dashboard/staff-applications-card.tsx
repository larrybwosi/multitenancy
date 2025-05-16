"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"
import { InvitationStatus } from "@/prisma/client"
import { UserPlus, Check, Clock, X } from "lucide-react"

type Application = {
  createdAt: string
  status: InvitationStatus
}

interface StaffApplicationsCardProps {
  data: Application[]
}

type StatusCount = {
  name: string
  value: number
  color: string
  icon: JSX.Element
}

const COLORS = {
  ACCEPTED: "#10b981",  // emerald-500
  PENDING: "#f59e0b",   // amber-500
  REJECTED: "#ef4444",  // red-500
  EXPIRED: "#6b7280"    // gray-500
}

const ICONS = {
  ACCEPTED: <Check className="h-3 w-3" />,
  PENDING: <Clock className="h-3 w-3" />,
  REJECTED: <X className="h-3 w-3" />,
  EXPIRED: <X className="h-3 w-3" />
}

export function StaffApplicationsCard({ data }: StaffApplicationsCardProps) {
  // Process data for chart
  const statusCounts: Record<string, number> = {
    ACCEPTED: 0,
    PENDING: 0,
    REJECTED: 0,
    EXPIRED: 0
  }

  data.forEach(app => {
    if (statusCounts[app.status] !== undefined) {
      statusCounts[app.status]++
    }
  })

  const chartData: StatusCount[] = Object.entries(statusCounts).map(([key, value]) => ({
    name: key,
    value,
    color: COLORS[key as keyof typeof COLORS],
    icon: ICONS[key as keyof typeof ICONS]
  })).filter(item => item.value > 0)

  const totalApplications = data.length
  const acceptanceRate = totalApplications > 0
    ? Math.round((statusCounts.ACCEPTED / totalApplications) * 100)
    : 0

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md border text-xs">
          <p className="font-medium">{data.name}</p>
          <p className="text-muted-foreground">
            {data.value} application{data.value !== 1 ? 's' : ''}
          </p>
          <p>
            <span className="font-medium">{Math.round((data.value / totalApplications) * 100)}%</span> of total
          </p>
        </div>
      )
    }
    return null
  }

  // Custom legend renderer
  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center">
            <div className="h-3 w-3 rounded-full mr-1" style={{ backgroundColor: entry.color }}></div>
            <div className="flex items-center">
              {entry.icon}
              <span className="ml-1">{entry.name.toLowerCase()}</span>
              <span className="ml-1 text-muted-foreground">({entry.value})</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900">
              <UserPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            </div>
            <span>Staff Applications</span>
          </div>
          <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            {totalApplications}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-xs text-muted-foreground">Acceptance Rate</p>
            <p className="text-lg font-semibold text-green-600">{acceptanceRate}%</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-xs text-muted-foreground">Pending Review</p>
            <p className="text-lg font-semibold text-amber-600">{statusCounts.PENDING}</p>
          </div>
        </div>
      
        {totalApplications > 0 ? (
          <div className="h-[180px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[180px] text-center">
            <UserPlus className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-muted-foreground">No applications yet</p>
            <p className="text-xs text-muted-foreground">Applications will appear here when they come in</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
