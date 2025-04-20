"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, MoreHorizontal, Users } from "lucide-react"
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

// Mock data for demonstration
const mockSchedules = [
  {
    id: "1",
    title: "Team Meetings",
    description: "Regular team sync-ups and planning sessions",
    color: "#4f46e5",
    isPublic: true,
    createdAt: "2023-01-15T10:00:00Z",
    itemCount: 12,
    assigneeCount: 8,
  },
  {
    id: "2",
    title: "Project Deadlines",
    description: "Important milestones and delivery dates",
    color: "#ef4444",
    isPublic: true,
    createdAt: "2023-02-20T14:30:00Z",
    itemCount: 8,
    assigneeCount: 5,
  },
  {
    id: "3",
    title: "Client Meetings",
    description: "External meetings with clients and stakeholders",
    color: "#0ea5e9",
    isPublic: false,
    createdAt: "2023-03-05T09:15:00Z",
    itemCount: 15,
    assigneeCount: 3,
  },
  {
    id: "4",
    title: "Training Sessions",
    description: "Team training and professional development",
    color: "#10b981",
    isPublic: true,
    createdAt: "2023-04-10T13:45:00Z",
    itemCount: 6,
    assigneeCount: 12,
  },
]

export function SchedulesList() {
  const [schedules] = useState(mockSchedules)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {schedules.map((schedule) => (
        <Card key={schedule.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: schedule.color }} />
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
                    <Link href={`/dashboard/schedules/${schedule.id}`} className="flex w-full">
                      View Schedule
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href={`/dashboard/schedules/${schedule.id}/edit`} className="flex w-full">
                      Edit Schedule
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href={`/dashboard/schedules/${schedule.id}/items/create`} className="flex w-full">
                      Add Item
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Delete Schedule</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle>
              <Link href={`/dashboard/schedules/${schedule.id}`} className="hover:underline">
                {schedule.title}
              </Link>
            </CardTitle>
            <CardDescription>{schedule.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{schedule.itemCount} items</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{schedule.assigneeCount} assignees</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Created {new Date(schedule.createdAt).toLocaleDateString()}
            </div>
            <Badge variant={schedule.isPublic ? "default" : "outline"}>
              {schedule.isPublic ? "Public" : "Private"}
            </Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
