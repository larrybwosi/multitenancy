"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock, MapPin, Calendar, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatTime, isLocationOpen, formatDuration } from "@/lib/location-utils"
import { CheckInsList } from "@/components/check-ins-list"
import { LocationMap } from "@/components/location-map"

// Mock data for demonstration
const mockLocation = {
  id: "1",
  name: "Headquarters",
  description: "Main office building",
  address: "123 Main St, Anytown, USA",
  latitude: 40.7128,
  longitude: -74.006,
  operationalHoursStart: "09:00:00",
  operationalHoursEnd: "17:00:00",
  isActive: true,
  createdAt: "2023-01-15T10:00:00Z",
  createdBy: {
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
  },
}

// Mock stats for demonstration
const mockStats = {
  totalCheckIns: 156,
  uniqueVisitors: 42,
  averageDuration: 75, // minutes
}

interface LocationDetailProps {
  id: string
}

export function LocationDetail({ id }: LocationDetailProps) {
  const [location, setLocation] = useState(mockLocation)
  const [stats, setStats] = useState(mockStats)

  // In a real application, this would fetch the location data from the API
  useEffect(() => {
    // Simulate API call
    const fetchLocation = async () => {
      // const response = await fetch(`/api/locations/${id}`)
      // const data = await response.json()
      // setLocation(data.location)

      // For demonstration, we'll just use the mock data
      setLocation(mockLocation)
    }

    // Simulate API call for stats
    const fetchStats = async () => {
      // const response = await fetch(`/api/locations/${id}/stats`)
      // const data = await response.json()
      // setStats(data.stats)

      // For demonstration, we'll just use the mock data
      setStats(mockStats)
    }

    fetchLocation()
    fetchStats()
  }, [id])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge
              variant={
                isLocationOpen(location.operationalHoursStart, location.operationalHoursEnd) ? "default" : "outline"
              }
            >
              {isLocationOpen(location.operationalHoursStart, location.operationalHoursEnd) ? "Open" : "Closed"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={`/dashboard/locations/${id}/edit`} className="flex w-full">
                    Edit Location
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/dashboard/locations/${id}/check-in`} className="flex w-full">
                    Check In
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/dashboard/locations/${id}/reports`} className="flex w-full">
                    View Reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Delete Location</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle>{location.name}</CardTitle>
          <CardDescription>{location.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            {location.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{location.address}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime(location.operationalHoursStart)} - {formatTime(location.operationalHoursEnd)}
              </span>
            </div>
          </div>

          {location.latitude && location.longitude && (
            <div className="h-64 w-full overflow-hidden rounded-md border">
              <LocationMap latitude={location.latitude} longitude={location.longitude} name={location.name} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{stats.uniqueVisitors}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Created {new Date(location.createdAt).toLocaleDateString()} by {location.createdBy.name}
          </div>
        </CardFooter>
      </Card>

      <Tabs defaultValue="check-ins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="check-ins">Recent Check-ins</TabsTrigger>
          <TabsTrigger value="schedules">Associated Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="check-ins" className="space-y-4">
          <CheckInsList locationId={id} />
        </TabsContent>
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Associated Schedules</CardTitle>
              <CardDescription>Schedules linked to this location</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No schedules associated with this location yet.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Link Schedule
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
