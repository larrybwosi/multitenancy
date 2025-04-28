"use client"

import type React from "react"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface EditWarehouseSheetProps {
  warehouseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditWarehouseSheet({ warehouseId, open, onOpenChange }: EditWarehouseSheetProps) {
  // Mock data for warehouse
  const warehouse = {
    id: "1",
    name: "Main Warehouse",
    description: "Primary storage facility for electronics and consumer goods.",
    location: "123 Warehouse Ave, New York, NY 10001",
    type: "WAREHOUSE",
    manager: "John Smith",
    totalCapacity: 10000,
    capacityUnit: "CUBIC_METER",
    operatingHours: "24/7",
    securityLevel: "High",
    temperatureControlled: true,
    temperature: {
      min: 18,
      max: 24,
      unit: "°C",
    },
    humidity: {
      value: 45,
      unit: "%",
    },
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: warehouse.name,
    description: warehouse.description,
    location: warehouse.location,
    type: warehouse.type,
    manager: warehouse.manager,
    totalCapacity: warehouse.totalCapacity,
    capacityUnit: warehouse.capacityUnit,
    operatingHours: warehouse.operatingHours,
    securityLevel: warehouse.securityLevel,
    temperatureControlled: warehouse.temperatureControlled,
    temperatureMin: warehouse.temperature.min,
    temperatureMax: warehouse.temperature.max,
    humidityValue: warehouse.humidity.value,
  })

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Warehouse updated successfully", {
        description: `Warehouse "${formData.name}" has been updated.`,
      })

      setIsSubmitting(false)
      onOpenChange(false)
    }, 1000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Edit Warehouse</SheetTitle>
            <SheetDescription>
              Make changes to your warehouse details here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger id="type" className="col-span-3">
                  <SelectValue placeholder="Select warehouse type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                  <SelectItem value="RETAIL_SHOP">Retail Shop</SelectItem>
                  <SelectItem value="DISTRIBUTION">Distribution Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">
                Manager
              </Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => handleChange("manager", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalCapacity" className="text-right">
                Total Capacity
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="totalCapacity"
                  type="number"
                  value={formData.totalCapacity}
                  onChange={(e) => handleChange("totalCapacity", Number.parseInt(e.target.value))}
                  className="flex-1"
                  required
                />
                <Select value={formData.capacityUnit} onValueChange={(value) => handleChange("capacityUnit", value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUBIC_METER">Cubic Meters</SelectItem>
                    <SelectItem value="CUBIC_FEET">Cubic Feet</SelectItem>
                    <SelectItem value="SQUARE_METER">Square Meters</SelectItem>
                    <SelectItem value="UNITS">Units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operatingHours" className="text-right">
                Operating Hours
              </Label>
              <Input
                id="operatingHours"
                value={formData.operatingHours}
                onChange={(e) => handleChange("operatingHours", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="securityLevel" className="text-right">
                Security Level
              </Label>
              <Select value={formData.securityLevel} onValueChange={(value) => handleChange("securityLevel", value)}>
                <SelectTrigger id="securityLevel" className="col-span-3">
                  <SelectValue placeholder="Select security level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temperatureControlled" className="text-right">
                Temperature Controlled
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="temperatureControlled"
                  checked={formData.temperatureControlled}
                  onCheckedChange={(checked) => handleChange("temperatureControlled", checked)}
                />
                <Label htmlFor="temperatureControlled">{formData.temperatureControlled ? "Yes" : "No"}</Label>
              </div>
            </div>
            {formData.temperatureControlled && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="temperatureRange" className="text-right">
                    Temperature Range
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="temperatureMin"
                      type="number"
                      value={formData.temperatureMin}
                      onChange={(e) => handleChange("temperatureMin", Number.parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span>to</span>
                    <Input
                      id="temperatureMax"
                      type="number"
                      value={formData.temperatureMax}
                      onChange={(e) => handleChange("temperatureMax", Number.parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span>°C</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="humidity" className="text-right">
                    Humidity
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="humidityValue"
                      type="number"
                      value={formData.humidityValue}
                      onChange={(e) => handleChange("humidityValue", Number.parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span>%</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
