import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function RecentActivity({ data }) {
  // Calculate percentages for the bar chart
  const totalMinutes = data.pauseTime + data.activeTime + data.extraTime
  const pausePercentage = (data.pauseTime / totalMinutes) * 100
  const activePercentage = (data.activeTime / totalMinutes) * 100
  const extraPercentage = (data.extraTime / totalMinutes) * 100

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="font-medium">Recent activity</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-sm font-medium">Total time worked</div>
          <div className="text-2xl font-bold">
            {data.hours} hours {data.minutes} minutes
          </div>
        </div>

        <div className="h-6 flex rounded-full overflow-hidden mb-2">
          <div className="bg-amber-400" style={{ width: `${pausePercentage}%` }}></div>
          <div className="bg-blue-400" style={{ width: `${activePercentage}%` }}></div>
          <div className="bg-purple-400" style={{ width: `${extraPercentage}%` }}></div>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span className="text-xs">Pause Time</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-xs">Active Time</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span className="text-xs">Extra Time</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
