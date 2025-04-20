import type { Metadata } from "next"
// import { CheckInForm } from "@/components/test/check-in-form"

export const metadata: Metadata = {
  title: "Check In - Schedule Management System",
  description: "Check in at a location",
}

export default function CheckInPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Check In</h1>
      </div>
      <CheckInForm locationId={params.id} />
    </div>
  )
}
