import { Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function OrderQueues({ data }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Order queues</h2>
        <Button variant="ghost" size="sm" className="gap-1">
          <Eye className="h-4 w-4" />
          <span>View All</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((queue) => (
          <OrderQueueCard key={queue.id} queue={queue} />
        ))}
      </div>
    </div>
  )
}

function OrderQueueCard({ queue }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge
            variant={
              queue.status === "Ready to serve"
                ? "success"
                : queue.status === "On cooking"
                  ? "warning"
                  : queue.status === "Canceled"
                    ? "destructive"
                    : "outline"
            }
            className="mb-2"
          >
            {queue.status}
          </Badge>
          <span className="text-sm text-muted-foreground">#{queue.orderNumber}</span>
        </div>

        <h3 className="font-medium">{queue.customerName}</h3>
        <p className="text-sm text-muted-foreground mb-2">{queue.timestamp}</p>

        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="rounded-full">
            {queue.itemCount} items
          </Badge>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Table {queue.tableNumber}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
