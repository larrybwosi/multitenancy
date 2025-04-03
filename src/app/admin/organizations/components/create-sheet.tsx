// components/organizations/CreateOrganizationSheet.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  organizationSchema,
  OrganizationCreationData,
} from "@/lib/validations/organization";
import { toast } from "sonner";
import { admin, organization, useSession } from '@/lib/auth/authClient'

interface CreateOrganizationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSuccess?: (newOrg: any) => void; 
}

// Get Enum keys for iteration
// const businessTypeOptions = Object.keys(
//   BusinessType
// ) as (keyof typeof BusinessType)[];
// const moduleAccessOptions = Object.keys(
//   ModuleAccess
// ) as (keyof typeof ModuleAccess)[];

export function CreateOrganizationSheet({
  open,
  onOpenChange,
  onCreateSuccess,
}: CreateOrganizationSheetProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OrganizationCreationData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      logo: "",
    },
  });
  
  async function onSubmit(data: OrganizationCreationData) {
    setIsLoading(true);
    // console.log("Form Data:", data); // Log data for debugging

    try {
      // const response = await fetch("/api/organizations", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || "Failed to create organization");
      // }

      // const newOrg = await response.json();
      const newOrg = await organization.create({
        name: data.name,
        logo: data.logo,
        slug: data.name.toLowerCase().replace(/\s+/g, "-"),

      })

      console.log("New Organization:", newOrg);

      toast.success("Organization Created",{
        description: `"${data.name}" has been successfully created.`,
      });
      form.reset(); // Reset form after successful submission
      onOpenChange(false); // Close the sheet
      onCreateSuccess?.(newOrg); // Trigger refresh or update UI
    } catch (error) {
      console.error("Creation Error:", error);
      toast("Error Creating Organization",{
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader className="px-6 pt-6">
              <SheetTitle>Create New Organization</SheetTitle>
              <SheetDescription>
                Fill in the details below to set up a new organization profile.
                Required fields are marked with *.
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-grow px-6 py-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4 p-4 border rounded-md">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Acme Corporation"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/logo.png"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </div>
            </ScrollArea>

            <SheetFooter className="px-6 py-4 border-t mt-auto">
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Organization"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
