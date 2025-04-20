"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { type RecurrencePattern, RecurrenceType } from "@/types/schedule"

interface RecurrencePatternSelectorProps {
  value: RecurrencePattern | null
  onChange: (pattern: RecurrencePattern | null) => void
  endDate: Date | null
  onEndDateChange: (date: Date | null) => void
}

export function RecurrencePatternSelector({
  value,
  onChange,
  endDate,
  onEndDateChange,
}: RecurrencePatternSelectorProps) {
  const [showRecurrence, setShowRecurrence] = useState(!!value)

  const handleTypeChange = (type: string) => {
    if (!showRecurrence) {
      return
    }

    onChange({
      type: type as RecurrenceType,
      interval: 1,
    })
  }

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!value) return

    const interval = Number.parseInt(e.target.value, 10)
    if (isNaN(interval) || interval < 1) return

    onChange({
      ...value,
      interval,
    })
  }

  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    if (!value) return

    const daysOfWeek = value.daysOfWeek || []

    onChange({
      ...value,
      daysOfWeek: checked ? [...daysOfWeek, day].sort() : daysOfWeek.filter((d) => d !== day),
    })
  }

  const toggleRecurrence = () => {
    if (showRecurrence) {
      setShowRecurrence(false)
      onChange(null)
      onEndDateChange(null)
    } else {
      setShowRecurrence(true)
      onChange({
        type: RecurrenceType.DAILY,
        interval: 1,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="recurrence" checked={showRecurrence} onCheckedChange={toggleRecurrence} />
        <Label htmlFor="recurrence">Repeat this event</Label>
      </div>

      {showRecurrence && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Recurrence Type</Label>
              <Select value={value?.type || RecurrenceType.DAILY} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RecurrenceType.DAILY}>Daily</SelectItem>
                  <SelectItem value={RecurrenceType.WEEKLY}>Weekly</SelectItem>
                  <SelectItem value={RecurrenceType.MONTHLY}>Monthly</SelectItem>
                  <SelectItem value={RecurrenceType.YEARLY}>Yearly</SelectItem>
                  <SelectItem value={RecurrenceType.CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Interval</Label>
              <div className="flex items-center gap-2">
                <span>Every</span>
                <Input
                  type="number"
                  min={1}
                  value={value?.interval || 1}
                  onChange={handleIntervalChange}
                  className="w-16"
                />
                <span>
                  {value?.type === RecurrenceType.DAILY && "days"}
                  {value?.type === RecurrenceType.WEEKLY && "weeks"}
                  {value?.type === RecurrenceType.MONTHLY && "months"}
                  {value?.type === RecurrenceType.YEARLY && "years"}
                  {value?.type === RecurrenceType.CUSTOM && "custom"}
                </span>
              </div>
            </div>
          </div>

          {value?.type === RecurrenceType.WEEKLY && (
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${index}`}
                      checked={(value.daysOfWeek || []).includes(index)}
                      onCheckedChange={(checked) => handleDayOfWeekChange(index, !!checked)}
                    />
                    <Label htmlFor={`day-${index}`}>{day}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "No end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate || undefined} onSelect={onEndDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
    </div>
  )
}
