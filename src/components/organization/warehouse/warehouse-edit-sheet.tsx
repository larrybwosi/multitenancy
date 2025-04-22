"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Building2, 
  MapPin, 
  User, 
  Package, 
  AlertCircle, 
  MapPinned,
  Mail, 
  FileText, 
  Loader2, 
  Save, 
  X
} from "lucide-react"
import { InventoryLocation } from "@prisma/client"
import { Member } from "@prisma/client"
import { StorageZone } from "@prisma/client"
import { StorageUnit } from "@prisma/client"

// Schema validation for form fields
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  location: z.string().min(2, { message: "Location must be at least 2 characters" }),
  manager: z.string().min(2, { message: "Manager name must be at least 2 characters" }),
  capacity: z.coerce.number().positive({ message: "Capacity must be a positive number" }),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]),
  description: z.string().optional(),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
})

type FormValues = z.infer<typeof formSchema>

// Status options with color mappings
const statusOptions = [
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "MAINTENANCE", label: "Maintenance", color: "bg-yellow-100 text-yellow-800" },
  { value: "INACTIVE", label: "Inactive", color: "bg-red-100 text-red-800" }
]

interface WarehouseEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse;
  onSave: (data: FormValues) => Promise<boolean>;
}

type Warehouse = InventoryLocation & {
  manager?: Member;
  zones?: StorageZone[];
  storageUnits?: StorageUnit[];
  stockItems?: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    value: number;
  }[];
  productCount?: number;
  stockValue?: number;
}

export function WarehouseEditSheet({ open, onOpenChange, warehouse, onSave }: WarehouseEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: warehouse?.name || "",
      location: warehouse?.location || "",
      manager: warehouse?.manager?.name || "",
      capacity: warehouse?.capacity || 0,
      status: warehouse?.isActive=== true ? "ACTIVE" : warehouse?.isActive === false ? "INACTIVE" : warehouse?.isActive || "ACTIVE",
      description: warehouse?.description || "",
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const success = await onSave(values)
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <SheetHeader className="text-white">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <p className="text-white">Edit Warehouse</p>
            </SheetTitle>
            <SheetDescription className="text-blue-100">
              Update the warehouse details and settings
            </SheetDescription>
          </SheetHeader>
        </div>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="space-y-6">
                {/* Basic Info Section */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          Warehouse Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Main Warehouse" 
                            className="focus:ring-blue-500 focus:border-blue-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">The name of the warehouse.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="New York, NY" 
                              className="focus:ring-blue-500 focus:border-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">City and state/province.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="manager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-500" />
                            Manager
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Smith" 
                              className="focus:ring-blue-500 focus:border-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Person responsible for this warehouse.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Operational Details Section */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Operational Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-gray-500" />
                            Capacity
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10000" 
                              className="focus:ring-blue-500 focus:border-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Maximum storage capacity in units.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-gray-500" />
                            Status
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="focus:ring-blue-500 focus:border-blue-500">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map(option => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                  className={option.color + " rounded-md px-2 py-1 my-1"}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">Current operational status.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-gray-500" />
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter a description of the warehouse" 
                              className="min-h-24 resize-none focus:ring-blue-500 focus:border-blue-500" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Additional details about the warehouse.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Contact Information Section */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Contact Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <MapPinned className="h-4 w-4 text-gray-500" />
                          Address
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 Storage Ave, New York, NY 10001" 
                            className="focus:ring-blue-500 focus:border-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Full street address of the warehouse.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                </div>
              </div>

              <SheetFooter className="pt-4 border-t gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}