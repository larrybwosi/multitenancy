export function AttendanceOverview({ data }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs">On time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <span className="text-xs">On late</span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <svg viewBox="0 0 300 150" className="w-full h-full">
          {/* X-axis */}
          <line x1="30" y1="120" x2="290" y2="120" stroke="#e2e8f0" strokeWidth="1" />

          {/* Y-axis */}
          <line x1="30" y1="20" x2="30" y2="120" stroke="#e2e8f0" strokeWidth="1" />

          {/* Months */}
          <text x="50" y="135" fontSize="8" textAnchor="middle" fill="#64748b">
            Jan
          </text>
          <text x="90" y="135" fontSize="8" textAnchor="middle" fill="#64748b">
            Feb
          </text>
          <text x="130" y="135" fontSize="8" textAnchor="middle" fill="#64748b">
            Mar
          </text>
          <text x="170" y="135" fontSize="8" textAnchor="middle" fill="#64748b">
            Apr
          </text>
          <text x="210" y="135" fontSize="8" textAnchor="middle" fill="#64748b">
            May
          </text>
          <text x="250" y="135" fontSize="8" textAnchor="middle" fill="#64748b">
            Jun
          </text>

          {/* On time line */}
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            points="
              50,100
              90,60
              130,80
              170,40
              210,70
              250,50
            "
          />

          {/* On late line */}
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            points="
              50,90
              90,100
              130,70
              170,90
              210,60
              250,80
            "
          />

          {/* Data points - On time */}
          <circle cx="50" cy="100" r="3" fill="#6366f1" />
          <circle cx="90" cy="60" r="3" fill="#6366f1" />
          <circle cx="130" cy="80" r="3" fill="#6366f1" />
          <circle cx="170" cy="40" r="3" fill="#6366f1" />
          <circle cx="210" cy="70" r="3" fill="#6366f1" />
          <circle cx="250" cy="50" r="3" fill="#6366f1" />

          {/* Data points - On late */}
          <circle cx="50" cy="90" r="3" fill="#fbbf24" />
          <circle cx="90" cy="100" r="3" fill="#fbbf24" />
          <circle cx="130" cy="70" r="3" fill="#fbbf24" />
          <circle cx="170" cy="90" r="3" fill="#fbbf24" />
          <circle cx="210" cy="60" r="3" fill="#fbbf24" />
          <circle cx="250" cy="80" r="3" fill="#fbbf24" />
        </svg>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2">Attendance Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">On Time</div>
            <div className="text-lg font-medium">{data.onTime} days</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Late</div>
            <div className="text-lg font-medium">{data.late} days</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Absent</div>
            <div className="text-lg font-medium">{data.absent} days</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Leave</div>
            <div className="text-lg font-medium">{data.leave} days</div>
          </div>
        </div>
      </div>
    </div>
  )
}
