import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ProjectCompletion({ data }) {
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
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 18v-6" />
            <path d="M8 18v-1" />
            <path d="M16 18v-3" />
          </svg>
          <span className="font-medium">Project completion</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-sm font-medium">Total projects completed</div>
          <div className="text-2xl font-bold">{data.totalProjects} Projects</div>
        </div>

        <div className="space-y-4">
          {data.projects.map((project, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{project.name}</span>
                <span>{project.percentage}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${project.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
