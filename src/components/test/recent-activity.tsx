"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for demonstration
const mockActivities = [
  {
    id: "1",
    user: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    action: "created",
    target: "Team Meeting schedule",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    user: {
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    action: "updated",
    target: "Project Timeline schedule",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    user: {
      name: "Mike Johnson",
      email: "mike@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    action: "assigned",
    target: "Client Meeting to Sarah",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "4",
    user: {
      name: "Sarah Williams",
      email: "sarah@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    action: "completed",
    target: "Product Demo task",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
]

export function RecentActivity() {
  const [activities] = useState(mockActivities)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions performed by team members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                <AvatarFallback>
                  {activity.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  <span className="font-semibold">{activity.user.name}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span> <span>{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
