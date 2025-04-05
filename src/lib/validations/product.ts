import { z } from "zod";
import { ProductType } from "@prisma/client"; // Import enum from prisma client

export const productSchema = z.object({
  // No ID needed for create, added conditionally for update
  name: z
    .string()
    .min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().optional(),
  sku: z.string().optional(), // Add validation if SKU is mandatory or has format
  type: z.nativeEnum(ProductType).default(ProductType.PHYSICAL),
  unit: z
    .string()
    .min(1, { message: "Unit is required (e.g., pcs, kg, hour)." }),
  currentSellingPrice: z.coerce // Coerce input to number before validation
    .number({ invalid_type_error: "Selling price must be a number." })
    .positive({ message: "Selling price must be positive." })
    .multipleOf(0.01, { message: "Price must have at most 2 decimal places." }), // Allow decimals
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;
