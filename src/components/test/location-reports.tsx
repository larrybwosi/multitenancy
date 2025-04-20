"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/location-utils"

// Mock data for demonstration
const mockLocations = [
  { id: "1", name: "Headquarters" },
  { id: "2", name: "Downtown Branch" },
  { id: "3", name: "Warehouse" },
  { id: "4", name: "Training Center" },
]

const mockCheckInData = [
  { date: "2023-05-01", count: 12 },
  { date: "2023-05-02", count: 15 },
  { date: "2023-05-03", count: 8 },
  { date: "2023-05-04", count: 20 },
  { date: "2023-05-05", count: 18 },
  { date: "2023-05-06", count: 5 },
  { date: "2023-05-07", count: 3 },
]

const mockUserData = [
  { name: "John Doe", checkIns: 15, totalDuration: 1200 },
  { name: "Jane Smith", checkIns: 12, totalDuration: 960 },
  { name: "Mike Johnson", checkIns: 8, totalDuration: 720 },
  { name: "Sarah Williams", checkIns: 6, totalDuration: 480 },
  { name: "David Brown", checkIns: 5, totalDuration: 300 },
]

export function LocationReports() {
  const [selectedLocation, setSelectedLocation] = useState<string>("1")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  })

  // In a real application, this would fetch the report data from the API
  useEffect(() => {
    // Simulate API call
    const fetchReportData = async () => {
      // const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      // const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      // const response = await fetch(`/api/locations/${selectedLocation}/reports?startDate=${startDate}&endDate=${endDate}`)
      // const data = await response.json()
      // setReportData(data)
      // For demonstration, we'll just use the mock data
    }

    if (selectedLocation && (dateRange.from || dateRange.to)) {
      fetchReportData()
    }
  }, [selectedLocation, dateRange])

  const handleExportReport = () => {
    // In a real application, this would trigger a report export
    alert("Report export functionality would be implemented here")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select location and date range for your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Location</div>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {mockLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Date Range</div>
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && !dateRange.to && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExportReport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily">Daily Check-ins</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Overview</CardTitle>
              <CardDescription>Summary of check-in activity at this location</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Check-ins</div>
                <div className="text-3xl font-bold">78</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Unique Visitors</div>
                <div className="text-3xl font-bold">24</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Average Duration</div>
                <div className="text-3xl font-bold">{formatDuration(75)}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Check-ins</CardTitle>
              <CardDescription>Number of check-ins per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Date</th>
                      <th className="text-right">Check-ins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCheckInData.map((day) => (
                      <tr key={day.date}>
                        <td className="py-2">{format(new Date(day.date), "EEEE, MMMM d, yyyy")}</td>
                        <td className="py-2 text-right">{day.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Check-in activity by user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">User</th>
                      <th className="text-right">Check-ins</th>
                      <th className="text-right">Total Duration</th>
                      <th className="text-right">Avg. Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUserData.map((user) => (
                      <tr key={user.name}>
                        <td className="py-2">{user.name}</td>
                        <td className="py-2 text-right">{user.checkIns}</td>
                        <td className="py-2 text-right">{formatDuration(Math.round(user.totalDuration / 60))}</td>
                        <td className="py-2 text-right">
                          {formatDuration(Math.round(user.totalDuration / 60 / user.checkIns))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
