"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricsCards } from "@/components/test/metrics-cards"
import { LocationsOverview } from "@/components/test/locations-overview"
import { CheckInActivity } from "@/components/test/check-in-activity"
import { UserActivity } from "@/components/test/user-activity"
import { RecentCheckIns } from "@/components/test/recent-check-ins"
import { SchedulesOverview } from "@/components/test/schedules-overview"
import { getDashboardData } from "@/app/actions/dashboard"
import type { DashboardData } from "@/types/dashboard"

export function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // In a real app, you would get the organization ID from the user's session
        const organizationId = "org123" // Placeholder
        const data = await getDashboardData(organizationId)
        setDashboardData(data)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-500">Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading || !dashboardData) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <MetricsCards metrics={dashboardData.metrics} />

      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="check-ins">Check-ins</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="locations" className="space-y-4">
          <LocationsOverview locations={dashboardData.topLocations} />
        </TabsContent>
        <TabsContent value="check-ins" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CheckInActivity data={dashboardData.checkInActivity} />
            <RecentCheckIns checkIns={dashboardData.recentCheckIns} />
          </div>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <UserActivity users={dashboardData.userActivity} />
        </TabsContent>
        <TabsContent value="schedules" className="space-y-4">
          <SchedulesOverview schedules={dashboardData.recentSchedules} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
