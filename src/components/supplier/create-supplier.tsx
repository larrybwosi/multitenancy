"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Building2, Info, Mail, MapPin, Phone, PlusIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSupplier } from "@/actions/supplier";
import { Supplier } from "@prisma/client";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";

const supplierFormSchema = z.object({
  name: z.string().min(2, {
    message: "Supplier name must be at least 2 characters.",
  }),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export default function CreateSupplier({
  onSupplierCreated,
  triggerText = "Add Supplier",
}: {
  onSupplierCreated: (supplier: Supplier) => void;
  triggerText?: string;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof supplierFormSchema>>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const ORGANIZATION_ID = "r9UlQeTQL9UN0EVV8YOLTY7eRcTYnEu5";

  async function onSubmit(values: z.infer<typeof supplierFormSchema>) {
    try {
      const result = await createSupplier({
        organizationId: ORGANIZATION_ID,
        ...values,
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      onSupplierCreated(result.data);
      form.reset();
      setOpen(false);
      toast.success("Supplier created",{
        description: `${values.name} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error creating supplier:", error);
      toast.error("Error creating supplier",{
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md">
          <PlusIcon className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center">
              <Building2 className="h-6 w-6 mr-2" />
              Add New Supplier
            </DialogTitle>
            <DialogDescription className="text-blue-100 mt-2 max-w-md">
              Complete the form below to add a new supplier to your organization. All fields with an asterisk (*) are required.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium flex items-center text-gray-700">
                      <Building2 className="h-4 w-4 mr-1.5 text-blue-500" />
                      Supplier Name <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the company or business name"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      The official name of the supplier company
                    </FormDescription>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center text-gray-700">
                      <User className="h-4 w-4 mr-1.5 text-blue-500" />
                      Contact Person
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter primary contact person's name"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      The person you typically deal with
                    </FormDescription>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center text-gray-700">
                      <Mail className="h-4 w-4 mr-1.5 text-blue-500" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@company.com"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      Used for purchase orders and communications
                    </FormDescription>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center text-gray-700">
                      <Phone className="h-4 w-4 mr-1.5 text-blue-500" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      Business phone for urgent communications
                    </FormDescription>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
                      Business Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Full address including city, state and postal code"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      Physical location for shipping and records
                    </FormDescription>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100 mt-6">
              <div className="flex items-center justify-between w-full">
                <p className="text-xs text-muted-foreground">
                  <Info className="inline h-3 w-3 mr-1 text-blue-500" />
                  You can edit these details later
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
                  >
                    Add Supplier
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
