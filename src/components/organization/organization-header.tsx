"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Filter, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function OrganizationHeader() {
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState("Dashboard")
  const [currentDate, setCurrentDate] = useState("")
  const [userName, setUserName] = useState("Meghan Lownest")
  const [userRole, setUserRole] = useState("Sales manager")

  useEffect(() => {
    // Set page title based on pathname
    const path = pathname.split("/").pop()
    if (path) {
      setPageTitle(path.charAt(0).toUpperCase() + path.slice(1))
    }

    // Set current date
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
    setCurrentDate(date.toLocaleDateString("en-US", options))
  }, [pathname])

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome {userName}!</h1>
          <p className="text-sm text-gray-500">Today is {currentDate}</p>
        </div>

        {pathname.includes("/dashboard") && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded-md p-1 bg-white">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Sep 11 - Oct 10</span>
              </Button>
              <Select defaultValue="monthly">
                <SelectTrigger className="border-0 w-[100px] p-1">
                  <SelectValue placeholder="Monthly" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>

            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        )}

        <div className="flex items-center">
          <div className="mr-3 text-right">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">ML</span>
          </div>
        </div>
      </div>
    </header>
  )
}
