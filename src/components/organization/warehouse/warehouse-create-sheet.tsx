"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Warehouse, MapPin, Info, User, Package } from "lucide-react"
import { toast } from "sonner"
import { LocationType, MeasurementUnit } from "@/prisma/client"
import type { z } from "zod"
import { createInventoryLocationSchema } from "@/lib/validations/warehouse"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type FormValues = z.infer<typeof createInventoryLocationSchema>

interface WarehouseCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WarehouseCreateSheet({ open, onOpenChange, onSuccess }: WarehouseCreateSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Added state to track capacity tracking toggle
  const [capacityTrackingEnabled, setCapacityTrackingEnabled] = useState(false)

  const form = useForm({
    resolver: zodResolver(createInventoryLocationSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      isDefault: false,
      locationType: LocationType.RETAIL_SHOP,
      address: "",
      capacityTracking: false,
      totalCapacity: undefined,
      capacityUnit: undefined,
      parentLocationId: undefined,
      managerId: undefined,
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/warehouse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Failed to create warehouse")

      toast.success("Warehouse created", {
        description: "The warehouse has been successfully created.",
      })

      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating warehouse:", error)
      toast.error("Error", {
        description: "Failed to create warehouse. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            <SheetTitle>Create Warehouse</SheetTitle>
          </div>
          <SheetDescription>
            Add a new warehouse to your organization. Fill in the details below.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="p-4 bg-muted/40 rounded-lg border border-border/50 space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-base font-medium">
                        Warehouse Name
                        <Badge variant="outline" className="ml-2 font-normal">
                          Required
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Main Warehouse"
                          {...field}
                          className="shadow-sm"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        A unique identifier for this location.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-base font-medium">
                        <Info className="h-4 w-4" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a description of the warehouse"
                          className="resize-none min-h-24 shadow-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Additional details about the warehouse.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
                <h3 className="font-medium mb-4 text-sm text-muted-foreground flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Location Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="locationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="shadow-sm">
                              <SelectValue placeholder="Select location type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(LocationType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          The type of location.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          value={field.value ? "true" : "false"}
                        >
                          <FormControl>
                            <SelectTrigger className="shadow-sm">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">
                              <span className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-600 border-green-200"
                                >
                                  Active
                                </Badge>
                              </span>
                            </SelectItem>
                            <SelectItem value="false">
                              <span className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-600 border-red-200"
                                >
                                  Inactive
                                </Badge>
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Current operational status.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St, New York, NY"
                            {...field}
                            value={field.value || ""}
                            className="shadow-sm"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          The physical address of the warehouse.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Capacity Management
                  </h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormField
                          control={form.control}
                          name="capacityTracking"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    setCapacityTrackingEnabled(!!checked);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                Enable capacity tracking
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Track and manage inventory capacity
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!capacityTrackingEnabled ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <FormField
                    control={form.control}
                    name="totalCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10000"
                            className="shadow-sm"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            value={field.value ?? ""}
                            disabled={!capacityTrackingEnabled}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Maximum storage capacity.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capacityUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                          disabled={!capacityTrackingEnabled}
                        >
                          <FormControl>
                            <SelectTrigger className="shadow-sm">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            <div className="p-2 sticky top-0 bg-background border-b z-10">
                              <h4 className="text-sm font-medium">
                                Measurement Units
                              </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-1 p-1">
                              {Object.values(MeasurementUnit).map((unit) => (
                                <SelectItem
                                  key={unit}
                                  value={unit}
                                  className="flex-1"
                                >
                                  {unit.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </div>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Unit of measurement for capacity.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
                <h3 className="font-medium mb-4 text-sm text-muted-foreground flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Management
                </h3>
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="clk123..."
                          {...field}
                          value={field.value ?? ""}
                          className="shadow-sm"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        The ID of the manager responsible.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-border/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Warehouse"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}