import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/location-utils"
import type { CheckIn } from "@/types/location"

interface RecentCheckInsProps {
  checkIns: CheckIn[]
}

export function RecentCheckIns({ checkIns }: RecentCheckInsProps) {
  // Calculate duration between check-in and check-out
  const calculateDuration = (checkInTime: string, checkOutTime: string | null): number | null => {
    if (!checkOutTime) return null

    const checkIn = new Date(checkInTime).getTime()
    const checkOut = new Date(checkOutTime).getTime()

    return Math.round((checkOut - checkIn) / 60000) // Duration in minutes
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Check-ins</CardTitle>
        <CardDescription>Latest check-in activity across all locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checkIns.length === 0 ? (
            <p className="text-muted-foreground">No check-ins found.</p>
          ) : (
            checkIns.map((checkIn) => (
              <div key={checkIn.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={checkIn.member?.user?.avatar || "/placeholder.svg"}
                    alt={checkIn.member?.user?.name}
                  />
                  <AvatarFallback>
                    {checkIn.member?.user?.name
                      ? checkIn.member.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{checkIn.member?.user?.name}</p>
                    <Badge variant={checkIn.checkOutTime ? "outline" : "default"}>
                      {checkIn.checkOutTime ? "Checked Out" : "Active"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Location: {checkIn.location?.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    Checked in: {new Date(checkIn.checkInTime).toLocaleString()}
                  </p>
                  {checkIn.checkOutTime && (
                    <p className="text-sm text-muted-foreground">
                      Checked out: {new Date(checkIn.checkOutTime).toLocaleString()}
                    </p>
                  )}
                  {checkIn.notes && <p className="text-sm">{checkIn.notes}</p>}
                  {checkIn.checkOutTime && (
                    <p className="text-sm font-medium">
                      Duration: {formatDuration(calculateDuration(checkIn.checkInTime, checkIn.checkOutTime))}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
