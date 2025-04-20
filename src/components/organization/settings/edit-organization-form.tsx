"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
// import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  slug: z
    .string()
    .min(2, { message: "Slug must be at least 2 characters" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
  description: z.string().optional(),
  logo: z.any().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditOrganizationFormProps {
  onSuccess?: () => void
}

export function EditOrganizationForm({ onSuccess }: EditOrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call to get organization data
    const fetchData = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch('/api/organization');
        // const data = await response.json();

        // Using mock data for demonstration
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const mockOrganization = {
          id: "org_01",
          name: "Orlando Inc.",
          slug: "orlando",
          logo: "/logo.svg",
          description: "A leading provider of innovative solutions for businesses of all sizes.",
          createdAt: "2023-01-15T08:00:00.000Z",
        }

        setOrganization(mockOrganization)
        setLogoPreview(mockOrganization.logo)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching organization data:", error)
        // toast({
        //   title: "Error",
        //   description: "Failed to load organization data. Please try again.",
        //   variant: "destructive",
        // })
      }
    }

    fetchData()
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  })

  // Update form values when organization data is loaded
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        slug: organization.slug || "",
        description: organization.description || "",
      })
    }
  }, [organization, form])

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      form.setValue("logo", file)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      // In a real app, you would call your API
      // const formData = new FormData();
      // formData.append('name', values.name);
      // formData.append('slug', values.slug);
      // if (values.description) formData.append('description', values.description);
      // if (values.logo) formData.append('logo', values.logo);

      // await fetch('/api/organization', {
      //   method: 'PATCH',
      //   body: formData,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // toast({
      //   title: "Organization updated",
      //   description: "Your organization details have been updated successfully.",
      // })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to update organization. Please try again.",
      //   variant: "destructive",
      // })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <Skeleton className="h-32 w-32 rounded-lg mb-4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border mb-4">
            {logoPreview ? (
              <img
                src={logoPreview || "/placeholder.svg"}
                alt="Organization logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-4xl font-bold text-muted-foreground">
                  {form.getValues("name").charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="logo-upload"
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Logo
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />

            {logoPreview && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLogoPreview(null);
                  form.setValue("logo", undefined);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormDescription>
                This is your organization&apos;s display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="acme" {...field} />
              </FormControl>
              <FormDescription>
                The slug is used in URLs and must be unique.
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
                  placeholder="Enter a description of your organization"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Briefly describe your organization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
