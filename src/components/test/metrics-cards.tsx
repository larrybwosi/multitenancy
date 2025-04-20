import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MapPin, Calendar, ClipboardCheck } from "lucide-react"
import type { DashboardMetrics } from "@/types/dashboard"

interface MetricsCardsProps {
  metrics: DashboardMetrics
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.activeUsers} active ({Math.round((metrics.activeUsers / metrics.totalUsers) * 100) || 0}%)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalLocations}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.locationGrowth >= 0 ? "+" : ""}
            {metrics.locationGrowth}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalSchedules}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.scheduleGrowth >= 0 ? "+" : ""}
            {metrics.scheduleGrowth}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalCheckIns}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.checkInGrowth >= 0 ? "+" : ""}
            {metrics.checkInGrowth}% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
