// components/organization/OrganizationForm.tsx
"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Organization, Prisma } from "@prisma/client"; // Import Prisma for error checking if needed
import Image from "next/image";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { toast } from "sonner";

import { organizationSchema, OrganizationFormData } from "./validation";
import {
  createOrganization,
  updateOrganization,
  saveOrganizationCategories,
  // Assuming CreateOrganizationInput and UpdateOrganizationInput types exist
  // or are inferred correctly by the actions based on OrganizationFormData
} from "@/actions/organization";
import { getBusinessCategoriesFromDescription } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, UploadCloud, X, Wand2 } from "lucide-react";
import { uploadSanityAsset } from "@/actions/uploads";

interface OrganizationFormProps {
  organization?: Organization | null; // Pass existing org data for update mode
  initialCategories?: string[]; // Pass initial categories if fetched separately
}

// Define expected result shape for actions (adjust if actions return different structure)
type OrganizationActionResult = Organization; // Assuming success returns the Organization object
// If actions return an object with a message on error instead of throwing:
// type OrganizationActionResult = Organization | { success: false; message: string };

export function OrganizationForm({
  organization,
  initialCategories = [],
}: OrganizationFormProps) {
  const router = useRouter();
  const [isPending, startFormTransition] = useTransition();
  const [isGeneratingCategories, startCategoryTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization?.logo || null
  );
  const [generatedCategories, setGeneratedCategories] =
    useState<string[]>(initialCategories);
  // State to track if the *existing* logo should be removed on update
  const [removeCurrentLogo, setRemoveCurrentLogo] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdateMode = !!organization;

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || "",
      slug: organization?.slug || "",
      // Use existing logo URL string if updating, otherwise undefined.
      // The schema should handle File | string | null | undefined.
      logo: organization?.logo || undefined,
      businessDescription: organization?.description ?? "", // Use ?? for null/undefined
      metadata: organization?.metadata ?? "", // Use ?? for null/undefined
    },
  });

  // Watch the business description field for enabling the generate button
  const businessDescriptionValue = form.watch("businessDescription");

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic client-side validation (size, type)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
      ];

      if (file.size > MAX_SIZE) {
        form.setError("logo", {
          type: "manual",
          message: "Logo must be smaller than 5MB.",
        });
        setLogoPreview(organization?.logo || null); // Revert preview
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        form.setError("logo", {
          type: "manual",
          message: "Invalid file type (PNG, JPG, WEBP, SVG allowed).",
        });
        setLogoPreview(organization?.logo || null); // Revert preview
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      form.clearErrors("logo");
      setRemoveCurrentLogo(false); // Selecting a new file overrides removal intention
      const reader = new FileReader();
      reader.onloadend = () => {
        // result is string (Data URL)
        if (typeof reader.result === "string") {
          setLogoPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
      // Set the File object in the form state for validation/submission
      form.setValue("logo", file, { shouldValidate: true });
    } else {
      // No file selected, clear preview and reset form value based on mode
      const defaultValue = isUpdateMode ? organization?.logo || null : null;
      setLogoPreview(defaultValue);
      form.setValue("logo", defaultValue || undefined); // Reset to original URL or undefined
      setRemoveCurrentLogo(false); // Not explicitly removing
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    form.setValue("logo", null, { shouldValidate: true }); // Set value to null
    setRemoveCurrentLogo(true); // Mark the *current* logo for removal on submit (if updating)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input visually
    }
  };

  const handleGenerateCategories = () => {
    const description = form.getValues("businessDescription");
    if (!description || description.trim().length < 10) {
      toast.warning(
        "Please enter a brief description (at least 10 characters)."
      );
      return;
    }

    startCategoryTransition(async () => {
      toast.loading("Generating categories with AI...");
      try {
        const result = await getBusinessCategoriesFromDescription(description);
        toast.dismiss(); // Dismiss loading toast regardless of outcome

        if (result.success && result.categories) {
          setGeneratedCategories(result.categories);
          toast.success("Suggested categories generated!");
        } else {
          toast.error(result.error || "Failed to generate categories.");
        }
      } catch (error) {
        toast.dismiss();
        toast.error(
          "An unexpected error occurred while generating categories."
        );
        console.error("Category generation error:", error);
      }
    });
  };

  const onSubmit = (data: OrganizationFormData) => {
    startFormTransition(async () => {
      let logoUrl: string | undefined = undefined; // Final URL to save

      try {
        // 1. Handle Logo Upload/Removal
        if (data.logo instanceof File) {
          toast.loading("Uploading logo...");
          const uploadedUrl = await uploadSanityAsset(
            data.logo,
            `logo-${data.slug || Date.now()}`, // Use slug or timestamp for filename
            "image"
          );
          toast.dismiss();
          if (uploadedUrl) {
            logoUrl = uploadedUrl;
            toast.success("Logo uploaded.");
          } else {
            toast.error("Logo upload failed. Please try again.");
            return; // Stop submission if upload fails
          }
        } else if (removeCurrentLogo && isUpdateMode) {
          logoUrl = undefined; // Explicitly removing the logo
        } else if (!removeCurrentLogo && isUpdateMode) {
          //@ts-expect-error ** this is fine
          logoUrl = organization?.logo; // Keep the existing logo URL
        } else {
          // Creating new OR updating without changing logo (and no existing logo)
          logoUrl = undefined; // Let the backend handle default/absence
        }

        // 2. Prepare Payload (avoiding mutation of 'data')
        // Note: createOrganization generates its own slug based on the provided function
        const createPayload = {
          name: data.name,
          description: data.businessDescription, // Map form field to DB field
          logo: logoUrl, // Use processed URL
          // metadata: data.metadata // Include if createOrganization accepts it
        };

        const updatePayload = {
          name: data.name,
          slug: data.slug, // Include slug for update
          businessDescription: data.businessDescription,
          logo: logoUrl,
          metadata: data.metadata, // Include metadata for update
        };

        // 3. Call Server Action
        let response: OrganizationActionResult;
        toast.loading(
          isUpdateMode ? "Updating organization..." : "Creating organization..."
        );

        if (isUpdateMode && organization?.id) {
          // Ensure updateOrganization expects this payload structure
          response = await updateOrganization(organization.id, updatePayload);
        } else {
          // Ensure createOrganization expects this payload structure
          response = await createOrganization(createPayload);
        }
        toast.dismiss();

        // 4. Handle Success - Check for ID as confirmation
        if (response && response.id) {
          toast.success(
            `Organization ${isUpdateMode ? "updated" : "created"} successfully.`,
            { duration: 5000 }
          );

          // --- Save Generated Categories (After Org Creation/Update) ---
          if (generatedCategories.length > 0) {
            const categoryResult = await saveOrganizationCategories(
              response.id,
              generatedCategories
            );
            if (categoryResult.success) {
              toast.success("Business categories saved.");
            } else {
              toast.warning(
                `Organization ${isUpdateMode ? "updated" : "created"}, but failed to save categories: ${categoryResult.message}`
              );
            }
          }
          // --- End Category Saving ---

          // Redirect after success
          router.push(`/dashboard/organizations/${response.id}/settings`); // Example redirect
          router.refresh(); // Refresh server components on the new page
        } else {
          // This case might not be reached if actions throw errors instead
          // Keeping it in case actions return error objects
          toast.error(
            (response as any)?.message ||
              "An unknown error occurred during submission."
          );
          console.error("Form submission failed:", response);
        }
      } catch (error: unknown) {
        toast.dismiss();
        console.error("Form submission error:", error);
        // Handle specific Prisma errors if needed
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          toast.error(
            "An organization with a similar name or URL slug already exists."
          );
        } else if (error instanceof Error) {
          toast.error(`An error occurred: ${error.message}`);
        } else {
          toast.error("An unexpected error occurred during submission.");
        }
      } finally {
        setRemoveCurrentLogo(false); // Reset removal flag after attempt
      }
    });
  };

  // Auto-generate slug suggestion as user types name (only on create)
  useEffect(() => {
    if (!isUpdateMode) {
      const subscription = form.watch((value, { name, type }) => {
        // Only update slug if name changed and slug hasn't been manually edited
        if (name === "name" && value.name && !form.formState.dirtyFields.slug) {
          const suggestedSlug = slugify(value.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g, // Remove problematic characters
            trim: true,
          });
          form.setValue("slug", suggestedSlug, { shouldValidate: true });
        }
      });
      return () => subscription.unsubscribe();
    }
    // Dependency array: include methods from 'form' used inside the effect
  }, [isUpdateMode, form.watch, form.setValue, form.formState.dirtyFields]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border border-border/40 bg-card">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">
          {isUpdateMode ? "Update Organization" : "Create New Organization"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isUpdateMode
            ? "Modify the details of your organization."
            : "Fill in the details to set up your new organization."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        {/* Use native <form> onSubmit and preventDefault is handled by RHF's handleSubmit */}
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-8 p-6">
            {/* Logo Upload Section */}
            <FormField
              control={form.control}
              name="logo"
              render={() => (
                // No 'field' needed directly due to custom handler + ref
                <FormItem>
                  <FormLabel>Organization Logo</FormLabel>
                  <FormControl>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      {/* Preview Box */}
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted flex-shrink-0">
                        {logoPreview ? (
                          <Image
                            src={logoPreview}
                            alt="Logo Preview"
                            fill // Use fill layout
                            sizes="96px" // Provide sizes hint
                            style={{ objectFit: "cover" }} // Use style for objectFit
                          />
                        ) : (
                          <UploadCloud className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      {/* Buttons and Input */}
                      <div className="flex flex-col space-y-2 items-start">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isPending || isGeneratingCategories}
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {/* Show "Change" if there's a preview and no error */}
                          {logoPreview && !form.formState.errors.logo
                            ? "Change Logo"
                            : "Upload Logo"}
                        </Button>
                        {/* Show Remove button only if there's a preview */}
                        {logoPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={removeLogo}
                            disabled={isPending || isGeneratingCategories}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove Logo
                          </Button>
                        )}
                        {/* Hidden Actual Input */}
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleLogoChange}
                          disabled={isPending || isGeneratingCategories}
                          // RHF controls this via setValue, no need for {...field} props
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="mt-2">
                    PNG, JPG, WEBP, SVG recommended (Max 5MB).
                  </FormDescription>
                  <FormMessage /> {/* Displays validation errors */}
                </FormItem>
              )}
            />

            {/* Organization Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Acme Innovations"
                      {...field}
                      disabled={isPending}
                      aria-required="true"
                    />
                  </FormControl>
                  <FormDescription>
                    The official name of your business or project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm pointer-events-none">
                        your-domain.com/org/
                      </span>
                      <Input
                        placeholder="e.g., acme-innovations"
                        {...field}
                        // Apply slugify formatting on change
                        onChange={(e) => {
                          const value = e.target.value;
                          const formatted = value
                            ? slugify(value, {
                                lower: true,
                                strict: true,
                                remove: /[*+~.()'"!:@]/g,
                                trim: true,
                              })
                            : "";
                          field.onChange(formatted); // Update RHF state with formatted value
                        }}
                        disabled={isPending}
                        className="pl-36 sm:pl-40" // Adjust padding based on prefix length
                        aria-required="true"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Unique identifier for URLs (letters, numbers, hyphens only).
                    Auto-suggested from name on creation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Description & Category Generation */}
            <FormField
              control={form.control}
              name="businessDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what your organization does (e.g., 'We build software for managing coffee shops', 'A local bakery specializing in sourdough bread'). This helps categorize your business."
                      className="resize-y min-h-[100px]"
                      rows={4}
                      {...field}
                      value={field.value ?? ""} // Ensure value is always string
                      disabled={isPending || isGeneratingCategories}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear description to help us suggest relevant
                    categories.
                  </FormDescription>
                  <FormMessage />

                  {/* Category Generation Button and Display */}
                  <div className="mt-4 space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateCategories}
                      disabled={
                        isPending ||
                        isGeneratingCategories ||
                        !businessDescriptionValue || // Disable if no description
                        businessDescriptionValue.trim().length < 10 // Disable if too short
                      }
                      aria-label="Suggest business categories based on description using AI"
                    >
                      {isGeneratingCategories ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      Suggest Categories (AI)
                    </Button>

                    {generatedCategories.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Suggested Categories:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {generatedCategories.map((category) => (
                            <Badge key={category} variant="secondary">
                              {" "}
                              {/* Use category as key */}
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </FormItem>
              )}
            />

            {/* Metadata */}
            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes or simple configuration details here (e.g., API keys for internal tools, setup reminders). Not typically shown publicly."
                      className="resize-none" // Prevent resizing
                      rows={3}
                      {...field}
                      value={field.value ?? ""} // Ensure value is always string
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes for administrative purposes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end p-6 border-t border-border/40 mt-4">
            <Button
              type="submit"
              disabled={isPending || isGeneratingCategories} // Disable during transitions
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUpdateMode ? "Saving..." : "Creating..."}
                </>
              ) : isUpdateMode ? (
                "Save Changes"
              ) : (
                "Create Organization"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
