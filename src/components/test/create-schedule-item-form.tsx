"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { RecurrencePatternSelector } from "@/components/recurrence-pattern-selector"
import type { RecurrencePattern, ScheduleItemStatus } from "@/types/schedule"

interface CreateScheduleItemFormProps {
  scheduleId: string
}

export function CreateScheduleItemForm({ scheduleId }: CreateScheduleItemFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    isAllDay: false,
    priority: "MEDIUM",
    status: "PENDING" as ScheduleItemStatus,
    recurrencePattern: null as RecurrencePattern | null,
    recurrenceEndDate: null as Date | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isAllDay: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRecurrenceChange = (pattern: RecurrencePattern | null) => {
    setFormData((prev) => ({ ...prev, recurrencePattern: pattern }))
  }

  const handleRecurrenceEndDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, recurrenceEndDate: date }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      return
    }

    setIsSubmitting(true)

    try {
      // In a real application, this would be an API call
      // const response = await fetch(`/api/schedules/${scheduleId}/items`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     startTime: startDate.toISOString(),
      //     endTime: endDate.toISOString(),
      //   }),
      // })

      // if (!response.ok) throw new Error('Failed to create schedule item')

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      router.push(`/dashboard/schedules/${scheduleId}`)
      router.refresh()
    } catch (error) {
      console.error("Error creating schedule item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Schedule Item Details</CardTitle>
          <CardDescription>Add a new item to your schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter item title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter item description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input type="time" defaultValue="09:00" disabled={formData.isAllDay} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input type="time" defaultValue="10:00" disabled={formData.isAllDay} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="Enter location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isAllDay" checked={formData.isAllDay} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="isAllDay">All day event</Label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value as ScheduleItemStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recurrence</Label>
            <RecurrencePatternSelector
              value={formData.recurrencePattern}
              onChange={handleRecurrenceChange}
              endDate={formData.recurrenceEndDate}
              onEndDateChange={handleRecurrenceEndDateChange}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Item"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
