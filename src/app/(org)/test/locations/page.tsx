import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { LocationsList } from "@/components/locations-list"

export const metadata: Metadata = {
  title: "Locations - Schedule Management System",
  description: "Manage your locations",
}

export default function LocationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
        <Link href="/dashboard/locations/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Location
          </Button>
        </Link>
      </div>
      <LocationsList />
    </div>
  )
}
