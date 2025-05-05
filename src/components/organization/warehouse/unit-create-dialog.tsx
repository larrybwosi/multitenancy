"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Boxes, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MeasurementUnit, StorageUnitType } from "@/prisma/client"

// Define schema for form validation
const unitFormSchema = z.object({
  name: z.string().min(2, { message: "Unit name must be at least 2 characters" }),
  unitType: z.nativeEnum(StorageUnitType).default(StorageUnitType.SHELF),
  reference: z.string().optional(),
  position: z.string().optional(),
  capacity: z.coerce.number().positive().optional(),
  capacityUnit: z.nativeEnum(MeasurementUnit).default(MeasurementUnit.CUBIC_METER).optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  depth: z.coerce.number().positive().optional(),
  dimensionUnit: z.enum(["cm", "inches", "m", "ft"]).optional(),
  maxWeight: z.coerce.number().positive().optional(),
  weightUnit: z.enum(["kg", "lbs"]).optional(),
})

type UnitFormValues = z.infer<typeof unitFormSchema>

interface UnitCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouseId: string
  zoneId: string
}

export function UnitCreateDialog({ 
  open, 
  onOpenChange, 
  warehouseId,
  zoneId,
}: UnitCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: "",
      unitType: "SHELF",
      reference: "",
      position: "",
      capacity: undefined,
      capacityUnit: undefined,
      width: undefined,
      height: undefined,
      depth: undefined,
      dimensionUnit: undefined,
      maxWeight: undefined,
      weightUnit: undefined,
    }
  })

  const handleSubmit = async (values: UnitFormValues) => {
    setIsSubmitting(true)
    try {
      // Include the zoneId in the payload
      const payload = {
        ...values,
        zoneId
      }
      
      const response = await fetch(`/api/warehouse/${warehouseId}/units`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create storage unit")
      }

      toast.success("Success", {
        description: "Storage unit created successfully",
      })

      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating unit:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to create storage unit",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-green-600" />
            Create Storage Unit
          </DialogTitle>
          <DialogDescription>
            Add a new storage unit to this zone.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Rack A1" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique name for this unit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SHELF">Shelf</SelectItem>
                        <SelectItem value="RACK">Rack</SelectItem>
                        <SelectItem value="BIN">Bin</SelectItem>
                        <SelectItem value="DRAWER">Drawer</SelectItem>
                        <SelectItem value="PALLET">Pallet</SelectItem>
                        <SelectItem value="SECTION">Section</SelectItem>
                        <SelectItem value="REFRIGERATOR">Refrigerator</SelectItem>
                        <SelectItem value="FREEZER">Freezer</SelectItem>
                        <SelectItem value="CABINET">Cabinet</SelectItem>
                        <SelectItem value="BULK_AREA">Bulk Area</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type of storage unit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="External reference/barcode" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional external reference number.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Aisle 5, Section B" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Physical location reference.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        {...field}
                        value={field.value === undefined ? '' : field.value}
                      />
                    </FormControl>
                    <FormDescription>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CUBIC_METER">Cubic Meters (m³)</SelectItem>
                        <SelectItem value="CUBIC_FEET">Cubic Feet (ft³)</SelectItem>
                        <SelectItem value="SQUARE_METER">Square Meters (m²)</SelectItem>
                        <SelectItem value="SQUARE_FEET">Square Feet (ft²)</SelectItem>
                        <SelectItem value="METER">Meters (m)</SelectItem>
                        <SelectItem value="FEET">Feet (ft)</SelectItem>
                        <SelectItem value="COUNT">Count (units)</SelectItem>
                        <SelectItem value="WEIGHT_KG">Weight (kg)</SelectItem>
                        <SelectItem value="WEIGHT_LB">Weight (lb)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Unit of measurement for capacity.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Physical Dimensions (Optional)</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="depth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depth</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="dimensionUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimension Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cm">Centimeters (cm)</SelectItem>
                          <SelectItem value="inches">Inches (in)</SelectItem>
                          <SelectItem value="m">Meters (m)</SelectItem>
                          <SelectItem value="ft">Feet (ft)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Weight</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="weightUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Unit
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 