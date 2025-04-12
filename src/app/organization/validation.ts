// lib/validators/organization.ts
import * as z from "zod";

// Max file size (e.g., 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Accepted image types
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

export const organizationSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  // Slug is optional on the form, will be generated if empty
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.",
    })
    .optional()
    .or(z.literal("")), // Allow empty string
  logo: z
    .custom<File | null | undefined | string>( // Allow File, null, undefined, or existing string URL
      (file) => file !== undefined, // Make the field itself optional
      "Logo is required." // This message might not show if caught by refine, but good practice
    )
    .refine(
      (file) => !file || typeof file === 'string' || file.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (file) => !file || typeof file === 'string' || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, .webp and .svg formats are supported."
    )
    .nullable() // Allow explicit null for removal
    .optional(), // Allow undefined for initial state / no change
  businessDescription: z.string().optional().or(z.literal("")), // Added field
  metadata: z.string().optional().or(z.literal("")), // Optional field for notes/JSON etc.
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

// Schema specifically for creation, making logo potentially required
export const createOrganizationSchema = organizationSchema.extend({
  logo: organizationSchema.shape.logo.optional(), // Or keep required based on your UX
});

// Schema for updating, making fields potentially optional if needed
export const updateOrganizationSchema = organizationSchema.partial(); // Makes all fields optional
