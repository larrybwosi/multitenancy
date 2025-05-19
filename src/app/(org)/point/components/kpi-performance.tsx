import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function KpiPerformance({ data }) {
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="font-medium">KPI performance</span>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="6">
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold">{data.percentage}%</div>
          <div className="flex items-center justify-center gap-1 text-xs">
            <span className="text-emerald-500">+{data.increase}%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>
        <div className="h-[150px] w-full">
          <svg viewBox="0 0 300 100" className="w-full h-full">
            {/* X-axis */}
            <line x1="0" y1="90" x2="300" y2="90" stroke="#e2e8f0" strokeWidth="1" />

            {/* Months */}
            <text x="25" y="100" fontSize="8" textAnchor="middle" fill="#64748b">
              Jan
            </text>
            <text x="75" y="100" fontSize="8" textAnchor="middle" fill="#64748b">
              Feb
            </text>
            <text x="125" y="100" fontSize="8" textAnchor="middle" fill="#64748b">
              Mar
            </text>
            <text x="175" y="100" fontSize="8" textAnchor="middle" fill="#64748b">
              Apr
            </text>
            <text x="225" y="100" fontSize="8" textAnchor="middle" fill="#64748b">
              May
            </text>
            <text x="275" y="100" fontSize="8" textAnchor="middle" fill="#64748b">
              Jun
            </text>

            {/* Performance line */}
            <polyline
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              points="
                25,70
                75,40
                125,50
                175,30
                225,45
                275,60
              "
            />

            {/* Data points */}
            <circle cx="25" cy="70" r="3" fill="#6366f1" />
            <circle cx="75" cy="40" r="3" fill="#6366f1" />
            <circle cx="125" cy="50" r="3" fill="#6366f1" />
            <circle cx="175" cy="30" r="3" fill="#6366f1" />
            <circle cx="225" cy="45" r="3" fill="#6366f1" />
            <circle cx="275" cy="60" r="3" fill="#6366f1" />
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
