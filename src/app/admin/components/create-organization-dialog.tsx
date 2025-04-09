// components/admin/create-organization-dialog.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useFormState /* useFormStatus */ } from "react-dom"; // useFormStatus for pending state if using experimental React
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createOrganization } from "@/actions/admin-actions"; // Adjust path if needed
import { Building } from "lucide-react"; // Example Icon

// Simple Submit Button component for useFormState pending state
function SubmitButton() {
  // const { pending } = useFormStatus(); // Enable if using experimental React
  const [isPending, startTransition] = useTransition(); // Fallback if not using useFormStatus

  // Note: This button's disabled state won't automatically work with useFormState
  // unless you lift the form state logic or use a library like react-hook-form.
  // For simplicity, we rely on the form's built-in submission state.
  // Or, manually track pending state with useTransition if needed for direct action calls.
  // Since we use useFormState, the form handles disabling implicitly during submission.

  return (
    <Button type="submit" /* disabled={pending} */>
      {/* {pending ? 'Creating...' : 'Create Organization'} */}
      Create Organization
    </Button>
  );
}

export function CreateOrganizationDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const initialState = {
    success: false,
    message: "",
    errors: null,
    data: null,
  };
  const [state, formAction] = useFormState(createOrganization, initialState);

  // useEffect(() => {
  //   if (state?.message) {
  //     toast({
  //       title: state.success ? "Success!" : "Error!",
  //       description: state.message,
  //       variant: state.success ? "default" : "destructive",
  //     });
  //   }
  //   // Close dialog on successful creation
  //   if (state?.success) {
  //     setIsOpen(false);
  //     // Optional: Redirect or trigger data refresh here if needed
  //     // Example: router.push(`/dashboard/${state.data?.organizationId}`);
  //   }
  // }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Building className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Enter the details for your new organization. A unique slug will be
            generated if left blank.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          {/* Organization Name */}
          <div className="space-y-1">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Acme Corporation"
              required
              aria-describedby="name-error"
            />
            {state?.errors?.name && (
              <p id="name-error" className="text-sm text-red-600">
                {state.errors.name.join(", ")}
              </p>
            )}
          </div>

          {/* Organization Slug (Optional) */}
          <div className="space-y-1">
            <Label htmlFor="slug">Unique Slug (Optional)</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="acme-corp (auto-generated if blank)"
              aria-describedby="slug-error slug-description"
            />
            <p id="slug-description" className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only.
            </p>
            {state?.errors?.slug && (
              <p id="slug-error" className="text-sm text-red-600">
                {state.errors.slug.join(", ")}
              </p>
            )}
          </div>

          {/* General Form Error Message */}
          {!state?.success && state?.message && !state.errors && (
            <p className="mt-2 text-sm text-red-600">{state.message}</p>
          )}

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
