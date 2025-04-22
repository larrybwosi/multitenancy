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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Layers, Grid, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MeasurementUnit } from "@prisma/client"

// Define schema for form validation
const zoneFormSchema = z.object({
  name: z.string().min(2, { message: "Zone name must be at least 2 characters" }),
  description: z.string().optional(),
  capacity: z.coerce.number().positive().optional(),
  capacityUnit: z.enum([
    "CUBIC_METER", 
    "CUBIC_FEET", 
    "SQUARE_METER", 
    "SQUARE_FEET", 
    "METER", 
    "FEET", 
    "COUNT", 
    "WEIGHT_KG", 
    "WEIGHT_LB"
  ]).optional(),
})

type ZoneFormValues = z.infer<typeof zoneFormSchema>

interface ZoneCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouseId: string
  onSuccess: () => void
}

export function ZoneCreateDialog({ 
  open, 
  onOpenChange, 
  warehouseId, 
  onSuccess 
}: ZoneCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: undefined,
      capacityUnit: undefined,
    }
  })

  const handleSubmit = async (values: ZoneFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/warehouse/${warehouseId}/zones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create storage zone")
      }

      toast.success("Success", {
        description: "Storage zone created successfully",
      })

      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating zone:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to create storage zone",
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
            <Layers className="h-5 w-5 text-blue-600" />
            Create Storage Zone
          </DialogTitle>
          <DialogDescription>
            Add a new storage zone to organize your warehouse space.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Zone A" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique name for this storage zone.
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description of this zone's purpose or contents" 
                      className="resize-none min-h-24"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about this zone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Zone
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