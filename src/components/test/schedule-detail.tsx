"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, Edit, MapPin, MoreHorizontal, Trash, Users, PlusCircle } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, formatTime } from "@/lib/date-utils"

// Mock data for demonstration
const mockSchedule = {
  id: "1",
  title: "Team Meetings",
  description: "Regular team sync-ups and planning sessions",
  color: "#4f46e5",
  isPublic: true,
  createdAt: "2023-01-15T10:00:00Z",
  createdBy: {
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  items: [
    {
      id: "item1",
      title: "Weekly Team Sync",
      description: "Review progress and plan for the week ahead",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
      location: "Conference Room A",
      status: "PENDING",
      assignees: [
        {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        {
          id: "user2",
          name: "Jane Smith",
          email: "jane@example.com",
          avatar: "/placeholder.svg?height=40&width=40",
        },
      ],
    },
    {
      id: "item2",
      title: "Project Planning",
      description: "Define project scope and assign tasks",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 50).toISOString(),
      location: "Meeting Room B",
      status: "PENDING",
      assignees: [
        {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        {
          id: "user3",
          name: "Mike Johnson",
          email: "mike@example.com",
          avatar: "/placeholder.svg?height=40&width=40",
        },
      ],
    },
  ],
  assignees: [
    {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "user3",
      name: "Mike Johnson",
      email: "mike@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ],
}

interface ScheduleDetailProps {
  id: string
}

export function ScheduleDetail({ id }: ScheduleDetailProps) {
  const [schedule, setSchedule] = useState(mockSchedule)

  // In a real application, this would fetch the schedule data from the API
  useEffect(() => {
    // Simulate API call
    const fetchSchedule = async () => {
      // const response = await fetch(`/api/schedules/${id}`)
      // const data = await response.json()
      // setSchedule(data.schedule)

      // For demonstration, we'll just use the mock data
      setSchedule(mockSchedule)
    }

    fetchSchedule()
  }, [id])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: schedule.color }} />
              <Badge variant={schedule.isPublic ? "default" : "outline"}>
                {schedule.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
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
                  <Link href={`/dashboard/schedules/${id}/edit`} className="flex w-full items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Schedule
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/dashboard/schedules/${id}/items/create`} className="flex w-full items-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/dashboard/schedules/${id}/export`} className="flex w-full items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Export Schedule
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Schedule
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle>{schedule.title}</CardTitle>
          <CardDescription>{schedule.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(schedule.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{schedule.assignees.length} assignees</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Created by:</span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={schedule.createdBy.avatar || "/placeholder.svg"} alt={schedule.createdBy.name} />
              <AvatarFallback>
                {schedule.createdBy.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{schedule.createdBy.name}</span>
          </div>
        </CardFooter>
      </Card>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Schedule Items</TabsTrigger>
          <TabsTrigger value="assignees">Assignees</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="space-y-4">
          {schedule.items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    <Link href={`/dashboard/schedules/${id}/items/${item.id}`} className="hover:underline">
                      {item.title}
                    </Link>
                  </CardTitle>
                  <Badge>{item.status}</Badge>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(item.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </span>
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Assignees:</span>
                  <div className="flex -space-x-2">
                    {item.assignees.map((assignee) => (
                      <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                        <AvatarFallback>
                          {assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="assignees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Assignees</CardTitle>
              <CardDescription>Members assigned to this schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.assignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                      <AvatarFallback>
                        {assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignee.name}</p>
                      <p className="text-sm text-muted-foreground">{assignee.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Assignee
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
