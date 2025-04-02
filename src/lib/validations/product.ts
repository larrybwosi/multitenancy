import { z } from "zod";

// Define the schema for ProductInput
export const ProductInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  stock: z.number().min(0, "Stock must be a positive number"),
  categoryId: z.string().min(1, "Category is required"),
  image_url: z.string().optional(),
});

// Define the schema for updating a product (all fields optional)
export const UpdateProductInputSchema = ProductInputSchema.partial();

// Define the schema for updating stock
export const UpdateStockInputSchema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
  type: z.enum(["add", "subtract"]),
});

// Infer types from the schemas
type ProductInput = z.infer<typeof ProductInputSchema>;
type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;
type UpdateStockInput = z.infer<typeof UpdateStockInputSchema>;

export type { ProductInput, UpdateProductInput, UpdateStockInput };
