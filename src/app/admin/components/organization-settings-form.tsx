// components/admin/organization-settings-form.tsx
"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { Organization } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { updateOrganizationSettings } from "@/actions/admin-actions";

interface OrganizationSettingsFormProps {
  organization: Organization;
}

// Simple Submit Button component for useFormState
function SubmitButton() {
  // Use useFormStatus to show pending state
  // const { pending } = useFormStatus(); // Not available in React 18 stable yet without experimental
  return (
    <Button type="submit" /* disabled={pending} */>
      {/* {pending ? 'Saving...' : 'Save Changes'} */}
      Save Changes
    </Button>
  );
}

export function OrganizationSettingsForm({
  organization,
}: OrganizationSettingsFormProps) {
  const initialState = { success: false, message: "", errors: null };
  const [state, formAction] = useFormState(
    updateOrganizationSettings,
    initialState
  );

  // useEffect(() => {
  //   if (state?.message) {
  //     toast({
  //       title: state.success ? "Success!" : "Error!",
  //       description: state.message,
  //       variant: state.success ? "default" : "destructive",
  //     });
  //   }
  // }, [state, toast]);

  return (
    <CardContent>
      <form action={formAction} className="space-y-6">
        {/* Hidden input for organization ID */}
        <input type="hidden" name="id" value={organization.id} />

        {/* Organization Name */}
        <div>
          <Label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Organization Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={organization.name ?? ""}
            required
            className="mt-1"
            aria-describedby="name-error"
          />
          {state?.errors?.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600">
              {state.errors.name.join(", ")}
            </p>
          )}
        </div>

        {/* Organization Logo */}
        <div>
          <Label
            htmlFor="logo"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Logo
          </Label>
          <div className="mt-1 flex items-center space-x-4">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt="Current Logo"
                className="h-16 w-16 rounded-full object-cover bg-gray-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <span>No Logo</span>
              </div>
            )}
            <Input
              id="logo"
              name="logo"
              type="file"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600"
              // Add onChange handler for preview if needed
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Note: Logo upload requires backend storage setup (not implemented in
            this example). This field is a placeholder.
          </p>
        </div>

        {/* Submit Button */}
        <SubmitButton />

        {/* General Form Error Message */}
        {!state?.success && state?.message && !state.errors && (
          <p className="mt-2 text-sm text-red-600">{state.message}</p>
        )}
      </form>
    </CardContent>
  );
}
