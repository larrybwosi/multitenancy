import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, MapPin } from "lucide-react"
import { LocationDetail } from "@/components/location-detail"

export const metadata: Metadata = {
  title: "Location Details - Schedule Management System",
  description: "View and manage location details",
}

export default function LocationDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Location Details</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/locations/${params.id}/check-in`}>
            <Button>
              <MapPin className="mr-2 h-4 w-4" />
              Check In
            </Button>
          </Link>
          <Link href={`/dashboard/locations/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>
      <LocationDetail id={params.id} />
    </div>
  )
}
