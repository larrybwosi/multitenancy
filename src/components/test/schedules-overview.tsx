import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users } from "lucide-react"
import { formatDate } from "@/lib/date-utils"
import type { ScheduleActivityData } from "@/types/dashboard"

interface SchedulesOverviewProps {
  schedules: ScheduleActivityData[]
}

export function SchedulesOverview({ schedules }: SchedulesOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Schedules</CardTitle>
        <CardDescription>Latest schedules in your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <p className="text-muted-foreground">No schedules found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{schedule.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{schedule.itemsCount} items</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{schedule.assigneesCount} assignees</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
