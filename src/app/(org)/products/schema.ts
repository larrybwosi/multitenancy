// lib/schemas.ts
import { z } from "zod";
import { Prisma } from "@prisma/client"; // Import Prisma types

// Helper for Decimal validation if needed, otherwise treat as number/string
const decimalSchema = z
  .union([
    z.number(),
    z.string().refine((val) => !isNaN(parseFloat(val)), {
      message: "Must be a valid number",
    }),
  ])
  .transform((val) => new Prisma.Decimal(val)); // Convert to Prisma.Decimal

export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: decimalSchema, // Use the custom decimal schema
  reorderPoint: z.coerce.number().int().min(0).optional().default(5), // Coerce string input to number
  isActive: z.boolean().default(true),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")), // Single image URL for the form
});

export type ProductFormData = z.infer<typeof productSchema>;

// Optional: Define a type for the product data fetched from the server
export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;
