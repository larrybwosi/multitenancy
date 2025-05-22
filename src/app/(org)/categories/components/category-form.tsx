"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Category } from "@/prisma/client"; // Import base Category type

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useState } from "react";
import { toast } from "sonner";
import { useCategoryOptions, useSaveCategory } from "@/lib/hooks/use-categories";

// --- Zod Schema --- (can be defined here or imported)
const CategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required."),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(), // Allow empty/null
});

type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

// --- Component Props ---
interface CategoryFormProps {
  category?: Category | null; // Pass existing category for editing
  onFormSubmit: () => void; // Callback to close dialog/modal
}

// --- Component ---
export function CategoryForm({
  category,
  onFormSubmit,
}: CategoryFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync:createCategory, isPending} = useSaveCategory()
  const { data: categoryOptions, isPending: loadingCategoryOptions } = useCategoryOptions()

  const isEditing = !!category;
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      parentId: category?.parentId || null, // Ensure null if undefined/null
    },
  });

  async function onSubmit(data: CategoryFormValues) {
    setError(null); // Clear previous errors
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) {
      formData.append("description", data.description);
    }
    // Handle parentId: append only if it has a value, otherwise it might send 'null' as string
    if (data.parentId) {
      formData.append("parentId", data.parentId);
    } else {
      // Explicitly do not append if null/undefined/empty string to match server action logic
    }

    if (isEditing && category?.id) {
      formData.append("id", category.id);
    }

    const result = await createCategory(formData);
    if (result?.errors) {
      // Handle validation errors (though client-side should catch most)
      console.error('Server Validation Errors:', result.errors);
      setError('Validation failed on server.');
      toast.error('Failed to save category. Check fields.');
    } else if (result?.message.startsWith('Error:')) {
      setError(result.message);
      toast.error(result.message);
    } else {
      toast.success(result?.message || (isEditing ? 'Category updated!' : 'Category created!'));
      form.reset(); // Reset form after successful submission
      onFormSubmit(); // Close the dialog/modal
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Electronics" {...field} disabled={isPending || loadingCategoryOptions} />
              </FormControl>
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
                  placeholder="Optional: Describe the category"
                  className="resize-none"
                  {...field}
                  value={field.value ?? ''} // Ensure value is not null/undefined for textarea
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? undefined} // Handle null default value
                disabled={isPending}
                value={field.value ?? undefined} // Controlled component needs value
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">-- No Parent --</SelectItem>
                  {!!categoryOptions &&
                    categoryOptions
                      // Prevent selecting itself as parent during edit
                      ?.filter(option => !(isEditing && option.value === category?.id))
                      .map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
              <FormDescription>Assigning a parent creates a subcategory.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Category'}
        </Button>
      </form>
    </Form>
  );
}
