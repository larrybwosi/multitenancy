"use client"

import { Badge } from "@/components/ui/badge"

interface OrganizationHeaderProps {
  activeTab: string
}

export function OrganizationHeader({ activeTab }: OrganizationHeaderProps) {
  return (
    <header className="flex-1 sticky top-0 z-10 bg-white border-b border-orange-200 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
            D
          </div>
          <span className="text-xl font-semibold text-orange-900">Dealio Setup</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex">
            <Badge
              variant={activeTab === "details" ? "default" : "outline"}
              className={`mr-2 ${activeTab === "details" ? "bg-orange-500 hover:bg-orange-500" : "border-orange-200 text-orange-700"}`}
            >
              1. Details
            </Badge>
            <Badge
              variant={activeTab === "categories" ? "default" : "outline"}
              className={`mr-2 ${activeTab === "categories" ? "bg-orange-500 hover:bg-orange-500" : "border-orange-200 text-orange-700"}`}
            >
              2. Categories
            </Badge>
            <Badge
              variant={activeTab === "settings" ? "default" : "outline"}
              className={
                activeTab === "settings" ? "bg-orange-500 hover:bg-orange-500" : "border-orange-200 text-orange-700"
              }
            >
              3. Settings
            </Badge>
          </div>
        </div>
      </div>
    </header>
  )
}

export default OrganizationHeader
