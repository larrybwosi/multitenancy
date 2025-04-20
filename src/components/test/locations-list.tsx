"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, MoreHorizontal, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatTime, isLocationOpen } from "@/lib/location-utils"

// Mock data for demonstration
const mockLocations = [
  {
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
  },
  {
    id: "2",
    name: "Downtown Branch",
    description: "Downtown customer service center",
    address: "456 Market St, Anytown, USA",
    latitude: 40.7112,
    longitude: -74.0055,
    operationalHoursStart: "08:00:00",
    operationalHoursEnd: "18:00:00",
    isActive: true,
    createdAt: "2023-02-20T14:30:00Z",
  },
  {
    id: "3",
    name: "Warehouse",
    description: "Main storage facility",
    address: "789 Industrial Blvd, Anytown, USA",
    latitude: 40.715,
    longitude: -74.008,
    operationalHoursStart: "06:00:00",
    operationalHoursEnd: "22:00:00",
    isActive: true,
    createdAt: "2023-03-05T09:15:00Z",
  },
  {
    id: "4",
    name: "Training Center",
    description: "Employee training and development center",
    address: "101 Education Ave, Anytown, USA",
    latitude: 40.714,
    longitude: -74.003,
    operationalHoursStart: "08:30:00",
    operationalHoursEnd: "16:30:00",
    isActive: true,
    createdAt: "2023-04-10T13:45:00Z",
  },
]

export function LocationsList() {
  const [locations, setLocations] = useState(mockLocations)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredLocations, setFilteredLocations] = useState(locations)

  // In a real application, this would fetch the locations from the API
  useEffect(() => {
    // Simulate API call
    const fetchLocations = async () => {
      // const response = await fetch('/api/locations?organizationId=org123')
      // const data = await response.json()
      // setLocations(data.locations)

      // For demonstration, we'll just use the mock data
      setLocations(mockLocations)
    }

    fetchLocations()
  }, [])

  // Filter locations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLocations(locations)
    } else {
      const filtered = locations.filter(
        (location) =>
          location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredLocations(filtered)
    }
  }, [searchTerm, locations])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLocations.map((location) => (
          <Card key={location.id}>
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
                      <Link href={`/dashboard/locations/${location.id}`} className="flex w-full">
                        View Location
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href={`/dashboard/locations/${location.id}/edit`} className="flex w-full">
                        Edit Location
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href={`/dashboard/locations/${location.id}/check-in`} className="flex w-full">
                        Check In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete Location</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle>
                <Link href={`/dashboard/locations/${location.id}`} className="hover:underline">
                  {location.name}
                </Link>
              </CardTitle>
              <CardDescription>{location.description}</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Created {new Date(location.createdAt).toLocaleDateString()}
              </div>
              <Link href={`/dashboard/locations/${location.id}/check-in`}>
                <Button size="sm" variant="outline">
                  Check In
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
