import { FileTextIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ExpenseReports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and download expense reports</p>
        </div>
      </div>
      
      <Card className="flex items-center justify-center h-[500px]">
        <CardContent className="text-center">
          <FileTextIcon className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Reports Coming Soon</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re working on a comprehensive reporting system for your expenses.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
